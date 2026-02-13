# Power-Up Cards Refactor Summary

## What We've Implemented ✅

### 1. **New Domain Entities**
- **PowerUpCard** (`src/domain/entities/PowerUpCard.ts`)
  - Data-driven card entity with configurable name, description, and effects
  - Stores in Convex database for easy updates without code changes

### 2. **Effect Type System**
- **PowerUpEffectType** (`src/domain/value-objects/PowerUpEffectType.ts`)
  - Defines 4 effect types: `multiplier_win_loss`, `loss_to_win_with_bonus`, `multiplier_round_finish`, `flat_bonus_per_ufc_bonus`
  - Each effect type has its own configuration interface
  - Type guards for type-safe config access

### 3. **Updated Convex Schema**
- **powerUpCards table** - Stores card definitions
  - name, description (easily updatable)
  - effectType, effectConfig (determines behavior)
  - isActive (can enable/disable cards)
  - cost, imageUrl (for future features)

- **rosters.powerUps** - Now references card IDs instead of hardcoded types
  ```typescript
  // Before: { type: "Hype Train", appliedToFighterId: string }
  // After:  { powerUpCardId: Id<"powerUpCards">, appliedToFighterId: string }
  ```

### 4. **Seed Data**
- **seed/powerUpCards.ts** - Populates initial 4 cards
  - Hype Train (2× win / -2× loss)
  - Resilience (loss + FOTN → decision win)
  - Blitz (3× if R1 finish)
  - Red Mist (+50 per UFC bonus)

### 5. **Refactored Power-Up Applicator**
- **PowerUpApplicatorNew.ts** - Uses effect types instead of hardcoded logic
  - Checks `card.effectType` to determine which logic to apply
  - Uses type guards for type-safe config access
  - Easy to add new effect types

## What Remains TODO 🚧

### 1. **Update ScoringEngine Integration**
The ScoringEngine currently uses the old PowerUpApplicator. Need to:
- Update to accept PowerUpCard entities
- Fetch PowerUpCard from database/repository before scoring
- Pass PowerUpCard to the new PowerUpApplicator

### 2. **Create PowerUpCardRepository**
Need a repository to fetch cards:
```typescript
interface IPowerUpCardRepository {
  getById(id: string): Promise<PowerUpCard | null>;
  getActiveCards(): Promise<PowerUpCard[]>;
}
```

### 3. **Update Tests**
All existing tests use hardcoded power-up types. Need to:
- Update test helpers to create PowerUpCard entities
- Mock PowerUpCardRepository in tests
- Ensure all 45 tests still pass

### 4. **Migration Strategy**
For existing rosters in production:
- Create migration script to convert old `type` field to `powerUpCardId`
- Map "Hype Train" → actual card ID from database

### 5. **Update Roster Helper Functions**
Update `getPowerUpForFighter` in Roster entity to:
```typescript
// Old: Returns PowerUp with type field
// New: Returns PowerUp with powerUpCardId field
```

## Benefits of This Approach 🎯

### For Game Designers
- ✅ **Change card names instantly** - No code deploy needed
- ✅ **Tweak effect values** - Adjust multipliers for game balance
- ✅ **A/B test cards** - Toggle isActive flag
- ✅ **Add new cards** - Use existing effect types

### For Developers
- ✅ **Type-safe effect configs** - TypeScript enforces correct parameters
- ✅ **Easy to add new effect types** - Just add to the switch statement
- ✅ **Testable** - Can mock PowerUpCard entities
- ✅ **Maintainable** - Effect logic separated by type

### For Users
- ✅ **More variety** - Easy to add seasonal/limited cards
- ✅ **Better descriptions** - Can clarify card effects without app update
- ✅ **Localization ready** - Can store translations

## How to Add a New Card (Future)

### Example: "Last Stand" Card
*+50% score if fighter wins after being knocked down*

1. **Add to database** (or seed file):
```typescript
{
  name: "Last Stand",
  description: "Gain 50% bonus if you win after being knocked down!",
  effectType: "multiplier_on_condition", // New effect type!
  effectConfig: {
    condition: "had_knockdown",
    multiplier: 1.5
  }
}
```

2. **Add effect type to union**:
```typescript
export type PowerUpEffectType =
  | "multiplier_win_loss"
  | "multiplier_on_condition"; // New!
```

3. **Add config interface**:
```typescript
export interface MultiplierOnConditionConfig {
  condition: "had_knockdown" | "had_submission_attempt";
  multiplier: number;
}
```

4. **Implement in PowerUpApplicator**:
```typescript
case "multiplier_on_condition":
  return this.applyMultiplierOnCondition(card, fight, fighterId);
```

That's it! No other code changes needed.

## Next Steps

1. ✅ Run seed script: `npx convex run seed/powerUpCards:seedPowerUpCards`
2. 🚧 Update ScoringEngine to use PowerUpApplicatorNew
3. 🚧 Create PowerUpCardRepository
4. 🚧 Update all tests to use PowerUpCard entities
5. 🚧 Verify all 45 tests pass
6. 🚧 Deploy schema changes to Convex

## Questions?

- How should we handle card versioning if we change effect values?
- Should users see which version of a card they used in past rosters?
- Do we need audit logs for card changes?
