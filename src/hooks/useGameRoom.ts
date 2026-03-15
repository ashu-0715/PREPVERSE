import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameRoom, GamePlayer, GameQuestion } from "@/types/gamezone";

interface UseGameRoomProps {
  roomId?: string;
  userId?: string;
}

export function useGameRoom({ roomId, userId }: UseGameRoomProps) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [myPlayer, setMyPlayer] = useState<GamePlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch room data
  useEffect(() => {
    if (!roomId) return;

    const fetchRoom = async () => {
      const { data } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      if (data) setRoom(data as unknown as GameRoom);
    };

    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("game_players")
        .select("*")
        .eq("room_id", roomId)
        .order("score", { ascending: false });
      if (data) {
        setPlayers(data as unknown as GamePlayer[]);
        if (userId) {
          const me = (data as unknown as GamePlayer[]).find(p => p.user_id === userId);
          if (me) setMyPlayer(me);
        }
      }
    };

    fetchRoom();
    fetchPlayers();

    // Subscribe to room updates
    const roomChannel = supabase
      .channel(`room-${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as unknown as GameRoom;
          setRoom(updated);
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "game_players", filter: `room_id=eq.${roomId}` },
        () => { fetchPlayers(); }
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "game_answers", filter: `room_id=eq.${roomId}` },
        () => { fetchPlayers(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, userId]);

  // Fetch questions when room starts
  useEffect(() => {
    if (!room || room.status !== "playing" || questions.length > 0) return;
    
    const fetchQuestions = async () => {
      const { data } = await supabase
        .from("game_questions")
        .select("*")
        .eq("question_set_id", room.question_set_id);
      if (data) setQuestions(data as unknown as GameQuestion[]);
    };
    fetchQuestions();
  }, [room?.status, room?.question_set_id]);

  // Set current question based on index
  useEffect(() => {
    if (room && questions.length > 0 && room.current_question_index < questions.length) {
      setCurrentQuestion(questions[room.current_question_index]);
      setTimeLeft(room.question_timer);
    }
  }, [room?.current_question_index, questions]);

  // Timer
  useEffect(() => {
    if (room?.status !== "playing" || !currentQuestion) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [room?.status, currentQuestion?.id]);

  const submitAnswer = useCallback(async (answer: string, timeTakenMs: number) => {
    if (!myPlayer || !currentQuestion || !roomId) return;

    const isCorrect = answer === currentQuestion.correct_answer;
    const basePoints = isCorrect ? 100 : 0;
    const speedBonus = isCorrect ? Math.max(0, Math.floor((timeLeft / (room?.question_timer || 20)) * 50)) : 0;
    const streakBonus = isCorrect ? (myPlayer.streak + 1) * 10 : 0;
    const totalPoints = basePoints + speedBonus + streakBonus;

    // Insert answer
    await supabase.from("game_answers").insert({
      room_id: roomId,
      player_id: myPlayer.id,
      question_id: currentQuestion.id,
      answer,
      is_correct: isCorrect,
      time_taken_ms: timeTakenMs,
      points_earned: totalPoints,
    });

    // Update player score
    const newStreak = isCorrect ? myPlayer.streak + 1 : 0;
    await supabase
      .from("game_players")
      .update({
        score: myPlayer.score + totalPoints,
        streak: newStreak,
        correct_answers: myPlayer.correct_answers + (isCorrect ? 1 : 0),
        total_answered: myPlayer.total_answered + 1,
      })
      .eq("id", myPlayer.id);

    return { isCorrect, points: totalPoints, streak: newStreak };
  }, [myPlayer, currentQuestion, roomId, timeLeft, room?.question_timer]);

  const nextQuestion = useCallback(async () => {
    if (!room || !roomId) return;
    const nextIndex = room.current_question_index + 1;
    
    if (nextIndex >= questions.length) {
      await supabase
        .from("game_rooms")
        .update({ status: "finished", ended_at: new Date().toISOString() })
        .eq("id", roomId);
    } else {
      await supabase
        .from("game_rooms")
        .update({ current_question_index: nextIndex })
        .eq("id", roomId);
    }
  }, [room, roomId, questions.length]);

  return {
    room, players, questions, currentQuestion, timeLeft, myPlayer,
    submitAnswer, nextQuestion,
  };
}
