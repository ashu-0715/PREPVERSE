import bgCareer from "@/assets/bg-career.jpg";
import bgCareer2 from "@/assets/bg-career-2.jpg";
import bgCareer3 from "@/assets/bg-career-3.jpg";
import bgNotes from "@/assets/bg-notes.jpg";
import bgNotes2 from "@/assets/bg-notes-2.jpg";
import bgNotes3 from "@/assets/bg-notes-3.jpg";
import bgSkillswap from "@/assets/bg-skillswap.jpg";
import bgSkillswap2 from "@/assets/bg-skillswap-2.jpg";
import bgSkillswap3 from "@/assets/bg-skillswap-3.jpg";
import bgGamezone from "@/assets/bg-gamezone.jpg";
import bgGamezone2 from "@/assets/bg-gamezone-2.jpg";
import bgGamezone3 from "@/assets/bg-gamezone-3.jpg";

type ModuleTheme = "career" | "notes" | "skillswap" | "gamezone" | "exam" | "tracker";

const collageMap: Record<string, string[]> = {
  career: [bgCareer, bgCareer2, bgCareer3],
  notes: [bgNotes, bgNotes2, bgNotes3],
  skillswap: [bgSkillswap, bgSkillswap2, bgSkillswap3],
  gamezone: [bgGamezone, bgGamezone2, bgGamezone3],
  exam: [bgCareer, bgCareer2, bgCareer3],
  tracker: [bgNotes, bgNotes2, bgNotes3],
};

const ModuleBackground = ({ theme }: { theme: ModuleTheme }) => {
  const images = collageMap[theme];

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Collage grid: 1 wide image on left, 2 stacked squares on right */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1">
        <div className="col-span-2 row-span-2 overflow-hidden">
          <img
            src={images[0]}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="col-span-1 row-span-1 overflow-hidden">
          <img
            src={images[1]}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="col-span-1 row-span-1 overflow-hidden">
          <img
            src={images[2]}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
      <div className="absolute inset-0 bg-background/75 dark:bg-background/80" />
    </div>
  );
};

export default ModuleBackground;
