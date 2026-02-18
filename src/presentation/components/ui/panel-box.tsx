import { cn } from "@/lib/utils";

type PanelVariant = "default" | "cyan" | "purple" | "amber" | "red";

const variantClasses: Record<PanelVariant, string> = {
  default: "border-zinc-800 bg-zinc-900/50",
  cyan: "border-cyan-900/50 bg-zinc-900/50",
  purple: "border-purple-900/50 bg-zinc-900/50",
  amber: "border-amber-900/50 bg-amber-950/20",
  red: "border-red-900/50 bg-red-950/20",
};

interface PanelBoxProps {
  children: React.ReactNode;
  variant?: PanelVariant;
  className?: string;
  padding?: "sm" | "md";
}

export function PanelBox({
  children,
  variant = "default",
  className,
  padding = "md",
}: PanelBoxProps) {
  return (
    <div
      className={cn(
        "rounded-lg border backdrop-blur",
        variantClasses[variant],
        padding === "sm" ? "p-3" : "p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
