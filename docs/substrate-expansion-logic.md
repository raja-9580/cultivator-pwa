Below is the **cleaned, final version** of the **Substrate document**, with **all harvest-related clarification removed** and **no unnecessary justification** left in.

This is now **aligned 100% with your mental model**.

---

````md
# Substrate — Design & Behavior Specification

This document defines how **substrates** are modeled, used, and evolved in the system.
It captures both **structural design** and **operational decisions**, so the intent is not lost over time.

---

## 1. What a Substrate Represents

A **substrate** represents a reusable **recipe** for batch preparation.

A substrate defines:
- The **solid mediums** used (e.g. mushroom pellets, rice bran)
- The **inputs/additives** used (e.g. water, coconut water, calcium, gypsum)
- The **default planning assumptions** for preparation (e.g. expansion ratio)

A substrate does **not** represent:
- A specific batch
- A specific experiment run
- A guaranteed outcome

---

## 2. Substrate Composition Model

Substrate composition is split intentionally:

### 2.1 Solid Mediums
- Modeled via `substrate_medium`
- Quantities are defined **per baglet**
- Represent the physical base of the substrate

Examples:
- Mush pellets
- Rice bran

---

### 2.2 Inputs / Additives (Liquids & Enhancers)
- Modeled via `substrate_input`
- Quantities are defined **per baglet**
- Can be large (e.g. 1.6 L water) or small (e.g. 10 g gypsum)

Examples:
- Water
- Coconut water
- Calcium
- Gypsum

Quantity size does **not** change modeling — role does.

---

## 3. Substrate Identification

Substrates use **short, stable, human-readable codes**.

- Examples: `SUB01`, `SUB02`, `SUB07`
- Codes are:
  - QR-friendly
  - Easy to read and communicate
  - Stable over time

Substrate codes **do not encode composition**.
Composition details are always derived from tables/views.

---

## 4. Expansion Ratio — Planning & Observation

### 4.1 Expected Expansion Ratio (Assumption)

Each substrate has an **expected expansion ratio**:

```text
substrate.expected_expansion_ratio
````

Meaning:

> “Typical expected expansion during preparation for this substrate recipe.”

This value:

* Is used during **batch planning**
* Helps estimate required substrate quantities
* Is an **assumption**, not a guarantee
* Changes slowly and intentionally

---

### 4.2 Actual Expansion Ratio (Observed Outcome)

Actual expansion is captured **after batch preparation**, once baglets are prepared and weighed.

* Each baglet’s prepared weight is recorded
* Actual expansion ratio is derived from these measurements
* The result represents what actually happened for that batch

Stored at batch level:

```text
batch.actual_expansion_ratio
```

This value:

* Is written when all baglets in the batch are prepared (no 'PLANNED' baglets remain)
* Is automatically recalculated if weight corrections are made
* Does not mutate substrate defaults

### 4.3 Formula

```text
Actual Dry Input = (Batch Planned Weight / Expected Ratio)
Actual Expansion Ratio = Total Actual Weight / Actual Dry Input
```

This uses the *planned* dry input as the constant denominator, ensuring we measure how much the substrate *actually* expanded compared to the recipe's intent.

### 4.4 Planning Examples (Before Prep)

These examples show how the **Expected Ratio** affects the required dry input for a target weight.

**Scenario A: Standard Batch (Ratio 2.5)**
*   Target: 10 baglets @ 2.5kg each = **25kg Wet**.
*   Ratio: **2.5**.
*   Required Dry Input: `25kg / 2.5` = **10kg**.

**Scenario B: Heavy Batch (Ratio 2.5)**
*   Target: 10 baglets @ 3.0kg each = **30kg Wet**.
*   Ratio: **2.5** (Substrate chemistry hasn't changed).
*   Required Dry Input: `30kg / 2.5` = **12kg**.

---

### 4.5 Actual Calculation Examples (After Prep)

These examples show how we calculate the **Actual Ratio** based on what really happened.
*   **Baseline:** uses the *Planned Dry Input* (e.g. 10kg from Scenario A) as the constant denominator.

**Example 1: Exact Match**
*   **Actual Total Weight:** 25.0 kg.
*   **Calculation:** `25.0 / 10.0` = **2.5**. (Matches expected).

**Example 2: Higher Absorption (Heavier Bags)**
*   **Actual Total Weight:** 30.0 kg.
*   **Calculation:** `30.0 / 10.0` = **3.0**.
*   *Result:* Substrate absorbed more water than expected.

**Example 3: Lower Absorption (Lighter Bags)**
*   **Actual Total Weight:** 20.0 kg.
*   **Calculation:** `20.0 / 10.0` = **2.0**.
*   *Result:* Substrate was drier than expected.



---

## 5. Learning & Updating Expansion Ratio

### 5.1 Problem Statement

Over time, repeated batches may show that the observed expansion ratio
consistently differs from the assumed value.

Example:

* Expected expansion ratio: `2.0`
* Observed after several batches: `~2.3`

The system must learn **without corrupting history or behavior**.

---

### 5.2 Options Considered

**Create a new substrate** ❌
Rejected because:

* The recipe did not change
* Substrate list would grow unnecessarily
* Historical batches would appear fragmented

**Auto-update the expansion ratio** ❌
Rejected because:

* One outlier batch could skew planning
* Changes would be silent and non-explainable
* Operators would lose trust in planning values

---

### 5.3 Final Decision (Accepted)

✅ **Controlled, intentional update of the existing substrate**

Rules:

* The substrate remains the same
* Historical batch data remains unchanged
* Expansion ratio is updated **only by explicit human action**

Learning ≠ new substrate
Learning ≠ silent mutation

---

### 5.4 Update Policy

* Expansion ratios are **not auto-averaged**
* Historical batch data is reviewed by operators
* When confident, the operator may **explicitly update**
  `substrate.expected_expansion_ratio`
* Updates should be infrequent and explainable

(Optional, future):

* Track who updated the ratio
* Track when and why it was updated

---

## 6. When a New Substrate Is Required

A **new substrate** is created **only if the recipe itself changes**, such as:

* Medium composition changes
* Inputs/additives added or removed
* Water quantity changes materially
* Preparation method changes

Learning alone does **not** justify a new substrate.

---

## 7. Summary

| Level     | Stores                   | Purpose                      |
| --------- | ------------------------ | ---------------------------- |
| Substrate | expected_expansion_ratio | Planning assumption          |
| Baglet    | prepared_weight_g        | Measured preparation data    |
| Batch     | actual_expansion_ratio   | Observed preparation outcome |

This design:

* Separates assumptions from observations
* Preserves historical accuracy
* Enables learning without automation risk
* Matches real operational workflow


