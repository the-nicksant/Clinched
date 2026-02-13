import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Crown, X } from "lucide-react";
import Image from "next/image";

// Fight Card Component (Side-by-side fighters)
interface FightCardProps {
  fight: {
    _id: Id<"fights">;
    weightClass: string;
    isMainEvent: boolean;
    isTitleFight: boolean;
    fighter1Salary: number;
    fighter2Salary: number;
  };
  fighter1: {
    _id: Id<"fighters">;
    name: string;
    nickname?: string;
    record: { wins: number; losses: number; draws: number };
    fighterClass: string;
    imageUrl?: string;
  };
  fighter2: {
    _id: Id<"fighters">;
    name: string;
    nickname?: string;
    record: { wins: number; losses: number; draws: number };
    fighterClass: string;
    imageUrl?: string;
  };
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
              <Badge className="bg-linear-to-r from-amber-600 to-orange-600 text-xs">
                Main Event
              </Badge>
            )}
            {fight.isTitleFight && (
              <Badge className="bg-linear-to-r from-yellow-600 to-amber-600 text-xs">
                <Crown className="mr-1 h-3 w-3" />
                Title
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Fighters */}
      <div className="grid grid-cols-2">
        {/* Fighter 1 */}
        <FighterMiniCard
          fighter={fighter1}
          corner="left"
          salary={fight.fighter1Salary}
          isSelected={isSelected1}
          isOpponentSelected={isSelected2}
          onSelect={onSelect1}
        />

        {/* Fighter 2 */}
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

// Fighter Mini Card (for fight selection)
interface FighterMiniCardProps {
  fighter: {
    _id: Id<"fighters">;
    name: string;
    nickname?: string;
    record: { wins: number; losses: number; draws: number };
    fighterClass: string;
    imageUrl?: string;
  };
  corner: 'left' | 'right';
  salary: number;
  isSelected: boolean;
  isOpponentSelected: boolean;
  onSelect: () => void;
}

function FighterMiniCard({
  fighter,
  corner,
  salary,
  isSelected,
  isOpponentSelected,
  onSelect,
}: FighterMiniCardProps) {
  return (
    <div className={cn(
      "flex cursor-pointer items-center gap-3 bg-zinc-900 transition-colors",
      corner === 'left' ? 'flex-row' : 'flex-row-reverse',
      isSelected && corner === 'left' ? "bg-linear-to-r" : 'bg-linear-to-l',
      isSelected && "from-cyan-800 to-transparent",
    )}>
      <div className="h-50 w-50 overflow-hidden bg-cyan-900 relative z-10">
        <Image
          src={fighter.imageUrl || "/placeholder-fighter.png"}
          alt={fighter.name}
          width={200}
          height={200}
          className="object-cover w-full"
        />

        <Button
          onClick={onSelect}
          className="absolute bottom-2 right-1/2 translate-x-1/2 bg-cyan-600 hover:bg-cyan-500 text-white uppercase"
          variant={isSelected ? "destructive" : "default"}
          hidden={isOpponentSelected}
        >
          {!isSelected 
            ? <>
                PICK FOR {salary}
              </>
            : <>
                <X className="h-4 w-4" />
                Remove from roster
              </>
          }
        </Button>
      </div>
      <div className={cn("w-full flex-1 flex", corner === 'left' ? 'pl-4 flex-row' : 'pr-4 flex-row-reverse text-right')}>
        <header>
          <h1 className="text-2xl font-bold uppercase">{fighter.name}</h1>
          {fighter.nickname && (
            <p className="text-xl text-cyan-400">&quot;{fighter.nickname}&quot;</p>
          )}
          <p className="text-sm text-cyan-400">
            {fighter.record.wins}-{fighter.record.losses}-{fighter.record.draws}
          </p>
        </header>
      </div>
    </div>
  );
}