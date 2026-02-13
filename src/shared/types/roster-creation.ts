import { Id } from "@/convex/_generated/dataModel";

export interface RosterSelection {
  fighterId: Id<"fighters">;
  fightId: Id<"fights">;
  salary: number;
  isCaptain: boolean;
}

export interface PowerUpSelection {
  powerUpCardId: Id<"powerUpCards">;
  appliedToFighterId: Id<"fighters">;
}