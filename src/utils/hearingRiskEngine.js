// hearingRiskEngine.js
//
// Modular, rule-based decision engine for the Hearing Care app.
// -------------------------------------------------------------
// Deliberately NOT arithmetic/weighted scoring for medical risk or final risk —
// per the report spec, these are transparent rule-based expert-system decisions
// that can be justified against published literature (WHO, NIOSH, audiology
// practice), not invented numerical weights.
//
// Everything here is a pure function: no side effects, no Firebase, no React.
// This makes each rule easy to find, test, and modify independently.

// ── Constants ──────────────────────────────────────────────────────────────

// The 18 frequencies (Hz) tested by the device, in order.
export const TEST_FREQUENCIES = [
  250, 500, 1000, 2000, 3000, 4000, 5000, 6000,
  7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000,
];

// Frequencies at/above this are considered "high frequency" for the purposes
// of distinguishing age/noise-typical high-frequency loss from broader loss.
const HIGH_FREQUENCY_THRESHOLD = 4000;

export const RISK_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

export const HEARING_PERFORMANCE_CATEGORIES = {
  GOOD: 'Good Frequency Response',
  REDUCED_HIGH_FREQ: 'Reduced high-frequency hearing',
  MARKED_REDUCTION: 'Marked reduction in hearing performance',
};

// Ordinal severity of each performance category — used only for comparisons
// (e.g. "which ear is worse", "does this category imply at least X risk"),
// never combined arithmetically with anything else.
const PERFORMANCE_INTRINSIC_LEVEL = {
  [HEARING_PERFORMANCE_CATEGORIES.GOOD]: 0,
  [HEARING_PERFORMANCE_CATEGORIES.REDUCED_HIGH_FREQ]: 1,
  [HEARING_PERFORMANCE_CATEGORIES.MARKED_REDUCTION]: 2,
};

const DISCLAIMER_TEXT =
  'This report is intended for occupational hearing screening and monitoring purposes only. ' +
  'It is not a substitute for a professional audiological diagnosis or clinical audiometric examination.';

// ── Section 3 & 4: Frequency parsing / table / per-ear summary ─────────────

/** "250 500 1000" -> [250, 500, 1000] */
export function parseFrequencyString(str) {
  if (!str) return [];
  return str
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
}

/** Section 3 — Hearing Screening Results: per-frequency Heard/Missed for both ears. */
export function buildFrequencyTable(leftResult, rightResult) {
  const leftHeard = new Set(parseFrequencyString(leftResult?.heard_frequencies));
  const rightHeard = new Set(parseFrequencyString(rightResult?.heard_frequencies));

  return TEST_FREQUENCIES.map((frequency) => ({
    frequency,
    left: leftHeard.has(frequency) ? 'Heard' : 'Missed',
    right: rightHeard.has(frequency) ? 'Heard' : 'Missed',
  }));
}

/** Section 4 — Frequency Response Summary for a single ear. */
export function summarizeEar(result) {
  const heardFrequencies = parseFrequencyString(result?.heard_frequencies).sort((a, b) => a - b);
  const missedFrequencies = parseFrequencyString(result?.missed_frequencies).sort((a, b) => a - b);

  return {
    heardFrequencies,
    missedFrequencies,
    highestAudibleFrequency: heardFrequencies.length ? Math.max(...heardFrequencies) : null,
    lowestAudibleFrequency: heardFrequencies.length ? Math.min(...heardFrequencies) : null,
    heardCount: typeof result?.heard_count === 'number' ? result.heard_count : heardFrequencies.length,
    missedCount: typeof result?.missed_count === 'number' ? result.missed_count : missedFrequencies.length,
  };
}

// ── Section 5: Hearing Performance Analysis ─────────────────────────────────

/** Hearing Performance Score = (Heard Frequencies / 18) × 100 */
export function calculatePerformanceScore(heardCount, totalFrequencies = TEST_FREQUENCIES.length) {
  if (!totalFrequencies) return 0;
  return Math.round(((heardCount / totalFrequencies) * 100) * 10) / 10; // 1 decimal place
}

/**
 * Classifies an ear's frequency response pattern.
 * Rule-based on WHICH frequencies were missed, not just how many:
 *  - No low/mid-frequency loss + at most 1 high-frequency miss  -> Good
 *  - No low/mid-frequency loss but multiple high-frequency misses -> Reduced high-frequency hearing
 *  - Any low/mid-frequency (speech-range) loss                  -> Marked reduction
 * This mirrors standard audiology practice: loss confined to high frequencies
 * is clinically distinct from loss that reaches the speech-relevant range.
 */
export function classifyPerformanceCategory(missedFrequencies) {
  const highFreqMissed = missedFrequencies.filter((f) => f >= HIGH_FREQUENCY_THRESHOLD).length;
  const lowMidFreqMissed = missedFrequencies.filter((f) => f < HIGH_FREQUENCY_THRESHOLD).length;

  if (lowMidFreqMissed === 0 && highFreqMissed <= 1) {
    return HEARING_PERFORMANCE_CATEGORIES.GOOD;
  }
  if (lowMidFreqMissed === 0) {
    return HEARING_PERFORMANCE_CATEGORIES.REDUCED_HIGH_FREQ;
  }
  return HEARING_PERFORMANCE_CATEGORIES.MARKED_REDUCTION;
}

function pickWorseCategory(categoryA, categoryB) {
  return PERFORMANCE_INTRINSIC_LEVEL[categoryA] >= PERFORMANCE_INTRINSIC_LEVEL[categoryB]
    ? categoryA
    : categoryB;
}

/** Full Section 5 analysis for both ears + overall. */
export function calculateHearingPerformance(leftResult, rightResult) {
  const leftSummary = summarizeEar(leftResult);
  const rightSummary = summarizeEar(rightResult);

  const leftScore = calculatePerformanceScore(leftSummary.heardCount);
  const rightScore = calculatePerformanceScore(rightSummary.heardCount);
  const overallScore = Math.round(((leftScore + rightScore) / 2) * 10) / 10;

  const leftCategory = classifyPerformanceCategory(leftSummary.missedFrequencies);
  const rightCategory = classifyPerformanceCategory(rightSummary.missedFrequencies);
  // The overall clinical picture is driven by the worse-performing ear —
  // standard practice, since a single impaired ear still warrants attention.
  const overallCategory = pickWorseCategory(leftCategory, rightCategory);

  return {
    left: { ...leftSummary, score: leftScore, category: leftCategory },
    right: { ...rightSummary, score: rightScore, category: rightCategory },
    overallScore,
    overallCategory,
  };
}

// ── Section 6: Medical Risk Analysis (Rule-Based Expert System) ────────────
//
// Question ID reference (must match Questionnaire.tsx):
//  1 Difficulty hearing conversations   (Yes/No)
//  2 One ear worse than the other       (Left/Right/Both/No)
//  3 Ear pain in last 6 months          (Yes/No)
//  4 Occupational/daily noise exposure  (Yes/No)
//  5 Main source of noise               (conditional on Q4 = Yes)
//  6 Hearing protection usage           (Always/Sometimes/Never)
//  7 Duration of exposure               (Less than 1 Year / 1–5 / 5–10 / More than 10 years)
//  8 Previous hearing test              (Yes/No)
//  9 Family history of hearing loss     (Yes/No)
//
// Each rule below can be added to, removed, or adjusted independently —
// that modularity is the point of keeping them as small guarded blocks
// rather than a single formula.

export function evaluateMedicalRisk(medicalHistory = {}) {
  const q = medicalHistory;

  const factors = {
    hearingDifficulty: q[1] === 'Yes',
    asymmetricHearing: !!q[2] && q[2] !== 'No',
    earPain: q[3] === 'Yes',
    occupationalNoiseExposure: q[4] === 'Yes',
    inconsistentProtection: q[6] === 'Sometimes' || q[6] === 'Never',
    neverUsesProtection: q[6] === 'Never',
    longTermExposure: q[7] === '5–10 years' || q[7] === 'More than 10 years',
    veryLongTermExposure: q[7] === 'More than 10 years',
    noPriorHearingTest: q[8] === 'No',
    familyHistory: q[9] === 'Yes',
  };

  let level = 0; // index into RISK_LEVELS
  const appliedRules = [];

  const escalateTo = (targetLevel, ruleId, description, evidence) => {
    if (targetLevel > level) level = targetLevel;
    appliedRules.push({ ruleId, description, evidence });
  };
  const escalateBy = (amount, ruleId, description, evidence) => {
    level = Math.min(RISK_LEVELS.length - 1, level + amount);
    appliedRules.push({ ruleId, description, evidence });
  };

  // R1 — If hearing difficulty is reported, medical risk cannot be LOW.
  if (factors.hearingDifficulty) {
    escalateTo(1, 'R1', 'Self-reported difficulty hearing conversations', 'WHO Hearing Screening Guidelines');
  }

  // R2 — Occupational noise exposure + no hearing protection => HIGH.
  //      Same exposure with only inconsistent protection => one-level increase.
  if (factors.occupationalNoiseExposure && factors.neverUsesProtection) {
    escalateTo(2, 'R2', 'Occupational noise exposure with no hearing protection used', 'NIOSH Hearing Conservation Program');
  } else if (factors.occupationalNoiseExposure && factors.inconsistentProtection) {
    escalateBy(1, 'R2a', 'Occupational noise exposure with inconsistent hearing protection use', 'NIOSH Hearing Conservation Program');
  }

  // R3 — Family history + occupational exposure => increase.
  if (factors.familyHistory && factors.occupationalNoiseExposure) {
    escalateBy(1, 'R3', 'Family history of hearing loss combined with occupational noise exposure', 'Audiology literature on genetic-environmental interaction');
  }

  // R4 — Long-term occupational exposure => increase (more for >10 years).
  if (factors.veryLongTermExposure) {
    escalateBy(1, 'R4', 'Long-term occupational noise exposure (more than 10 years)', 'WHO Occupational Hearing Loss Prevention');
  } else if (factors.longTermExposure) {
    escalateBy(1, 'R4a', 'Medium-term occupational noise exposure (5–10 years)', 'WHO Occupational Hearing Loss Prevention');
  }

  // R5 — Asymmetric hearing loss warrants evaluation.
  if (factors.asymmetricHearing) {
    escalateBy(1, 'R5', 'Asymmetric hearing difficulty reported (one ear worse than the other)', 'Clinical audiology practice: asymmetry warrants evaluation');
  }

  // R6 — Recent ear pain warrants evaluation.
  if (factors.earPain) {
    escalateBy(1, 'R6', 'Ear pain reported within the last 6 months', 'Clinical practice: otologic symptoms warrant evaluation');
  }

  // R7 — If multiple established risk factors are present, risk becomes HIGH.
  const presentFactorCount = Object.values(factors).filter(Boolean).length;
  if (presentFactorCount >= 4) {
    escalateTo(2, 'R7', 'Multiple established risk factors present', 'Cumulative occupational health risk principle');
  }

  // R8 — Severe multi-symptom presentation => CRITICAL.
  if (factors.hearingDifficulty && factors.asymmetricHearing && factors.earPain) {
    escalateTo(3, 'R8', 'Combined hearing difficulty, ear asymmetry, and ear pain indicate urgent evaluation need', 'Clinical practice: multi-symptom presentation');
  }

  return {
    classification: RISK_LEVELS[level],
    levelIndex: level,
    factors,
    appliedRules,
  };
}

// ── Section 7: Final Risk Evaluation (Rule-Based Decision Matrix) ──────────
//
// Combines Objective Hearing Performance with Medical Risk Classification.
// This is a qualitative decision rule (take the more severe of the two
// independent assessments), not an arithmetic combination — a favorable
// result in one dimension can never mask an unfavorable result in the other.

export function evaluateFinalRisk(overallPerformanceCategory, medicalRiskLevelIndex) {
  const performanceLevel = PERFORMANCE_INTRINSIC_LEVEL[overallPerformanceCategory] ?? 0;
  let finalLevel = Math.max(performanceLevel, medicalRiskLevelIndex);

  // Marked reduction in hearing performance always warrants at least a
  // HIGH-risk classification and a specialist referral, regardless of
  // medical history — this matches the spec's explicit decision example.
  const isMarkedReduction = overallPerformanceCategory === HEARING_PERFORMANCE_CATEGORIES.MARKED_REDUCTION;
  if (isMarkedReduction) {
    finalLevel = Math.max(finalLevel, 2); // at least HIGH
  }

  const specialistReferral = isMarkedReduction || finalLevel >= 2;

  return {
    classification: RISK_LEVELS[finalLevel],
    levelIndex: finalLevel,
    specialistReferral,
  };
}

/** Builds the human-readable Section 7 explanation, e.g. the doc's worked example. */
export function generateExplanation(overallPerformanceCategory, medicalRisk, finalRisk) {
  const parts = [];

  if (overallPerformanceCategory === HEARING_PERFORMANCE_CATEGORIES.GOOD) {
    parts.push('Hearing screening results show a good frequency response across both ears');
  } else if (overallPerformanceCategory === HEARING_PERFORMANCE_CATEGORIES.REDUCED_HIGH_FREQ) {
    parts.push('Reduced high-frequency hearing was identified in the screening results');
  } else {
    parts.push('A marked reduction in hearing performance was identified in the screening results');
  }

  const factorDescriptions = medicalRisk.appliedRules.map((rule) => rule.description.toLowerCase());
  if (factorDescriptions.length > 0) {
    // Keep the explanation concise — cite up to 2 leading contributing factors.
    const leading = factorDescriptions.slice(0, 2).join(' and ');
    parts.push(`combined with ${leading}`);
  }

  let sentence = `${parts.join(', ')}, indicating ${finalRisk.classification} RISK`;
  if (finalRisk.specialistReferral) {
    sentence += ' with a recommendation for specialist referral';
  }
  return `${sentence}.`;
}

// ── Section 8/9: Personalized Recommendations ───────────────────────────────

const BASE_RECOMMENDATIONS = {
  LOW: ['Continue annual hearing screening.'],
  MODERATE: [
    'Use hearing protection consistently in noisy environments.',
    'Repeat hearing screening within six months.',
  ],
  HIGH: [
    'Reduce occupational noise exposure where possible.',
    'Consult occupational health services for further evaluation.',
  ],
  CRITICAL: [
    'Seek immediate referral to an Audiologist or ENT specialist.',
  ],
};

export function generateRecommendations(finalClassification, factors = {}) {
  const recommendations = [...(BASE_RECOMMENDATIONS[finalClassification] || [])];

  if (factors.neverUsesProtection) {
    recommendations.push('Begin using certified hearing protection whenever exposed to loud noise.');
  }
  if (factors.noPriorHearingTest) {
    recommendations.push('Establish a baseline hearing profile with regular follow-up screenings.');
  }

  return recommendations;
}

// ── Misc ─────────────────────────────────────────────────────────────────

/** REP-<year>-<6 digit suffix>, e.g. REP-2026-482913 */
export function generateReportId() {
  const year = new Date().getFullYear();
  const suffix = Date.now().toString().slice(-6);
  return `REP-${year}-${suffix}`;
}

export function getDisclaimerText() {
  return DISCLAIMER_TEXT;
}