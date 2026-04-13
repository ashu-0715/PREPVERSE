import bgCareer from "@/assets/bg-career.jpg";
import bgNotes from "@/assets/bg-notes.jpg";
import bgSkillswap from "@/assets/bg-skillswap.jpg";
import bgGamezone from "@/assets/bg-gamezone.jpg";

type ModuleTheme = "career" | "notes" | "skillswap" | "gamezone" | "exam" | "tracker";

const backgroundMap: Record<string, string> = {
  career: bgCareer,
  notes: bgNotes,
  skillswap: bgSkillswap,
  gamezone: bgGamezone,
  exam: bgCareer,
  tracker: bgNotes,
};

const ModuleBackground = ({ theme }: { theme: ModuleTheme }) => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <img
        src={backgroundMap[theme]}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-background/85 dark:bg-background/90" />
    </div>
  );
};

export default ModuleBackground;
