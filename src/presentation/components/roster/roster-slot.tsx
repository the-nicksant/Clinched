import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Id } from "@/convex/_generated/dataModel";
import { RosterSelection, PowerUpSelection } from "@/src/shared/types/roster-creation";
import { Crown, Lock, Zap } from "lucide-react";
import Image from "next/image";

// Roster Slot Component
interface RosterSlotProps {
  fighter: any;
  selection: RosterSelection | undefined;
  powerUps: PowerUpSelection[];
  powerUpCardsMap: Map<Id<"powerUpCards">, any>;
  slotNumber: number;
}

export function RosterSlot({
  fighter,
  selection,
  powerUps,
  powerUpCardsMap,
  slotNumber,
}: RosterSlotProps) {
  if (!fighter || !selection) {
    return (
      <div className="group relative aspect-[3/4] overflow-hidden rounded-lg border-2 border-dashed border-cyan-900/30 bg-zinc-900/30 backdrop-blur">
        <div className="flex h-full flex-col items-center justify-center p-2">
          <Lock className="h-6 w-6 text-zinc-700" />
          <span className="mt-2 text-xs font-bold text-zinc-700">
            SLOT {slotNumber}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-lg border-2 border-cyan-500/50 bg-gradient-to-br from-zinc-900 to-zinc-800 shadow-lg shadow-cyan-500/20">
      {/* Captain Badge */}
      {selection.isCaptain && (
        <div className="absolute left-1 top-1 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-600 to-amber-600 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
          <Crown className="h-3 w-3" />C
        </div>
      )}

      {/* Power-up indicators */}
      {powerUps.length > 0 && (
        <div className="absolute right-1 top-1 z-10 flex flex-col gap-1">
          {powerUps.map((pu, i) => {
            const card = powerUpCardsMap.get(pu.powerUpCardId);
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-bold">{card?.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}

      {/* Fighter Image */}
      {fighter.imageUrl && (
        <div className="absolute inset-0">
          <Image
            src={fighter.imageUrl}
            alt={fighter.name}
            fill
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
        </div>
      )}

      {/* Fighter Info */}
      <div className="absolute inset-x-0 bottom-0 p-2">
        <p className="truncate text-xs font-bold text-white drop-shadow-lg">
          {fighter.name}
        </p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-cyan-400">
            {fighter.record.wins}-{fighter.record.losses}-{fighter.record.draws}
          </span>
          <span className="text-xs font-bold text-cyan-400">
            ${selection.salary.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}