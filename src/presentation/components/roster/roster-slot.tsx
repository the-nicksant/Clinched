"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { RosterSelection, PowerUpSelection } from "@/src/shared/types/roster-creation";
import { Check, Crown, Lock, Trash2, UserCheck, Zap } from "lucide-react";
import Image from "next/image";

interface PowerUpCard {
  _id: Id<"powerUpCards">;
  name: string;
  description: string;
}

// Roster Slot Component
interface RosterSlotProps {
  fighter?: Doc<"fighters"> | null;
  selection?: RosterSelection;
  powerUps: PowerUpSelection[];
  powerUpCardsMap: Map<Id<"powerUpCards">, { name: string }>;
  availablePowerUpCards?: PowerUpCard[];
  slotNumber: number;
  // Interaction callbacks (undefined = view-only mode)
  onRemove?: () => void;
  onToggleCaptain?: () => void;
  onAssignPowerUp?: (powerUpCardId: Id<"powerUpCards">) => void;
  onRemovePowerUp?: (powerUpCardId: Id<"powerUpCards">) => void;
  maxPowerUpsReached?: boolean;
}

export function RosterSlot({
  fighter,
  selection,
  powerUps,
  powerUpCardsMap,
  availablePowerUpCards = [],
  slotNumber,
  onRemove,
  onToggleCaptain,
  onAssignPowerUp,
  onRemovePowerUp,
  maxPowerUpsReached = false,
}: RosterSlotProps) {
  const isInteractive = !!onRemove;

  if (!fighter || !selection) {
    return (
      <div className="group relative aspect-[2/3] overflow-hidden rounded-lg border-2 border-dashed border-cyan-900/30 bg-zinc-900/30 backdrop-blur">
        <div className="flex h-full flex-col items-center justify-center p-2">
          <Lock className="h-6 w-6 text-zinc-700" />
          <span className="mt-2 text-xs font-bold text-zinc-700">
            SLOT {slotNumber}
          </span>
        </div>
      </div>
    );
  }

  const card = (
    <div className="relative aspect-[2/3] cursor-pointer overflow-hidden rounded-lg border-2 border-cyan-500/50 bg-gradient-to-br from-zinc-900 to-zinc-800 shadow-lg shadow-cyan-500/20 transition-all hover:border-cyan-400/70 hover:shadow-cyan-400/30 select-none">
      {/* Captain Badge */}
      {selection.isCaptain && (
        <div className="absolute left-1 top-1 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 px-2 py-0.5 text-xs font-bold text-black shadow-lg">
          <Crown className="h-3 w-3" />
          <span>C</span>
        </div>
      )}

      {/* Power-up indicators */}
      {powerUps.length > 0 && (
        <div className="absolute right-1 top-1 z-10 flex flex-col gap-1">
          {powerUps.map((pu, i) => {
            const card = powerUpCardsMap.get(pu.powerUpCardId);
            return (
              <div
                key={i}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg"
                title={card?.name}
              >
                <Zap className="h-3 w-3 text-white" />
              </div>
            );
          })}
        </div>
      )}

      {/* Card frame overlay */}
      <Image
        src="/assets/CARD-FRAME.png"
        alt=""
        fill
        className="pointer-events-none z-[5] object-cover opacity-70"
      />

      {/* Fighter Image */}
      {fighter.imageUrl ? (
        <div className="absolute inset-0">
          <Image
            src={fighter.imageUrl}
            alt={fighter.name}
            fill
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
          <span className="text-3xl text-zinc-600">?</span>
        </div>
      )}

      {/* Fighter Info */}
      <div className="absolute inset-x-0 bottom-0 z-[6] bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent px-2 pb-2 pt-6">
        {fighter.nickname && (
          <small className="block truncate text-[9px] text-cyan-400">
            &quot;{fighter.nickname}&quot;
          </small>
        )}
        <p className="truncate text-xs font-bold leading-tight text-white">
          {fighter.name}
        </p>
        <p className="mt-0.5 text-[10px] font-bold text-cyan-400">
          ${selection.salary.toLocaleString()}
        </p>
      </div>

      {/* Hover overlay hint */}
      {isInteractive && (
        <div className="absolute inset-0 z-[7] flex items-center justify-center bg-zinc-950/0 opacity-0 transition-all group-hover:bg-zinc-950/20 group-hover:opacity-100">
          <span className="rounded bg-zinc-900/80 px-2 py-1 text-[10px] text-zinc-400">
            Right-click
          </span>
        </div>
      )}
    </div>
  );

  if (!isInteractive) {
    return card;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="group">{card}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52 border-zinc-700 bg-zinc-900 text-white">
        <ContextMenuLabel className="text-xs text-zinc-400">
          {fighter.name}
        </ContextMenuLabel>
        <ContextMenuSeparator className="bg-zinc-700" />

        {/* Captain toggle */}
        <ContextMenuItem
          onClick={onToggleCaptain}
          className="flex cursor-pointer items-center gap-2 text-sm hover:bg-zinc-800 focus:bg-zinc-800"
        >
          {selection.isCaptain ? (
            <>
              <Crown className="h-4 w-4 text-yellow-500" />
              <span>Remove Captain</span>
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4 text-yellow-400" />
              <span>Set as Captain</span>
            </>
          )}
          {selection.isCaptain && <Check className="ml-auto h-3 w-3 text-yellow-400" />}
        </ContextMenuItem>

        {/* Power-up submenu */}
        {availablePowerUpCards.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2 text-sm hover:bg-zinc-800 focus:bg-zinc-800">
              <Zap className="h-4 w-4 text-purple-400" />
              <span>Power-Ups</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-56 border-zinc-700 bg-zinc-900 text-white">
              <ContextMenuLabel className="text-xs text-zinc-400">
                Apply to {fighter.name}
              </ContextMenuLabel>
              <ContextMenuSeparator className="bg-zinc-700" />
              {availablePowerUpCards.map((pu) => {
                const alreadyApplied = powerUps.some(
                  (p) => p.powerUpCardId === pu._id
                );
                const isUsedElsewhere =
                  !alreadyApplied &&
                  (maxPowerUpsReached ||
                    powerUps.some(
                      (p) =>
                        p.powerUpCardId === pu._id &&
                        p.appliedToFighterId !== selection.fighterId
                    ));

                return (
                  <ContextMenuItem
                    key={pu._id}
                    disabled={isUsedElsewhere}
                    onClick={() => {
                      if (alreadyApplied) {
                        onRemovePowerUp?.(pu._id);
                      } else {
                        onAssignPowerUp?.(pu._id);
                      }
                    }}
                    className="flex cursor-pointer items-center gap-2 text-sm hover:bg-zinc-800 focus:bg-zinc-800 disabled:opacity-40"
                  >
                    <Zap
                      className={`h-3 w-3 ${alreadyApplied ? "text-purple-400" : "text-zinc-500"}`}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{pu.name}</p>
                      <p className="text-[10px] text-zinc-500 line-clamp-1">
                        {pu.description}
                      </p>
                    </div>
                    {alreadyApplied && (
                      <Check className="ml-auto h-3 w-3 text-purple-400" />
                    )}
                  </ContextMenuItem>
                );
              })}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        <ContextMenuSeparator className="bg-zinc-700" />

        {/* Remove */}
        <ContextMenuItem
          onClick={onRemove}
          className="flex cursor-pointer items-center gap-2 text-sm text-red-400 hover:bg-red-950/50 hover:text-red-300 focus:bg-red-950/50 focus:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
          <span>Remove from Roster</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
