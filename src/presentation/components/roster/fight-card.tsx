import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";
import { Crown } from "lucide-react";
import { FighterMiniCard } from "./fighter-mini-card";

export interface FighterMiniCardData {
  _id: Id<"fighters">;
  name: string;
  nickname?: string;
  record: { wins: number; losses: number; draws: number };
  fighterClass: string;
  imageUrl?: string;
}

export interface FightCardProps {
  fight: {
    _id: Id<"fights">;
    weightClass: string;
    isMainEvent: boolean;
    isTitleFight: boolean;
    fighter1Salary: number;
    fighter2Salary: number;
  };
  fighter1: FighterMiniCardData;
  fighter2: FighterMiniCardData;
  isSelected1: boolean;
  isSelected2: boolean;
  onSelect1: () => void;
  onSelect2: () => void;
}

export function FightCard({
  fight,
  fighter1,
  fighter2,
  isSelected1,
  isSelected2,
  onSelect1,
  onSelect2,
}: FightCardProps) {
  return (
    <div className="rounded-lg border border-cyan-900/30 bg-zinc-900/50 backdrop-blur">
      {/* Header */}
      <div className="border-b border-cyan-900/30 bg-zinc-950/50 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wide text-cyan-400">
            {fight.weightClass}
          </span>
          <div className="flex gap-2">
            {fight.isMainEvent && (
              <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-xs">
                Main Event
              </Badge>
            )}
            {fight.isTitleFight && (
              <Badge className="bg-gradient-to-r from-yellow-600 to-amber-600 text-xs">
                <Crown className="mr-1 h-3 w-3" />
                Title
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Fighters */}
      <div className="relative grid grid-cols-2">
        <FighterMiniCard
          fighter={fighter1}
          corner="left"
          salary={fight.fighter1Salary}
          isSelected={isSelected1}
          isOpponentSelected={isSelected2}
          onSelect={onSelect1}
        />

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <span className="text-lg font-bold text-cyan-400">VS</span>
        </div>

        <FighterMiniCard
          fighter={fighter2}
          corner="right"
          salary={fight.fighter2Salary}
          isSelected={isSelected2}
          isOpponentSelected={isSelected1}
          onSelect={onSelect2}
        />
      </div>
    </div>
  );
}
