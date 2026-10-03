import { NavLink, useNavigate } from "react-router-dom";
import { Home, BookOpen, FileText, Users, Compass, Gamepad2, GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/exam", label: "Learn", icon: BookOpen },
  { to: "/notes", label: "Notes", icon: FileText },
  { to: "/skillswap", label: "SkillSwap", icon: Users },
  { to: "/career", label: "Career", icon: Compass },
  { to: "/gamezone", label: "Games", icon: Gamepad2 },
];

export function AppNav({ onLogout }: { onLogout?: () => void }) {
  const navigate = useNavigate();
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 font-extrabold text-lg">
            <span className="w-8 h-8 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <GraduationCap className="w-4 h-4" />
            </span>
            Pathora
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                    isActive && "text-foreground bg-muted",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {onLogout && (
              <Button variant="ghost" size="sm" onClick={onLogout}>
                Log out
              </Button>
            )}
          </div>
        </div>
      </header>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur">
        <div className="grid grid-cols-5">
          {links.slice(0, 5).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground",
                  isActive && "text-primary",
                )
              }
            >
              <l.icon className="w-5 h-5" />
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
