# OctoDraft: Scoring Engine & Game Rules

## Table of Contents
1. [Game Rules](#game-rules)
2. [Scoring Formula Overview](#scoring-formula-overview)
3. [Scoring Components Breakdown](#scoring-components-breakdown)
4. [Power-Up Effects](#power-up-effects)
5. [Synergy System](#synergy-system)
6. [Calculation Examples](#calculation-examples)
7. [Edge Cases](#edge-cases)
8. [Implementation Logic](#implementation-logic)

---

## 1. Game Rules

### 1.1. Roster Construction
Every user must build a roster for each UFC event following these constraints:

| Constraint | Rule |
|------------|------|
| **Squad Size** | Exactly 6 fighters |
| **Salary Cap** | Maximum $10,000 total |
| **Captain** | Exactly 1 fighter designated as Captain |
| **Power-Ups** | Maximum 2 power-up cards total |
| **Roster Lock** | Submissions close 1 hour before event start |

**Validation Rules:**
- Cannot select the same fighter twice
- Cannot select both fighters from the same bout
- Total salary must not exceed $10,000
- Must have exactly one captain (no more, no less)
- Each power-up can only be applied to one fighter
- Cannot apply multiple power-ups to the same fighter

### 1.2. Fighter Salaries
Fighter salaries are dynamically calculated based on:
- **Ranking:** UFC rankings (Champion, Top 5, Top 10, Top 15, Unranked)
- **Opponent Strength:** Higher salary if fighting a highly-ranked opponent
- **Recent Performance:** Win streak bonuses
- **Fight Type:** Title fights increase salary

**Salary Ranges:**
- Champions: $2,300 - $2,500
- Top 5: $2,000 - $2,299
- Top 10: $1,700 - $1,999
- Top 15: $1,400 - $1,699
- Unranked: $1,000 - $1,399

### 1.3. Fighter Classes
Each fighter is assigned a primary class based on their fighting style:

| Class | Description | Identification Method |
|-------|-------------|----------------------|
| **Striker** | Stand-up specialists (boxing, kickboxing, Muay Thai) | 70%+ strikes vs. grappling attempts |
| **Grappler** | Ground game experts (wrestling, BJJ) | 60%+ takedowns/submissions in fight stats |
| **All-Rounder** | Balanced mixed martial artists | Balanced stats across striking and grappling |
| **Veteran** | Experienced fighters aged 35+ | Age-based classification (overrides other classes) |

### 1.4. Progression System (MVP)
- **XP Earning:** Users earn XP based on their captain's performance
- **Levels:** XP accumulates to increase user level
- **No Unlocks:** All power-ups are available from the start (unlocks deferred to post-MVP)

---

## 2. Scoring Formula Overview

The total score for a fighter is calculated using this layered formula:

$$
S = \left[\left(\left(V \times M\right) + Vol + R + B\right) \times Syn\right] \times Cap \times PU - P
$$

### Legend:
- **S** = Final Fighter Score
- **V** = Victory Points (100 if win, 0 if loss)
- **M** = Method Multiplier (varies by finish type)
- **Vol** = Volume Points (strikes, takedowns, etc.)
- **R** = Round Bonus (earlier finishes = higher bonus)
- **B** = UFC Bonus (Performance of the Night, Fight of the Night)
- **Syn** = Synergy Multiplier (1.15 if roster has 3+ of same class)
- **Cap** = Captain Multiplier (1.5 if this fighter is captain)
- **PU** = Power-Up Multiplier (varies by card)
- **P** = Penalties (weight miss, point deductions)

### Roster Total Score:
$$
TotalScore = \sum_{i=1}^{6} S_i
$$
Sum of all 6 fighters' individual scores.

---

## 3. Scoring Components Breakdown

### 3.1. Victory Points (V)
The foundation of the score:

| Result | Points |
|--------|--------|
| **Win** | +100 |
| **Loss** | 0 |
| **No Contest** | 0 |
| **Draw** | +50 |

**Important:** If a fighter loses, **V = 0**, which nullifies the method multiplier. Only volume points are retained.

---

### 3.2. Method Multiplier (M)
Applied ONLY if the fighter wins (V = 100):

| Method | Multiplier | Description |
|--------|-----------|-------------|
| **KO/TKO** | 2.0 | Knockout or Technical Knockout |
| **Submission** | 1.8 | Tap out or technical submission |
| **Decision (Unanimous)** | 1.2 | All judges agree |
| **Decision (Split)** | 1.0 | Judges split 29-28 or similar |
| **Decision (Majority)** | 1.1 | Two judges agree, one draws |
| **DQ** | 1.0 | Disqualification (opponent fouled out) |

**Calculation:**
- Win by KO: $100 \times 2.0 = 200$ points
- Win by Submission: $100 \times 1.8 = 180$ points
- Win by Unanimous Decision: $100 \times 1.2 = 120$ points
- Win by Split Decision: $100 \times 1.0 = 100$ points

---

### 3.3. Volume Points (Vol)
These points reward in-fight actions and are awarded **EVEN IF THE FIGHTER LOSES**.

| Action | Points | Notes |
|--------|--------|-------|
| **Knockdown** | +20 per KD | Opponent's glove touches canvas |
| **Takedown** | +10 per TD | Successful takedown with control |
| **Submission Attempt** | +10 per attempt | Must be a legitimate attempt (>3 seconds) |
| **Significant Strikes** | +0.5 per strike | Head/body strikes (not leg kicks) |

**Example Volume Calculation:**
```
Fighter lands:
- 2 knockdowns = 2 × 20 = 40 points
- 3 takedowns = 3 × 10 = 30 points
- 1 submission attempt = 1 × 10 = 10 points
- 80 significant strikes = 80 × 0.5 = 40 points

Total Volume = 40 + 30 + 10 + 40 = 120 points
```

**Critical:** Volume points are the ONLY points a losing fighter can earn (since V = 0).

---

### 3.4. Round Bonus (R)
Fighters who finish the fight early receive bonus points:

| Round Finished | Bonus | Logic |
|----------------|-------|-------|
| **Round 1** | +100 | Fastest finish, highest reward |
| **Round 2** | +60 | Quick finish |
| **Round 3** | +30 | Standard 3-round fight finish |
| **Round 4** | +50 | Championship rounds (rare) |
| **Round 5** | +50 | Full 5-round finish |
| **Goes to Decision** | 0 | No bonus if fight reaches judges |

**Note:** Round bonus is only awarded if the fight is **finished** (KO/TKO/Sub), not if it goes to decision.

**Example:**
- Round 1 KO: +100 bonus
- Round 2 Submission: +60 bonus
- Round 3 TKO: +30 bonus
- Unanimous Decision (judges): 0 bonus

---

### 3.5. UFC Bonus Points (B)
Official UFC bonuses awarded post-event:

| Bonus Type | Points | Description |
|------------|--------|-------------|
| **Performance of the Night** | +100 | Best individual performance (usually a finish) |
| **Fight of the Night** | +100 | Best overall fight (both fighters receive this) |

**Note:** A fighter can receive both bonuses (POTN + FOTN = +200 points total).

**Distribution:**
- Typically, UFC awards 3-4 bonuses per event
- 1 Fight of the Night (2 fighters share this)
- 1-2 Performance of the Night bonuses

---

### 3.6. Synergy Multiplier (Syn)
When a roster contains **3 or more fighters of the same class**, class-specific bonuses activate:

| Class | Synergy Requirement | Effect | Applied To |
|-------|---------------------|--------|------------|
| **Striker** | 3+ Strikers | +15% to final score | ONLY if fighter won by KO/TKO |
| **Grappler** | 3+ Grapplers | +15% to final score | ONLY if fighter won by Submission |
| **All-Rounder** | 3+ All-Rounders | +10 flat points | ONLY if fighter won by Decision |
| **Veteran** | 3+ Veterans (age 35+) | Negates split-decision penalty | Removes penalty if fighter lost by split decision |

**Synergy Multiplier (Syn):**
- If synergy is active AND condition met: **1.15** (for Striker/Grappler)
- If All-Rounder synergy active AND decision win: **+10 flat points** (added after multiplier)
- If Veteran synergy active AND split-decision loss: **Loss penalty negated**
- Otherwise: **1.0** (no multiplier)

**Example:**
```
Roster has 3 Strikers:
- Fighter A (Striker) wins by KO: Syn = 1.15 ✓
- Fighter B (Striker) wins by Decision: Syn = 1.0 ✗ (not a KO)
- Fighter C (Grappler) wins by KO: Syn = 1.0 ✗ (not a Striker)
```

---

### 3.7. Captain Multiplier (Cap)
One fighter designated as Captain receives:

| Captain Status | Multiplier |
|----------------|------------|
| **Is Captain** | 1.5 |
| **Not Captain** | 1.0 |

**Applied to:** The ENTIRE fighter score (after synergy).

**Strategy:** Choose your most confident pick as Captain to maximize points.

---

### 3.8. Power-Up Multipliers (PU)
Users can apply **up to 2 power-ups total** to different fighters:

| Power-Up | Effect | Risk/Reward |
|----------|--------|-------------|
| **Hype Train** | 2x points on WIN / -2x points on LOSS | High risk, high reward |
| **Resilience** | If fighter LOSES but gets FOTN, treat as WIN | Loss insurance |
| **Blitz** | 3x points if finished in ROUND 1 | Reward for speed |
| **Red Mist** | +50 flat points for ANY UFC bonus | Bonus hunter |

**Detailed Rules:**

#### Hype Train
- **On Win:** Final score × 2
- **On Loss:** Volume points × -2 (user loses double the volume points)
- **Example:**
  - Win: Fighter scores 250 → 500 points
  - Loss: Fighter has 80 volume → -160 points (penalty)

#### Resilience
- **Normal Loss:** Fighter scores only volume points (e.g., 60 points)
- **Loss + FOTN:** Fighter gets full victory calculation (as if they won)
  - V = 100, M = 1.2 (decision win equivalent), + volume + bonuses
- **Example:**
  - Fighter loses by split decision, gets FOTN
  - Without Resilience: 60 volume points
  - With Resilience: 100 × 1.2 + 60 volume + 100 FOTN = 280 points

#### Blitz
- **Round 1 Finish:** Final score × 3
- **Round 2+ Finish:** No effect (normal score)
- **Decision Win:** No effect
- **Example:**
  - R1 KO with 200 base score → 600 points
  - R2 KO with 200 base score → 200 points (no bonus)

#### Red Mist
- **POTN Bonus:** +50 points (in addition to the +100 from UFC bonus)
- **FOTN Bonus:** +50 points (in addition to the +100 from UFC bonus)
- **Both Bonuses:** +100 points (50 per bonus)
- **No Bonus:** No effect
- **Example:**
  - Fighter gets POTN: 100 (base UFC bonus) + 50 (Red Mist) = +150 total

---

### 3.9. Penalties (P)
Penalties are subtracted from the final score:

| Penalty | Points Deducted | Trigger |
|---------|-----------------|---------|
| **Weight Miss** | -50 | Fighter fails to make contracted weight |
| **Point Deduction** | -25 per deduction | Referee deducts point for fouls |

**Examples:**
- Fighter misses weight by 3 lbs: -50 points
- Fighter gets 2 point deductions for eye pokes: -50 points
- Fighter misses weight AND gets 1 deduction: -75 points

**Important:** Penalties apply AFTER all multipliers.

---

## 4. Power-Up Effects (Detailed)

### 4.1. Hype Train (High Risk/High Reward)

**Calculation:**
```typescript
if (fighterWon) {
  score = baseScore × 2;
} else {
  score = -(volumePoints × 2); // Negative score!
}
```

**Use Case:** Apply to fighters you're EXTREMELY confident will win.

**Example Scenario:**
```
Fighter: Max Holloway (Captain, Striker)
Event: Wins by R2 TKO
Without Hype Train:
- V × M = 100 × 2.0 = 200
- Volume = 40
- Round Bonus = 60
- Base = 300
- Synergy (3 Strikers) = 300 × 1.15 = 345
- Captain = 345 × 1.5 = 517.5 points

WITH Hype Train:
- 517.5 × 2 = 1,035 points ✓

If he LOST:
- Volume only = 40
- Hype Train penalty = -(40 × 2) = -80 points ✗
```

---

### 4.2. Resilience (Loss Insurance)

**Calculation:**
```typescript
if (fighterLost && fightOfTheNight) {
  // Treat as a decision win
  V = 100;
  M = 1.2; // Unanimous decision equivalent
  // Apply normal scoring from here
} else if (fighterLost) {
  // Normal loss, only volume points
  score = volumePoints;
}
```

**Use Case:** Apply to high-volume fighters in potential "barn burner" fights.

**Example Scenario:**
```
Fighter: Justin Gaethje (All-Rounder)
Event: Loses by split decision BUT gets Fight of the Night
Without Resilience:
- Volume only = 90 points

WITH Resilience:
- V × M = 100 × 1.2 = 120
- Volume = 90
- Round Bonus = 0 (decision)
- UFC Bonus = 100 (FOTN)
- Base = 310 points ✓
```

---

### 4.3. Blitz (Speed Bonus)

**Calculation:**
```typescript
if (finishRound === 1) {
  score = baseScore × 3;
} else {
  score = baseScore; // No effect
}
```

**Use Case:** Apply to explosive finishers fighting lower-tier opponents.

**Example Scenario:**
```
Fighter: Alex Pereira (Striker, Captain)
Event: Wins by R1 KO
Without Blitz:
- V × M = 100 × 2.0 = 200
- Volume = 20
- Round Bonus = 100
- Base = 320
- Synergy = 320 × 1.15 = 368
- Captain = 368 × 1.5 = 552 points

WITH Blitz:
- 552 × 3 = 1,656 points ✓
```

**Risk:** If the fight goes past Round 1, Blitz has ZERO effect.

---

### 4.4. Red Mist (Bonus Hunter)

**Calculation:**
```typescript
bonusPoints = 0;
if (performanceOfTheNight) bonusPoints += 150; // 100 base + 50 Red Mist
if (fightOfTheNight) bonusPoints += 150; // 100 base + 50 Red Mist
```

**Use Case:** Apply to fighters known for exciting fights (high finish rate).

**Example Scenario:**
```
Fighter: Charles Oliveira (Grappler)
Event: Wins by R1 Submission, gets POTN
Without Red Mist:
- V × M = 100 × 1.8 = 180
- Volume = 30
- Round Bonus = 100
- UFC Bonus = 100 (POTN)
- Base = 410 points

WITH Red Mist:
- V × M = 180
- Volume = 30
- Round Bonus = 100
- UFC Bonus = 150 (100 base + 50 Red Mist)
- Base = 460 points ✓
```

---

## 5. Synergy System (Detailed)

### 5.1. Striker Synergy
**Activation:** 3+ Strikers in roster
**Benefit:** +15% to final score (1.15 multiplier) for Strikers who win by KO/TKO

**Example Roster:**
```
1. Fighter A (Striker) - Wins by KO ✓ → Gets 1.15x
2. Fighter B (Striker) - Wins by Decision ✗ → No bonus
3. Fighter C (Striker) - Loses ✗ → No bonus
4. Fighter D (Grappler) - Wins by KO ✗ → No bonus (not a Striker)
5. Fighter E (All-Rounder)
6. Fighter F (Striker) - Wins by KO ✓ → Gets 1.15x
```
**Result:** Fighters A and F get the synergy multiplier.

---

### 5.2. Grappler Synergy
**Activation:** 3+ Grapplers in roster
**Benefit:** +15% to final score for Grapplers who win by Submission

**Example:**
```
3 Grapplers in roster:
- Grappler 1: Wins by Submission → 1.15x ✓
- Grappler 2: Wins by Decision → 1.0x (no bonus)
- Grappler 3: Wins by KO → 1.0x (no bonus)
```

---

### 5.3. All-Rounder Synergy
**Activation:** 3+ All-Rounders in roster
**Benefit:** +10 flat points (NOT a multiplier) for All-Rounders who win by Decision

**Calculation:**
```typescript
if (allRounderSynergy && wonByDecision) {
  score = ((V × M) + Vol + R + B) × Syn + 10; // +10 AFTER synergy
}
```

**Example:**
```
All-Rounder wins by Unanimous Decision:
- V × M = 100 × 1.2 = 120
- Volume = 50
- Base = 170
- Synergy (All-Rounder) = 170 × 1.0 + 10 = 180 points
```

---

### 5.4. Veteran Synergy
**Activation:** 3+ Veterans (age 35+) in roster
**Benefit:** Negates penalty for split-decision losses

**Normal Split-Decision Loss:**
```
- Victory = 0 (loss)
- Only volume points = 60 points
```

**With Veteran Synergy:**
```
- Loss penalty negated
- Treat as if they won by split decision:
  - V × M = 100 × 1.0 = 100
  - Volume = 60
  - Total = 160 points (instead of 60)
```

**Use Case:** Hedge against close fights with veteran fighters.

---

## 6. Calculation Examples

### Example 1: Standard KO Win (No Bonuses)
```
Fighter: Sean O'Malley (Striker, NOT Captain)
Result: Wins by R2 KO
Stats: 2 KD, 50 sig strikes, no takedowns

Calculation:
1. V × M = 100 × 2.0 = 200
2. Volume:
   - Knockdowns: 2 × 20 = 40
   - Sig Strikes: 50 × 0.5 = 25
   - Total Vol = 65
3. Round Bonus (R2 finish) = 60
4. UFC Bonus = 0
5. Base = (200 + 65 + 60 + 0) = 325

6. Synergy: No synergy active → 1.0
   Score = 325 × 1.0 = 325

7. Captain: Not captain → 1.0
   Score = 325 × 1.0 = 325

8. Power-Up: None
   Score = 325

9. Penalties: None
   Final Score = 325 points
```

---

### Example 2: Captain Submission with Grappler Synergy
```
Fighter: Charles Oliveira (Grappler, CAPTAIN)
Result: Wins by R1 Submission
Stats: 1 TD, 2 sub attempts, 20 sig strikes
Roster: 3+ Grapplers (synergy active)

Calculation:
1. V × M = 100 × 1.8 = 180
2. Volume:
   - Takedowns: 1 × 10 = 10
   - Sub Attempts: 2 × 10 = 20
   - Sig Strikes: 20 × 0.5 = 10
   - Total Vol = 40
3. Round Bonus (R1 finish) = 100
4. UFC Bonus = 0
5. Base = (180 + 40 + 100 + 0) = 320

6. Synergy: Grappler won by Sub → 1.15
   Score = 320 × 1.15 = 368

7. Captain: Is captain → 1.5
   Score = 368 × 1.5 = 552

8. Power-Up: None
   Score = 552

9. Penalties: None
   Final Score = 552 points
```

---

### Example 3: Loss with Volume (Most Common)
```
Fighter: Tony Ferguson (All-Rounder)
Result: Loses by Decision
Stats: 1 KD, 3 TD, 1 sub attempt, 90 sig strikes

Calculation:
1. V × M = 0 × 1.0 = 0 (LOSS)
2. Volume:
   - Knockdowns: 1 × 20 = 20
   - Takedowns: 3 × 10 = 30
   - Sub Attempts: 1 × 10 = 10
   - Sig Strikes: 90 × 0.5 = 45
   - Total Vol = 105
3. Round Bonus = 0 (no finish)
4. UFC Bonus = 0
5. Base = (0 + 105 + 0 + 0) = 105

6. Synergy: Not applicable (loss) → 1.0
   Score = 105 × 1.0 = 105

7. Captain: Not captain → 1.0
   Score = 105 × 1.0 = 105

8. Power-Up: None
   Score = 105

9. Penalties: None
   Final Score = 105 points
```

**Note:** Losing fighters can still contribute 80-150 volume points if they had active fights.

---

### Example 4: Blitz Power-Up with R1 Finish
```
Fighter: Alex Pereira (Striker, Captain)
Result: Wins by R1 KO
Stats: 3 KD, 30 sig strikes
Power-Up: BLITZ
Roster: 3+ Strikers (synergy active)
UFC Bonus: POTN

Calculation:
1. V × M = 100 × 2.0 = 200
2. Volume:
   - Knockdowns: 3 × 20 = 60
   - Sig Strikes: 30 × 0.5 = 15
   - Total Vol = 75
3. Round Bonus (R1 finish) = 100
4. UFC Bonus = 100 (POTN)
5. Base = (200 + 75 + 100 + 100) = 475

6. Synergy: Striker won by KO → 1.15
   Score = 475 × 1.15 = 546.25

7. Captain: Is captain → 1.5
   Score = 546.25 × 1.5 = 819.375

8. Power-Up: BLITZ (R1 finish) → ×3
   Score = 819.375 × 3 = 2,458.125

9. Penalties: None
   Final Score = 2,458 points (MASSIVE!)
```

**This is the theoretical max for a single fighter.**

---

### Example 5: Hype Train Backfire
```
Fighter: Conor McGregor (Striker)
Result: LOSES by R1 Submission
Stats: 0 KD, 0 TD, 0 sub attempts, 15 sig strikes
Power-Up: HYPE TRAIN

Calculation:
1. V × M = 0 × 1.0 = 0 (LOSS)
2. Volume:
   - Sig Strikes: 15 × 0.5 = 7.5
   - Total Vol = 7.5
3. Base = 7.5

4. Power-Up: HYPE TRAIN (loss) → -(Vol × 2)
   Score = -(7.5 × 2) = -15 points

5. Penalties: None
   Final Score = -15 points (NEGATIVE!)
```

**This is why Hype Train is high risk!**

---

### Example 6: Resilience Save
```
Fighter: Justin Gaethje (All-Rounder)
Result: LOSES by Split Decision BUT gets Fight of the Night
Stats: 3 KD, 1 TD, 120 sig strikes
Power-Up: RESILIENCE

WITHOUT Resilience:
1. Volume only = (3×20) + 10 + (120×0.5) = 130 points

WITH Resilience (FOTN triggered):
1. V × M = 100 × 1.2 = 120 (treated as decision win)
2. Volume = 130
3. Round Bonus = 0
4. UFC Bonus = 100 (FOTN)
5. Base = 350

6. Final Score = 350 points (instead of 130)

Resilience saved 220 points!
```

---

### Example 7: Full Roster Score Calculation
```
Event: UFC 300
Roster:
1. Fighter A (Striker, Captain): 552 points
2. Fighter B (Striker): 325 points
3. Fighter C (Striker): 180 points (won by decision, no synergy)
4. Fighter D (Grappler): 105 points (lost, volume only)
5. Fighter E (All-Rounder): 420 points
6. Fighter F (Veteran): -15 points (Hype Train loss)

Total Roster Score = 552 + 325 + 180 + 105 + 420 - 15 = 1,567 points

User Rank: #42 out of 1,250 participants
XP Earned:
- Base XP = 50
- Captain won by KO = +100 + 50 (method bonus)
- Total XP = 200
```

---

## 7. Edge Cases

### 7.1. Draw (Rare)
```
Result: Majority Draw
Calculation:
- V = 50 (half victory)
- M = 1.0 (no method)
- Volume, Bonuses, Synergy apply normally
```

### 7.2. No Contest
```
Result: Fight ruled No Contest (illegal strike, etc.)
Calculation:
- V = 0
- Volume points still count
- No bonuses
```

### 7.3. DQ Win
```
Result: Fighter wins by DQ (opponent fouled out)
Calculation:
- V = 100
- M = 1.0 (no method multiplier)
- Volume + Bonuses apply
- UFC rarely gives bonuses for DQ wins
```

### 7.4. Weight Miss by Fighter Who Wins
```
Fighter: Wins by R1 KO
Penalty: Missed weight
Calculation:
- Base score = 400 points
- Weight miss penalty = -50
- Final = 350 points
```

### 7.5. Both Fighters Get FOTN
```
Your Fighter: Loses but gets FOTN
Opponent: Wins and gets FOTN
Calculation:
- Your fighter: Volume + 100 (FOTN)
- If Resilience active: Treat as win + 100 FOTN
```

### 7.6. Veteran Synergy + Split Decision Loss
```
Roster: 4 Veterans
Fighter: Veteran loses by split decision
Without Synergy:
- Volume only = 80 points

With Veteran Synergy:
- Penalty negated: 100 × 1.0 + 80 = 180 points
```

### 7.7. Multiple Power-Ups in Roster
```
Roster:
- Fighter A: Hype Train
- Fighter B: Blitz
- Fighter C-F: No power-ups

Each power-up applies independently to its assigned fighter.
```

### 7.8. Blitz Applied but Fight Goes to Decision
```
Power-Up: Blitz
Result: Wins by Decision
Calculation:
- Blitz has ZERO effect (no R1 finish)
- Score calculated normally
```

---

## 8. Implementation Logic

### 8.1. Scoring Algorithm (Pseudocode)

```typescript
function calculateFighterScore(
  fighter: Fighter,
  fight: Fight,
  roster: Roster
): number {
  // Step 1: Determine win/loss
  const won = fight.winnerId === fighter.id;
  const lostBySplitDecision = !won && fight.decisionType === "Split";

  // Step 2: Victory points
  let V = 0;
  if (won) V = 100;
  else if (fight.method === "Draw") V = 50;

  // Step 3: Method multiplier
  let M = 1.0;
  if (won) {
    if (fight.method === "KO/TKO") M = 2.0;
    else if (fight.method === "Submission") M = 1.8;
    else if (fight.decisionType === "Unanimous") M = 1.2;
    else if (fight.decisionType === "Split") M = 1.0;
    else if (fight.decisionType === "Majority") M = 1.1;
  }

  // Step 4: Volume points
  const stats = fight.stats[fighter.id];
  const Vol =
    (stats.knockdowns * 20) +
    (stats.takedowns * 10) +
    (stats.submissionAttempts * 10) +
    (stats.significantStrikes * 0.5);

  // Step 5: Round bonus
  let R = 0;
  if (fight.method !== "Decision") {
    if (fight.round === 1) R = 100;
    else if (fight.round === 2) R = 60;
    else if (fight.round === 3) R = 30;
    else if (fight.round >= 4) R = 50;
  }

  // Step 6: UFC bonus
  let B = 0;
  if (fight.bonuses.fightOfTheNight) B += 100;
  if (fight.bonuses.performanceBonus.includes(fighter.id)) B += 100;

  // Step 7: Calculate base score
  let baseScore = (V * M) + Vol + R + B;

  // Step 8: Synergy multiplier
  let Syn = 1.0;
  const synergy = calculateRosterSynergy(roster);

  if (synergy.striker && fighter.class === "Striker" && fight.method === "KO/TKO" && won) {
    Syn = 1.15;
  } else if (synergy.grappler && fighter.class === "Grappler" && fight.method === "Submission" && won) {
    Syn = 1.15;
  } else if (synergy.allRounder && fighter.class === "All-Rounder" && fight.method === "Decision" && won) {
    baseScore += 10; // Flat bonus, not multiplier
  } else if (synergy.veteran && fighter.age >= 35 && lostBySplitDecision) {
    // Negate split-decision loss
    V = 100;
    M = 1.0;
    baseScore = (V * M) + Vol;
  }

  baseScore *= Syn;

  // Step 9: Captain multiplier
  const Cap = roster.captainId === fighter.id ? 1.5 : 1.0;
  baseScore *= Cap;

  // Step 10: Power-up effects
  const powerUp = roster.powerUps.find(pu => pu.fighterId === fighter.id);
  if (powerUp) {
    if (powerUp.type === "Hype Train") {
      if (won) baseScore *= 2;
      else baseScore = -(Vol * 2); // Negative!
    } else if (powerUp.type === "Blitz") {
      if (won && fight.round === 1) baseScore *= 3;
    } else if (powerUp.type === "Resilience") {
      if (!won && fight.bonuses.fightOfTheNight) {
        // Recalculate as if they won by decision
        baseScore = (100 * 1.2) + Vol + 100; // FOTN bonus
        baseScore *= Syn * Cap;
      }
    } else if (powerUp.type === "Red Mist") {
      if (fight.bonuses.performanceBonus.includes(fighter.id)) baseScore += 50;
      if (fight.bonuses.fightOfTheNight) baseScore += 50;
    }
  }

  // Step 11: Penalties
  const penalties = fight.penalties?.[fighter.id];
  if (penalties) {
    if (penalties.weightMiss) baseScore -= 50;
    baseScore -= penalties.pointDeductions * 25;
  }

  return Math.round(baseScore * 100) / 100; // Round to 2 decimals
}

function calculateRosterSynergy(roster: Roster) {
  const classCounts = {
    Striker: 0,
    Grappler: 0,
    AllRounder: 0,
    Veteran: 0,
  };

  roster.fighters.forEach(f => {
    classCounts[f.class]++;
    if (f.age >= 35) classCounts.Veteran++;
  });

  return {
    striker: classCounts.Striker >= 3,
    grappler: classCounts.Grappler >= 3,
    allRounder: classCounts.AllRounder >= 3,
    veteran: classCounts.Veteran >= 3,
  };
}

function calculateRosterTotalScore(roster: Roster): number {
  let totalScore = 0;
  roster.fighters.forEach(fighter => {
    const fighterScore = calculateFighterScore(fighter, fighter.fight, roster);
    totalScore += fighterScore;
  });
  return totalScore;
}
```

### 8.2. XP Calculation
```typescript
function calculateXPEarned(roster: Roster): number {
  const baseXP = 50; // Participation bonus

  const captain = roster.fighters.find(f => f.isCaptain);
  const captainFight = fights[captain.fightId];

  if (captainFight.winnerId !== captain.id) {
    return baseXP; // No bonus for captain loss
  }

  let bonusXP = 100; // Captain win bonus

  // Method bonus
  if (captainFight.method === "KO/TKO") bonusXP += 50;
  else if (captainFight.method === "Submission") bonusXP += 40;
  else if (captainFight.method === "Decision") bonusXP += 20;

  return baseXP + bonusXP;
}
```

### 8.3. Level Calculation
```typescript
function calculateLevel(totalXP: number): number {
  // Exponential XP curve
  const levels = [
    { level: 1, xpRequired: 0 },
    { level: 2, xpRequired: 100 },
    { level: 3, xpRequired: 300 },
    { level: 4, xpRequired: 600 },
    { level: 5, xpRequired: 1000 },
    { level: 6, xpRequired: 1500 },
    { level: 7, xpRequired: 2100 },
    { level: 8, xpRequired: 2800 },
    { level: 9, xpRequired: 3600 },
    { level: 10, xpRequired: 4500 },
    // ... continue exponentially
  ];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalXP >= levels[i].xpRequired) {
      return levels[i].level;
    }
  }
  return 1;
}
```

---

## 9. Leaderboard Ranking

### 9.1. Ranking Logic
```typescript
function updateLeaderboard(eventId: string) {
  // 1. Fetch all rosters for event
  const rosters = getRostersByEvent(eventId);

  // 2. Sort by total score (descending)
  rosters.sort((a, b) => b.finalScore - a.finalScore);

  // 3. Assign ranks (handle ties)
  let currentRank = 1;
  for (let i = 0; i < rosters.length; i++) {
    if (i > 0 && rosters[i].finalScore === rosters[i-1].finalScore) {
      // Tie: same rank as previous
      rosters[i].rank = rosters[i-1].rank;
    } else {
      rosters[i].rank = currentRank;
    }
    currentRank++;
  }

  // 4. Update leaderboard table
  rosters.forEach(roster => {
    upsertLeaderboard({
      eventId,
      userId: roster.userId,
      rosterId: roster.id,
      score: roster.finalScore,
      rank: roster.rank,
    });
  });
}
```

### 9.2. Tie-Breaking Rules
If two rosters have identical scores:
1. **Same Rank:** Both receive the same rank (e.g., two #1s)
2. **Next Rank Skipped:** If two users tie for #5, the next user is #7

---

## 10. Summary Table

| Component | Formula | Range | Notes |
|-----------|---------|-------|-------|
| **Victory (V)** | Win=100, Loss=0, Draw=50 | 0-100 | Base points |
| **Method (M)** | KO=2.0, Sub=1.8, UD=1.2, SD=1.0 | 1.0-2.0 | Only if win |
| **Volume (Vol)** | KD×20 + TD×10 + SubAtt×10 + SigStrike×0.5 | 0-200+ | Always counted |
| **Round (R)** | R1=100, R2=60, R3=30, R4/5=50 | 0-100 | Finish only |
| **Bonus (B)** | POTN=100, FOTN=100 | 0-200 | UFC awards |
| **Synergy (Syn)** | 3+ same class = 1.15 or +10 | 1.0-1.15 | Conditional |
| **Captain (Cap)** | Captain = 1.5 | 1.0-1.5 | One per roster |
| **Power-Up (PU)** | Varies by card | 0.5-3.0× | Max 2 per roster |
| **Penalties (P)** | Weight=-50, Deduction=-25 | -∞ to 0 | Subtracted last |

**Theoretical Max Single Fighter Score:** ~2,500 points (Captain + Blitz + R1 KO + Synergy + Bonuses)
**Theoretical Max Roster Score:** ~6,000-8,000 points (if all 6 fighters win with bonuses)
**Realistic Winning Roster:** 1,500-2,500 points
**Average Roster:** 800-1,200 points

---

## End of Document

This scoring system balances:
- **Skill-based picks:** High-salary fighters are expensive but reliable
- **Risk-taking:** Power-ups reward bold predictions
- **Strategic depth:** Synergies encourage thematic roster building
- **Loss mitigation:** Volume points prevent total roster collapse
- **Upside potential:** Captains and power-ups create variance for comebacks

For questions or clarifications, refer to the main SPECS.md or contact the development team.
