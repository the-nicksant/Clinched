import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import Image from "next/image";
import type { FighterMiniCardData } from "./fight-card";

interface FighterMiniCardProps {
  fighter: FighterMiniCardData;
  corner: "left" | "right";
  salary: number;
  isSelected: boolean;
  isOpponentSelected: boolean;
  onSelect: () => void;
}

export function FighterMiniCard({
  fighter,
  corner,
  salary,
  isSelected,
  isOpponentSelected,
  onSelect,
}: FighterMiniCardProps) {
  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-3 bg-zinc-900 transition-colors",
        corner === "left" ? "flex-row" : "flex-row-reverse",
        isSelected && "bg-gradient-to-r",
        isSelected && corner === "left" && "from-cyan-800 to-transparent",
        isSelected && corner === "right" && "from-transparent to-cyan-800",
        isOpponentSelected && "pointer-events-none opacity-40",
      )}
    >
      <div className="relative h-[200px] w-[200px] flex-shrink-0 overflow-hidden bg-cyan-900">
        <Image
          src={fighter.imageUrl || "/placeholder-fighter.png"}
          alt={fighter.name}
          fill
          className="object-cover"
        />
        {!isOpponentSelected && (
          <Button
            onClick={onSelect}
            className="absolute bottom-2 left-1/2 w-[90%] -translate-x-1/2 uppercase"
            variant={isSelected ? "destructive" : "default"}
          >
            {isSelected ? (
              <>
                <X className="h-4 w-4" />
                Remove
              </>
            ) : (
              <>Pick for ${salary.toLocaleString()}</>
            )}
          </Button>
        )}
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col p-4",
          corner === "right" && "items-end text-right"
        )}
      >
        <h2 className="text-xl font-bold uppercase text-white">
          {fighter.name}
        </h2>
        {fighter.nickname && (
          <p className="text-base text-cyan-400">&quot;{fighter.nickname}&quot;</p>
        )}
        <p className="text-sm text-zinc-400">
          {fighter.record.wins}-{fighter.record.losses}-{fighter.record.draws}
        </p>
        <Badge
          variant="outline"
          className="mt-1 w-fit border-cyan-700 text-xs text-cyan-400"
        >
          {fighter.fighterClass}
        </Badge>
      </div>
    </div>
  );
}
