"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useState, useMemo, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ROSTER_CONFIG, SYNERGY_CONFIG } from "@/src/shared/constants/game-config";
import { Sparkles, Zap } from "lucide-react";
import { PowerUpSelection, RosterSelection } from "@/src/shared/types/roster-creation";
import { RosterSlot } from "@/src/presentation/components/roster/roster-slot";
import { FightCard } from "@/src/presentation/components/roster/fight-card";
import { PanelBox } from "@/src/presentation/components/ui/panel-box";

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as Id<"events">;
  const { user, isSignedIn } = useUser();

  // Queries
  const event = useQuery(api.functions.events.getById, { id: eventId });
  const fights = useQuery(api.functions.events.getFights, { eventId });
  const fighterIds = useMemo(() => {
    if (!fights) return [];
    const ids = new Set<Id<"fighters">>();
    fights.forEach((fight) => {
      ids.add(fight.fighter1Id);
      ids.add(fight.fighter2Id);
    });
    return Array.from(ids);
  }, [fights]);
  const fighters = useQuery(
    api.functions.fighters.getByIds,
    fighterIds.length > 0 ? { ids: fighterIds } : "skip"
  );
  const powerUpCards = useQuery(api.functions.powerUpCards.getActive);

  const convexUser = useQuery(
    api.functions.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const existingRoster = useQuery(
    api.functions.rosters.getByUserAndEvent,
    convexUser?._id ? { userId: convexUser._id, eventId } : "skip"
  );

  // Mutations
  const createUser = useMutation(api.functions.users.create);
  const createRoster = useMutation(api.functions.rosters.create);
  const updateRoster = useMutation(api.functions.rosters.update);

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [selections, setSelections] = useState<RosterSelection[]>([]);
  const [powerUpSelections, setPowerUpSelections] = useState<PowerUpSelection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing roster data when available
  useEffect(() => {
    if (existingRoster && !isEditing) {
      setSelections(existingRoster.fighters.map(f => ({
        fighterId: f.fighterId,
        fightId: f.fightId,
        salary: f.salary,
        isCaptain: f.isCaptain,
      })));
      setPowerUpSelections(existingRoster.powerUps);
    }
  }, [existingRoster, isEditing]);

  // Fighter map
  const fighterMap = useMemo<Map<Id<"fighters">, Doc<"fighters">>>(() => {
    if (!fighters) return new Map();
    return new Map(fighters.map((f) => [f._id, f]));
  }, [fighters]);

  // Power-up cards map
  const powerUpCardsMap = useMemo(() => {
    if (!powerUpCards) return new Map();
    return new Map(powerUpCards.map((p) => [p._id, p]));
  }, [powerUpCards]);

  // Calculate totals
  const totalSalary = useMemo(
    () => selections.reduce((sum, s) => sum + s.salary, 0),
    [selections]
  );

  // Calculate synergy bonuses
  const synergyBonuses = useMemo(() => {
    const bonuses: string[] = [];
    if (selections.length < SYNERGY_CONFIG.MIN_FIGHTERS_FOR_SYNERGY) return bonuses;

    // Count by fighter class
    const classCounts: Record<string, number> = {};
    selections.forEach((s) => {
      const fighter = fighterMap.get(s.fighterId);
      if (fighter) {
        classCounts[fighter.fighterClass] = (classCounts[fighter.fighterClass] || 0) + 1;
      }
    });

    // Check synergies
    Object.entries(classCounts).forEach(([fighterClass, count]) => {
      if (count >= SYNERGY_CONFIG.MIN_FIGHTERS_FOR_SYNERGY) {
        if (fighterClass === "Striker") {
          bonuses.push("Striker Synergy: 1.15× multiplier on KO/TKO wins");
        } else if (fighterClass === "Grappler") {
          bonuses.push("Grappler Synergy: 1.15× multiplier on Submission wins");
        } else if (fighterClass === "All-Rounder") {
          bonuses.push("All-Rounder Synergy: +10 bonus points for decisions");
        } else if (fighterClass === "Veteran") {
          bonuses.push("Veteran Synergy: +10 bonus if any fighter wins");
        }
      }
    });

    return bonuses;
  }, [selections, fighterMap]);

  // Sorted fights
  const sortedFights = useMemo(() => {
    if (!fights) return [];
    return [...fights].sort((a, b) => a.cardPosition - b.cardPosition);
  }, [fights]);

  // Helper functions
  const isSelected = useCallback(
    (fighterId: Id<"fighters">) =>
      selections.some((s) => s.fighterId === fighterId),
    [selections]
  );

  const getFightSelection = useCallback(
    (fightId: Id<"fights">) => selections.find((s) => s.fightId === fightId),
    [selections]
  );

  const toggleFighter = useCallback(
    (fighterId: Id<"fighters">, fightId: Id<"fights">, salary: number) => {
      setError(null);

      if (isSelected(fighterId)) {
        setSelections((prev) => prev.filter((s) => s.fighterId !== fighterId));
        // Remove associated power-ups
        setPowerUpSelections((prev) => prev.filter((p) => p.appliedToFighterId !== fighterId));
        return;
      }

      const existingFromFight = getFightSelection(fightId);
      if (existingFromFight) {
        setSelections((prev) =>
          prev.map((s) =>
            s.fightId === fightId
              ? { fighterId, fightId, salary, isCaptain: s.isCaptain }
              : s
          )
        );
        // Transfer power-ups to new fighter
        setPowerUpSelections((prev) =>
          prev.map((p) =>
            p.appliedToFighterId === existingFromFight.fighterId
              ? { ...p, appliedToFighterId: fighterId }
              : p
          )
        );
        return;
      }

      if (selections.length >= ROSTER_CONFIG.MAX_FIGHTERS) {
        setError(
          `Maximum ${ROSTER_CONFIG.MAX_FIGHTERS} fighters allowed in roster`
        );
        return;
      }

      if (totalSalary + salary > ROSTER_CONFIG.SALARY_CAP) {
        setError(
          `Adding this fighter would exceed $${ROSTER_CONFIG.SALARY_CAP.toLocaleString()} salary cap`
        );
        return;
      }

      setSelections((prev) => [
        ...prev,
        { fighterId, fightId, salary, isCaptain: false },
      ]);
    },
    [isSelected, getFightSelection, selections.length, totalSalary]
  );

  const toggleCaptain = useCallback((fighterId: Id<"fighters">) => {
    setSelections((prev) =>
      prev.map((s) => ({
        ...s,
        isCaptain: s.fighterId === fighterId ? !s.isCaptain : false,
      }))
    );
  }, []);

  const togglePowerUp = useCallback((powerUpCardId: Id<"powerUpCards">, fighterId: Id<"fighters">) => {
    setPowerUpSelections((prev) => {
      // Check if this fighter already has this power-up
      const existing = prev.find(
        (p) => p.powerUpCardId === powerUpCardId && p.appliedToFighterId === fighterId
      );

      if (existing) {
        // Remove it
        return prev.filter((p) => p !== existing);
      }

      // Check max power-ups limit
      if (prev.length >= ROSTER_CONFIG.MAX_POWER_UPS) {
        setError(`Maximum ${ROSTER_CONFIG.MAX_POWER_UPS} power-ups allowed`);
        return prev;
      }

      // Add it
      return [...prev, { powerUpCardId, appliedToFighterId: fighterId }];
    });
  }, []);

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];

    if (selections.length !== ROSTER_CONFIG.MAX_FIGHTERS) {
      errors.push(
        `Select ${ROSTER_CONFIG.MAX_FIGHTERS} fighters (${selections.length}/${ROSTER_CONFIG.MAX_FIGHTERS})`
      );
    }

    const captainCount = selections.filter((s) => s.isCaptain).length;
    if (captainCount !== ROSTER_CONFIG.REQUIRED_CAPTAINS) {
      errors.push("Select 1 captain");
    }

    if (totalSalary > ROSTER_CONFIG.SALARY_CAP) {
      errors.push(
        `Over salary cap by $${(totalSalary - ROSTER_CONFIG.SALARY_CAP).toLocaleString()}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [selections, totalSalary]);

  // Submit roster
  const handleSubmit = async () => {
    if (!isSignedIn || !user) {
      setError("Please sign in to submit a roster");
      return;
    }

    if (!validation.isValid) {
      setError(validation.errors.join(", "));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let userId = convexUser?._id;
      if (!userId) {
        userId = await createUser({
          clerkId: user.id,
          username:
            user.username || user.firstName || `user_${user.id.slice(0, 8)}`,
          email: user.primaryEmailAddress?.emailAddress || "",
          avatarUrl: user.imageUrl,
        });
      }

      if (existingRoster && isEditing) {
        // Update existing roster
        await updateRoster({
          id: existingRoster._id,
          fighters: selections,
          totalSalary,
          powerUps: powerUpSelections,
        });
      } else {
        // Create new roster
        await createRoster({
          userId: userId as Id<"users">,
          eventId,
          fighters: selections,
          totalSalary,
          powerUps: powerUpSelections,
        });
      }

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit roster");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (!event || !fights || !fighters || !powerUpCards) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="container mx-auto p-4">
          <div className="mb-6 space-y-2">
            <div className="h-8 w-64 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-48 animate-pulse rounded bg-zinc-800" />
          </div>
          <div className="flex gap-6">
            <div className="flex-1 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-lg bg-zinc-800/50" />
              ))}
            </div>
            <div className="w-[420px] space-y-4">
              <div className="h-96 animate-pulse rounded-lg bg-zinc-800/50" />
              <div className="h-32 animate-pulse rounded-lg bg-zinc-800/50" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View mode (roster already submitted)
  if (existingRoster && !isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        {/* Header */}
        <div className="border-b border-cyan-900/30 bg-zinc-950/80 backdrop-blur">
          <div className="container mx-auto flex items-center justify-between px-4 py-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {event.name}
              </h1>
              <p className="mt-1 text-cyan-400">
                {format(new Date(event.eventDate), "PPP")} • {event.location}
              </p>
            </div>
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              Edit Roster
            </Button>
          </div>
        </div>

        {/* Synergy Alert */}
        {synergyBonuses.length > 0 && (
          <div className="container mx-auto px-4 pt-4">
            <Alert className="border-cyan-500/50 bg-cyan-950/30 backdrop-blur">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <AlertDescription className="text-cyan-100">
                <span className="font-semibold">Synergy Bonuses Active:</span>
                <ul className="mt-1 list-inside list-disc">
                  {synergyBonuses.map((bonus, i) => (
                    <li key={i}>{bonus}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Roster Display */}
        <div className="container mx-auto space-y-6 p-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 text-center text-xl font-bold uppercase tracking-wider text-white">
              Your Roster
            </h2>

            {/* Roster Grid */}
            <div className="mb-6 grid grid-cols-6 gap-3">
              {existingRoster.fighters.map((selection) => {
                const fighter = fighterMap.get(selection.fighterId);
                if (!fighter) return null;

                return (
                  <RosterSlot
                    key={selection.fighterId}
                    fighter={fighter}
                    selection={selection}
                    powerUps={existingRoster.powerUps.filter(
                      (p) => p.appliedToFighterId === selection.fighterId
                    )}
                    powerUpCardsMap={powerUpCardsMap}
                    slotNumber={existingRoster.fighters.indexOf(selection) + 1}
                  />
                );
              })}
            </div>

            {/* Salary Display */}
            <PanelBox variant="cyan" className="mb-6">
              <div className="flex justify-between">
                <span className="font-bold uppercase tracking-wide text-zinc-400">
                  Total Salary
                </span>
                <span className="font-bold text-cyan-400">
                  ${existingRoster.totalSalary.toLocaleString()} / $
                  {ROSTER_CONFIG.SALARY_CAP.toLocaleString()}
                </span>
              </div>
            </PanelBox>

            {/* Power-ups Display */}
            {existingRoster.powerUps.length > 0 && (
              <PanelBox variant="purple">
                <h3 className="mb-3 font-bold uppercase tracking-wide text-white">
                  Power-Ups Applied
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {existingRoster.powerUps.map((powerUp, i) => {
                    const card = powerUpCardsMap.get(powerUp.powerUpCardId);
                    const fighter = fighterMap.get(powerUp.appliedToFighterId);
                    if (!card || !fighter) return null;

                    return (
                      <div
                        key={i}
                        className="rounded-lg border border-purple-500/50 bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-3"
                      >
                        <div className="flex items-start gap-2">
                          <Zap className="h-5 w-5 flex-shrink-0 text-purple-400" />
                          <div className="flex-1">
                            <p className="font-bold text-white">{card.name}</p>
                            <p className="text-sm text-purple-300">
                              Applied to: {fighter.name}
                            </p>
                            <p className="mt-1 text-xs text-zinc-400">
                              {card.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PanelBox>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit/Create mode
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="border-b border-cyan-900/30 bg-zinc-950/80 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {event.name}
          </h1>
          <p className="mt-1 text-cyan-400">
            {format(new Date(event.eventDate), "PPP")} • {event.location}
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="container mx-auto grid grid-cols-5 gap-6 p-4">
        {/* Left Side - Fight List (natural scroll, no fixed height) */}
        <div className="col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Fight Card</h2>
            <Badge
              variant="outline"
              className="border-cyan-500 bg-cyan-950/50 text-cyan-300"
            >
              {selections.length}/{ROSTER_CONFIG.MAX_FIGHTERS} Selected
            </Badge>
          </div>

          <div className="space-y-3">
            {sortedFights.map((fight) => {
              const fighter1 = fighterMap.get(fight.fighter1Id);
              const fighter2 = fighterMap.get(fight.fighter2Id);

              if (!fighter1 || !fighter2) return null;

              return (
                <FightCard
                  key={fight._id}
                  fight={fight}
                  fighter1={fighter1}
                  fighter2={fighter2}
                  isSelected1={isSelected(fighter1._id)}
                  isSelected2={isSelected(fighter2._id)}
                  onSelect1={() =>
                    toggleFighter(fighter1._id, fight._id, fight.fighter1Salary)
                  }
                  onSelect2={() =>
                    toggleFighter(fighter2._id, fight._id, fight.fighter2Salary)
                  }
                />
              );
            })}
          </div>
        </div>

        {/* Right Side - Sticky Roster Panel */}
        <div className="col-span-2">
          <div className="sticky top-24 space-y-4">
            {/* Roster Grid */}
            <div>
              <h2 className="mb-3 text-center text-xl font-bold uppercase tracking-wider text-white">
                Your Roster
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: ROSTER_CONFIG.MAX_FIGHTERS }).map((_, i) => {
                  const selection = selections[i];
                  const fighter = selection
                    ? fighterMap.get(selection.fighterId)
                    : null;
                  const fighterPowerUps = selection
                    ? powerUpSelections.filter(
                        (p) => p.appliedToFighterId === selection.fighterId
                      )
                    : [];

                  return (
                    <RosterSlot
                      key={i}
                      fighter={fighter}
                      selection={selection}
                      powerUps={fighterPowerUps}
                      powerUpCardsMap={powerUpCardsMap}
                      availablePowerUpCards={powerUpCards}
                      maxPowerUpsReached={
                        powerUpSelections.length >= ROSTER_CONFIG.MAX_POWER_UPS
                      }
                      slotNumber={i + 1}
                      onRemove={
                        selection
                          ? () => {
                              setSelections((prev) =>
                                prev.filter(
                                  (s) => s.fighterId !== selection.fighterId
                                )
                              );
                              setPowerUpSelections((prev) =>
                                prev.filter(
                                  (p) =>
                                    p.appliedToFighterId !== selection.fighterId
                                )
                              );
                            }
                          : undefined
                      }
                      onToggleCaptain={
                        selection
                          ? () => toggleCaptain(selection.fighterId)
                          : undefined
                      }
                      onAssignPowerUp={
                        selection
                          ? (powerUpCardId) =>
                              togglePowerUp(powerUpCardId, selection.fighterId)
                          : undefined
                      }
                      onRemovePowerUp={
                        selection
                          ? (powerUpCardId) =>
                              togglePowerUp(powerUpCardId, selection.fighterId)
                          : undefined
                      }
                    />
                  );
                })}
              </div>
              <p className="mt-2 text-center text-xs text-zinc-500">
                Right-click a fighter card to interact
              </p>
            </div>

            {/* Synergy Bonuses (moved here) */}
            {synergyBonuses.length > 0 && (
              <Alert className="border-cyan-500/50 bg-cyan-950/30 backdrop-blur">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <AlertDescription className="text-cyan-100">
                  <span className="text-xs font-semibold">Synergies Active:</span>
                  <ul className="mt-1 space-y-0.5">
                    {synergyBonuses.map((bonus, i) => (
                      <li key={i} className="text-xs">• {bonus}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Salary */}
            <PanelBox variant="cyan" padding="sm">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-zinc-400">SALARY CAP</span>
                <span
                  className={
                    totalSalary > ROSTER_CONFIG.SALARY_CAP
                      ? "font-bold text-red-400"
                      : "font-bold text-cyan-400"
                  }
                >
                  ${totalSalary.toLocaleString()} / $
                  {ROSTER_CONFIG.SALARY_CAP.toLocaleString()}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    totalSalary > ROSTER_CONFIG.SALARY_CAP
                      ? "bg-gradient-to-r from-red-500 to-red-600"
                      : "bg-gradient-to-r from-cyan-500 to-blue-500"
                  }`}
                  style={{
                    width: `${Math.min(100, (totalSalary / ROSTER_CONFIG.SALARY_CAP) * 100)}%`,
                  }}
                />
              </div>
            </PanelBox>

            {/* Power-Up Status (visual only) */}
            <PanelBox variant="purple" padding="sm">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Power-Up Deck
                </h3>
                <Badge
                  variant="outline"
                  className="border-purple-500/50 bg-purple-950/50 text-xs text-purple-300"
                >
                  {powerUpSelections.length}/{ROSTER_CONFIG.MAX_POWER_UPS} used
                </Badge>
              </div>
              <div className="space-y-1.5">
                {powerUpCards.map((card) => {
                  const assignment = powerUpSelections.find(
                    (p) => p.powerUpCardId === card._id
                  );
                  const assignedFighter = assignment
                    ? fighterMap.get(assignment.appliedToFighterId)
                    : null;

                  return (
                    <div
                      key={card._id}
                      className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                        assignment
                          ? "bg-purple-950/50 text-purple-200"
                          : "bg-zinc-800/50 text-zinc-500"
                      }`}
                    >
                      <Zap
                        className={`h-3 w-3 flex-shrink-0 ${assignment ? "text-purple-400" : "text-zinc-600"}`}
                      />
                      <span className="flex-1 font-medium">{card.name}</span>
                      {assignment && assignedFighter ? (
                        <span className="text-purple-400">
                          → {assignedFighter.name.split(" ").pop()}
                        </span>
                      ) : (
                        <span className="text-zinc-600">Available</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {selections.length > 0 && powerUpSelections.length < ROSTER_CONFIG.MAX_POWER_UPS && (
                <p className="mt-2 text-center text-[10px] text-zinc-500">
                  Right-click a roster card to assign
                </p>
              )}
            </PanelBox>

            {/* Validation errors */}
            {!validation.isValid && selections.length > 0 && (
              <PanelBox variant="amber" padding="sm">
                {validation.errors.map((err, i) => (
                  <p key={i} className="text-xs text-amber-400">
                    • {err}
                  </p>
                ))}
              </PanelBox>
            )}

            {error && (
              <PanelBox variant="red" padding="sm">
                <p className="text-sm text-red-400">{error}</p>
              </PanelBox>
            )}

            {/* Submit */}
            {isSignedIn ? (
              <div className="space-y-2">
                <Button
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-lg font-bold uppercase tracking-wide hover:from-cyan-500 hover:to-blue-500"
                  size="lg"
                  disabled={!validation.isValid || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting
                    ? "Saving..."
                    : existingRoster && isEditing
                      ? "Update Roster"
                      : "Submit Roster"}
                </Button>
                {existingRoster && isEditing && (
                  <Button
                    variant="outline"
                    className="w-full border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-center text-sm text-zinc-500">
                Sign in to submit your roster
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

