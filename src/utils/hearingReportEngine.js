// hearingReportEngine.js
//
// Modular, rule-based decision engine for generating the Hearing Screening Report.
// No React / Firebase dependencies here on purpose — pure functions only, so the
// rules can be unit-tested and edited independently of the UI.
//
// Structure:
//   1. Frequency analysis        (Sections 3 & 4 of the report)
//   2. Hearing performance score (Section 5)
//   3. Medical risk rule engine  (Section 6)
//   4. Final risk decision matrix(Section 7)
//   5. Recommendations           (Sections 8 & 9)
//   6. Report assembly + Report ID
//
// IMPORTANT ASSUMPTION (flagged to the developer):
// The Medical History questionnaire is assumed to store answers under Firestore
// document fields "1".."9", in this order (matches the requirement doc's question
// list and the sample data observed):
//   1: Difficulty hearing conversations   (Yes / No)
//   2: One ear worse than the other       (Left / Right / No / Same)
//   3: Ear pain                           (Yes / No)
//   4: Occupational noise exposure        (Yes / No)
//   5: Main source of noise               (free text / select)
//   6: Hearing protection usage           (Always / Sometimes / Never)
//   7: Duration of exposure               (e.g. "<1 year", "1-5 years", "5-10 years", ">10 years")
//   8: Previous hearing test              (Yes / No)
//   9: Family history of hearing loss     (Yes / No)
// If Questionnaire.tsx uses different keys/order, update `mapMedicalHistory` below —
// it's the single place that translates raw Firestore answers into semantic fields.

/* ═══════════════════════════════ 1. Frequency Analysis ═══════════════════════════════ */

export const FREQUENCIES = [
  250, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000,
  8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000,
];

// A "high" frequency for the purposes of "reduced high-frequency hearing" classification.
const HIGH_FREQUENCY_THRESHOLD = 4000;

const parseFrequencyString = (str) => {
  if (!str || typeof str !== 'string') return [];
  return str
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
};

/**
 * Builds the per-ear frequency table (Section 3) and the frequency response
 * summary (Section 4) from a raw Firebase RTDB ear result record.
 */
export const analyzeEar = (earResult) => {
  const heardSet = new Set(parseFrequencyString(earResult?.heard_frequencies));
  const missedSet = new Set(parseFrequencyString(earResult?.missed_frequencies));

  const frequencyTable = FREQUENCIES.map((freq) => ({
    frequency: freq,
    status: heardSet.has(freq) ? 'Heard' : missedSet.has(freq) ? 'Missed' : 'Not Tested',
  }));

  const heardFrequencies = FREQUENCIES.filter((f) => heardSet.has(f));
  const missedFrequencies = FREQUENCIES.filter((f) => missedSet.has(f));

  const highestAudibleFrequency = heardFrequencies.length ? Math.max(...heardFrequencies) : null;
  const lowestAudibleFrequency = heardFrequencies.length ? Math.min(...heardFrequencies) : null;

  // Hearing Performance Score = (Heard Frequencies / 18) × 100   — per Section 5
  const score = Math.round((heardFrequencies.length / FREQUENCIES.length) * 100);

  // Are ALL missed frequencies at/above the high-frequency threshold?
  const missedOnlyHighFrequencies =
    missedFrequencies.length > 0 && missedFrequencies.every((f) => f >= HIGH_FREQUENCY_THRESHOLD);

  return {
    ear: earResult?.ear ?? null,
    frequencyTable,
    heardFrequencies,
    missedFrequencies,
    highestAudibleFrequency,
    lowestAudibleFrequency,
    score,
    missedOnlyHighFrequencies,
  };
};

/* ═══════════════════════ 2. Hearing Performance Classification ═══════════════════════ */

// Severity order (low → high): GOOD < REDUCED < REDUCED_HIGH_FREQ < MARKED
export const HEARING_CATEGORY = {
  GOOD: 'Good Frequency Response',
  REDUCED: 'Reduced Hearing',
  REDUCED_HIGH_FREQ: 'Reduced High-Frequency Hearing',
  MARKED: 'Marked Hearing Reduction',
};

const HEARING_CATEGORY_SEVERITY = {
  [HEARING_CATEGORY.GOOD]: 0,
  [HEARING_CATEGORY.REDUCED]: 1,
  [HEARING_CATEGORY.REDUCED_HIGH_FREQ]: 2,
  [HEARING_CATEGORY.MARKED]: 3,
};

/**
 * Classifies a single ear's performance into one of the qualitative categories
 * used by the Section 7 decision matrix. Thresholds are a reasonable clinical
 * interpretation of the doc's examples — tune here if audiology guidance differs.
 */
export const classifyEarPerformance = (earAnalysis) => {
  const { score, missedFrequencies, missedOnlyHighFrequencies } = earAnalysis;

  if (missedFrequencies.length === 0 || score >= 90) {
    return HEARING_CATEGORY.GOOD;
  }
  if (score < 50) {
    return HEARING_CATEGORY.MARKED;
  }
  if (missedOnlyHighFrequencies) {
    return HEARING_CATEGORY.REDUCED_HIGH_FREQ;
  }
  return HEARING_CATEGORY.REDUCED;
};

/** Combines Left + Right ear categories into one overall category — the WORSE of the two drives clinical risk. */
export const combineHearingCategories = (leftCategory, rightCategory) => {
  const leftSeverity = HEARING_CATEGORY_SEVERITY[leftCategory] ?? 0;
  const rightSeverity = HEARING_CATEGORY_SEVERITY[rightCategory] ?? 0;
  return leftSeverity >= rightSeverity ? leftCategory : rightCategory;
};

/* ═══════════════════════════ 3. Medical Risk Rule Engine ═══════════════════════════ */

export const MEDICAL_RISK = { LOW: 'LOW', MODERATE: 'MODERATE', HIGH: 'HIGH' };
const MEDICAL_RISK_RANK = { LOW: 0, MODERATE: 1, HIGH: 2 };
const rankToRisk = (rank) => (rank <= 0 ? 'LOW' : rank === 1 ? 'MODERATE' : 'HIGH');

/** Translates raw Firestore medicalHistory answers ("1".."9") into semantic fields. */
export const mapMedicalHistory = (raw = {}) => ({
  hearingDifficulty: raw['1'] ?? null,
  worseEar: raw['2'] ?? null,
  earPain: raw['3'] ?? null,
  occupationalNoiseExposure: raw['4'] ?? null,
  mainNoiseSource: raw['5'] ?? null,
  hearingProtectionUsage: raw['6'] ?? null,
  durationOfExposure: raw['7'] ?? null,
  previousHearingTest: raw['8'] ?? null,
  familyHistory: raw['9'] ?? null,
});

const isLongTermExposure = (duration) => {
  if (!duration) return false;
  const d = String(duration).toLowerCase();
  return d.includes('5-10') || d.includes('5–10') || d.includes('10+') || d.includes('>10') || d.includes('more than 10');
};

const isAsymmetricHearing = (worseEar) => {
  if (!worseEar) return false;
  const v = String(worseEar).toLowerCase();
  return v === 'left' || v === 'right';
};

/**
 * The rule table. Modular by design — add, remove, or edit rules here without
 * touching anything else. Each rule either sets a FLOOR (risk can't go below X)
 * or ESCALATES (risk goes up by one level, capped at HIGH).
 */
const MEDICAL_RISK_RULES = [
  {
    id: 'R1',
    label: 'Self-reported hearing difficulty',
    evidence: 'WHO Hearing Screening Guidelines',
    test: (mh) => mh.hearingDifficulty === 'Yes',
    type: 'floor',
    level: MEDICAL_RISK.MODERATE, // "If hearing difficulty is reported, Medical Risk cannot be LOW."
  },
  {
    id: 'R2',
    label: 'Occupational noise exposure without hearing protection',
    evidence: 'NIOSH Hearing Conservation Program',
    test: (mh) => mh.occupationalNoiseExposure === 'Yes' && mh.hearingProtectionUsage === 'Never',
    type: 'floor',
    level: MEDICAL_RISK.HIGH,
  },
  {
    id: 'R2b',
    label: 'Occupational noise exposure with inconsistent hearing protection',
    evidence: 'NIOSH Hearing Conservation Program',
    test: (mh) => mh.occupationalNoiseExposure === 'Yes' && mh.hearingProtectionUsage === 'Sometimes',
    type: 'escalate',
  },
  {
    id: 'R3',
    label: 'Family history combined with occupational noise exposure',
    evidence: 'Audiology literature — gene/environment interaction',
    test: (mh) => mh.familyHistory === 'Yes' && mh.occupationalNoiseExposure === 'Yes',
    type: 'escalate',
  },
  {
    id: 'R4',
    label: 'Long-term occupational noise exposure (5+ years)',
    evidence: 'WHO Occupational Hearing Loss Prevention',
    test: (mh) => isLongTermExposure(mh.durationOfExposure),
    type: 'escalate',
  },
  {
    id: 'R5',
    label: 'Reported ear pain',
    evidence: 'Clinical indicator warranting medical evaluation',
    test: (mh) => mh.earPain === 'Yes',
    type: 'escalate',
  },
  {
    id: 'R6',
    label: 'Asymmetric hearing (one ear worse than the other)',
    evidence: 'Clinical indicator for possible unilateral pathology',
    test: (mh) => isAsymmetricHearing(mh.worseEar),
    type: 'escalate',
  },
];

// "If multiple established risk factors are present, Medical Risk becomes HIGH."
const MULTIPLE_FACTORS_THRESHOLD = 3;

/**
 * Runs the full medical risk rule engine against a mapped medical history object.
 * Returns the classification plus a transparent list of which rules fired
 * (used for the Risk Factor Summary and the stored explanation).
 */
export const assessMedicalRisk = (mh) => {
  let rank = MEDICAL_RISK_RANK.LOW;
  const matchedRules = [];

  MEDICAL_RISK_RULES.forEach((rule) => {
    if (!rule.test(mh)) return;
    matchedRules.push({ id: rule.id, label: rule.label, evidence: rule.evidence });

    if (rule.type === 'floor') {
      rank = Math.max(rank, MEDICAL_RISK_RANK[rule.level]);
    } else if (rule.type === 'escalate') {
      rank = Math.min(rank + 1, MEDICAL_RISK_RANK.HIGH);
    }
  });

  if (matchedRules.length >= MULTIPLE_FACTORS_THRESHOLD) {
    rank = Math.max(rank, MEDICAL_RISK_RANK.HIGH);
  }

  return {
    classification: rankToRisk(rank),
    matchedRules,
  };
};

/** Risk Factor Summary (Section 6 display list) — always shows all checked items, present or not. */
export const buildRiskFactorSummary = (mh) => {
  const isSometimes = mh.hearingProtectionUsage === 'Sometimes';
  const isNever = mh.hearingProtectionUsage === 'Never';

  return [
    { label: 'Occupational noise exposure', present: mh.occupationalNoiseExposure === 'Yes' },
    { label: 'Self-reported hearing difficulty', present: mh.hearingDifficulty === 'Yes' },
    {
      label: isLongTermExposure(mh.durationOfExposure)
        ? `Long-term exposure (${mh.durationOfExposure})`
        : 'Long-term exposure',
      present: isLongTermExposure(mh.durationOfExposure),
    },
    {
      label: isNever
        ? 'Does not use hearing protection'
        : isSometimes
        ? 'Uses hearing protection only sometimes'
        : 'Inconsistent hearing protection',
      present: isSometimes || isNever,
    },
    { label: 'Family history of hearing loss', present: mh.familyHistory === 'Yes' },
    { label: 'Reported ear pain', present: mh.earPain === 'Yes' },
    { label: 'Asymmetric hearing between ears', present: isAsymmetricHearing(mh.worseEar) },
  ];
};

/* ═══════════════════════════ 4. Final Risk Decision Matrix ═══════════════════════════ */

export const FINAL_RISK = { LOW: 'LOW', MODERATE: 'MODERATE', HIGH: 'HIGH', CRITICAL: 'CRITICAL' };

/**
 * Rule-based decision matrix (NOT arithmetic). Ordered rows are checked top to
 * bottom; the first matching row wins. Mirrors the example matrix in Section 7,
 * filled out for every Hearing-Category × Medical-Risk combination.
 */
const DECISION_MATRIX = [
  // Marked hearing reduction is always at least HIGH, regardless of medical risk —
  // and escalates to CRITICAL when medical risk is also HIGH (own extension, so
  // CRITICAL is reachable; adjust if you want different criteria).
  { hearing: HEARING_CATEGORY.MARKED, medical: MEDICAL_RISK.HIGH, result: FINAL_RISK.CRITICAL },
  { hearing: HEARING_CATEGORY.MARKED, medical: MEDICAL_RISK.MODERATE, result: FINAL_RISK.HIGH },
  { hearing: HEARING_CATEGORY.MARKED, medical: MEDICAL_RISK.LOW, result: FINAL_RISK.HIGH },

  { hearing: HEARING_CATEGORY.REDUCED_HIGH_FREQ, medical: MEDICAL_RISK.HIGH, result: FINAL_RISK.HIGH },
  { hearing: HEARING_CATEGORY.REDUCED_HIGH_FREQ, medical: MEDICAL_RISK.MODERATE, result: FINAL_RISK.MODERATE },
  { hearing: HEARING_CATEGORY.REDUCED_HIGH_FREQ, medical: MEDICAL_RISK.LOW, result: FINAL_RISK.MODERATE },

  { hearing: HEARING_CATEGORY.REDUCED, medical: MEDICAL_RISK.HIGH, result: FINAL_RISK.HIGH },
  { hearing: HEARING_CATEGORY.REDUCED, medical: MEDICAL_RISK.MODERATE, result: FINAL_RISK.MODERATE },
  { hearing: HEARING_CATEGORY.REDUCED, medical: MEDICAL_RISK.LOW, result: FINAL_RISK.MODERATE },

  { hearing: HEARING_CATEGORY.GOOD, medical: MEDICAL_RISK.HIGH, result: FINAL_RISK.MODERATE },
  { hearing: HEARING_CATEGORY.GOOD, medical: MEDICAL_RISK.MODERATE, result: FINAL_RISK.MODERATE },
  { hearing: HEARING_CATEGORY.GOOD, medical: MEDICAL_RISK.LOW, result: FINAL_RISK.LOW },
];

export const evaluateFinalRisk = (hearingCategory, medicalRiskClassification) => {
  const row = DECISION_MATRIX.find(
    (r) => r.hearing === hearingCategory && r.medical === medicalRiskClassification
  );
  // Should always match given the table above covers every combination, but
  // fall back safely just in case new categories are added later.
  return row ? row.result : FINAL_RISK.MODERATE;
};

/** Builds the human-readable explanation required by Section 7 (also stored in Firestore). */
export const buildFinalRiskExplanation = (hearingCategory, finalRisk, matchedRules) => {
  const factorPhrases = matchedRules.map((r) => r.label.charAt(0).toLowerCase() + r.label.slice(1));
  const factorsText =
    factorPhrases.length === 0
      ? 'no significant medical risk factors'
      : factorPhrases.length === 1
      ? factorPhrases[0]
      : `${factorPhrases.slice(0, -1).join(', ')} and ${factorPhrases[factorPhrases.length - 1]}`;

  return `${hearingCategory} combined with ${factorsText} indicates ${finalRisk} RISK.`;
};

/* ═══════════════════════════ 5. Personalized Recommendations ═══════════════════════════ */

export const RECOMMENDATIONS = {
  [FINAL_RISK.LOW]: [
    'Continue annual hearing screening.',
    'Maintain current noise exposure precautions.',
  ],
  [FINAL_RISK.MODERATE]: [
    'Use hearing protection consistently in noisy environments.',
    'Repeat hearing screening within six months.',
    'Monitor for any changes in hearing or ear discomfort.',
  ],
  [FINAL_RISK.HIGH]: [
    'Reduce occupational noise exposure where possible.',
    'Consult occupational health services.',
    'Use certified hearing protection at all times during noise exposure.',
    'Repeat hearing screening within three months.',
  ],
  [FINAL_RISK.CRITICAL]: [
    'Immediate referral to an Audiologist / ENT specialist is recommended.',
    'Avoid further unprotected noise exposure until clinically evaluated.',
    'Arrange a comprehensive diagnostic audiometric examination.',
  ],
};

/* ═══════════════════════════ 6. Report Assembly ═══════════════════════════ */

const formatTestDate = (isoString) => {
  const date = new Date(isoString);
  const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const timePart = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { datePart, timePart };
};

/** Generates a sequential-looking Report ID, e.g. "REP-2026-001", based on existing report count. */
export const generateReportId = (existingReportCount) => {
  const year = new Date().getFullYear();
  const sequence = String(existingReportCount + 1).padStart(3, '0');
  return `REP-${year}-${sequence}`;
};

/**
 * Runs the ENTIRE pipeline (Sections 3–9) and returns a single, Firestore-ready
 * report object. This is the main entry point Generate.jsx calls.
 *
 * @param {object} params.leftResult   Raw LEFT ear record from Realtime Database
 * @param {object} params.rightResult  Raw RIGHT ear record from Realtime Database
 * @param {object} params.userProfile  User's Auth Firestore doc data (name, age, etc.)
 * @param {object} params.medicalHistoryRaw  Raw medicalHistory object ("1".."9")
 * @param {string} params.reportId     Pre-generated Report ID
 */
export const buildHearingReport = ({
  leftResult,
  rightResult,
  userProfile,
  medicalHistoryRaw,
  reportId,
}) => {
  // --- Section 3 & 4: Frequency analysis ---
  const leftAnalysis = analyzeEar(leftResult);
  const rightAnalysis = analyzeEar(rightResult);

  // --- Section 5: Hearing performance scores ---
  const overallScore = Math.round((leftAnalysis.score + rightAnalysis.score) / 2);

  const leftCategory = classifyEarPerformance(leftAnalysis);
  const rightCategory = classifyEarPerformance(rightAnalysis);
  const overallCategory = combineHearingCategories(leftCategory, rightCategory);

  // --- Section 6: Medical risk rule engine ---
  const medicalHistory = mapMedicalHistory(medicalHistoryRaw);
  const riskFactorSummary = buildRiskFactorSummary(medicalHistory);
  const { classification: medicalRiskClassification, matchedRules } = assessMedicalRisk(medicalHistory);

  // --- Section 7: Final risk decision matrix ---
  const finalRisk = evaluateFinalRisk(overallCategory, medicalRiskClassification);
  const finalRiskExplanation = buildFinalRiskExplanation(overallCategory, finalRisk, matchedRules);

  // --- Section 8 & 9: Recommendations ---
  const recommendations = RECOMMENDATIONS[finalRisk] ?? [];

  // --- Section 1: Report header ---
  const testDateIso = new Date().toISOString();
  const { datePart, timePart } = formatTestDate(testDateIso);

  return {
    reportId,
    testDate: testDateIso,
    testDateDisplay: datePart,
    testTimeDisplay: timePart,

    userInfo: {
      name: userProfile?.name ?? null,
      age: userProfile?.ageCategory ?? null,
      gender: userProfile?.gender ?? null,
      occupation: userProfile?.jobRole ?? null,
      phoneNumber: userProfile?.mobile ?? null,
      email: userProfile?.email ?? null,
      employeeId: userProfile?.uid ?? null,
    },

    medicalHistorySummary: riskFactorSummary,

    hearingScreeningResults: {
      left: leftAnalysis.frequencyTable,
      right: rightAnalysis.frequencyTable,
    },

    frequencyResponseSummary: {
      left: {
        heardFrequencies: leftAnalysis.heardFrequencies,
        missedFrequencies: leftAnalysis.missedFrequencies,
        highestAudibleFrequency: leftAnalysis.highestAudibleFrequency,
        lowestAudibleFrequency: leftAnalysis.lowestAudibleFrequency,
      },
      right: {
        heardFrequencies: rightAnalysis.heardFrequencies,
        missedFrequencies: rightAnalysis.missedFrequencies,
        highestAudibleFrequency: rightAnalysis.highestAudibleFrequency,
        lowestAudibleFrequency: rightAnalysis.lowestAudibleFrequency,
      },
    },

    hearingPerformanceAnalysis: {
      leftEarScore: leftAnalysis.score,
      leftEarCategory: leftCategory,
      rightEarScore: rightAnalysis.score,
      rightEarCategory: rightCategory,
      overallScore,
      overallCategory,
    },

    medicalRiskAnalysis: {
      riskFactorSummary,
      classification: medicalRiskClassification,
      matchedRules,
    },

    finalRiskEvaluation: {
      classification: finalRisk,
      explanation: finalRiskExplanation,
    },

    recommendations,

    disclaimer:
      'This report is intended for occupational hearing screening and monitoring purposes only. ' +
      'It is not a substitute for a professional audiological diagnosis or clinical audiometric examination.',
  };
};