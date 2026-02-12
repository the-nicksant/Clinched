# Clinched: Professional MMA Fantasy Engine

## 1. Project Overview
**Clinched** is a gamified MMA Fantasy platform designed to transform passive UFC viewership into a strategic management experience. Unlike standard "pick'em" apps, Clinched introduces RPG mechanics, squad synergies, and strategic power-ups, requiring users to act as "Managers" rather than just bettors.

## 2. Core Business Logic
The game operates on a per-event basis (UFC Cards). Users must build the most efficient lineup within constraints to climb the global leaderboard.

### 2.1. Roster & Constraints
* **Squad Size:** Exactly 6 fighters per event.
* **Salary Cap:** $10,000 virtual credits (Fighter costs vary by ranking/odds).
* **The Captain:** One fighter designated as Captain receives a **1.5x Total Score multiplier**.

### 2.2. Progression System
* **User XP:** Successful Captain picks grant XP to the user profile.
* **Unlocks:** Higher user levels unlock advanced Power-Up cards for future events.

---

## 3. Game Mechanics (The "Meta")

### 3.1. Fighter Classes & Synergy Buffs
Fighters are categorized by their primary fighting style. Strategic stacking triggers "Synergy Buffs":

| Class | Style | Synergy Requirement | Buff Effect |
| :--- | :--- | :--- | :--- |
| **Striker** | Stand-up | 3+ Strikers | +15% points for KO/TKO wins |
| **Grappler** | Ground | 3+ Grapplers | +15% points for Submission wins |
| **All-Rounder** | Mixed | 3+ All-Rounders | +10 flat points for Decision wins |
| **Veteran** | Experience | 3+ Age 35+ | Negates Split-Decision loss penalties |

### 3.2. Power-Up Cards
Users equip **up to 2 cards** per event to specific fighters to manipulate risk/reward:
* **Hype Train:** High risk. Double points on win / Double negative on loss.
* **Resilience:** Loss protection. If the fighter loses but wins "Fight of the Night", the user gets full "Victory" points.
* **Blitz:** Reward for speed. 3x points if finished in Round 1.
* **Red Mist:** Bonus hunter. +50 flat points for any official UFC Performance Bonus.

---

## 4. Scoring & Calculation Engine

The engine calculates the final score based on four layers: **Base + Method + Bonuses - Penalties.**

### 4.1. The Math Model
The Total Score ($S$) for a single fighter is calculated as:
$$S = (((V \times M) + Vol + R + B) \times Syn) \times Cap$$

Where:
* **$V$ (Victory):** +100 pts.
* **$M$ (Method Multiplier):** KO/TKO (2.0), Sub (1.8), Unanimous Dec (1.2), Split Dec (1.0).
* **$Vol$ (Volume):** KD (+20), Takedown (+10), Sub Attempt (+10), Sig. Strike (+0.5).
* **$R$ (Round Bonus):** R1 (+100), R2 (+60), R3 (+30), R4/5 (+50).
* **$B$ (UFC Bonus):** +100 pts for official Performance/Fight of the Night.
* **$Syn$ (Synergy):** 1.15 multiplier if applicable.
* **$Cap$ (Captain):** 1.5 multiplier if designated.

### 4.2. Negative Constraints
* **Weight Miss:** -50 pts.
* **Point Deduction:** -25 pts per foul.
* **Loss:** All victory-related multipliers are nullified; only Volume points are retained.

---

## 5. Technical Implementation Roadmap (Architecture)
1.  **Data Ingestion:** Scraper/API for UFC fighter stats and event results.
2.  **Validation Engine:** Logic to ensure Roster complies with $10k Budget.
3.  **Calculation Service:** Pure function to process the Scoring Algorithm post-event.
4.  **Leaderboard:** Real-time ranking updates using Redis/PostgreSQL.