// reportHtml.js
//
// Builds a standalone HTML string from the report object produced by
// Generate.jsx / hearingRiskEngine.js. Used only to feed react-native-html-to-pdf —
// keep this dependency-free (no RN imports) so it's easy to preview/test in a browser.

const RISK_COLORS = {
  LOW: '#22C55E',
  MODERATE: '#F59E0B',
  HIGH: '#EF4444',
  CRITICAL: '#7C3AED',
};

const FACTOR_LABELS = {
  hearingDifficulty: 'Self-reported hearing difficulty',
  asymmetricHearing: 'Asymmetric hearing (one ear worse)',
  earPain: 'Ear pain (last 6 months)',
  occupationalNoiseExposure: 'Occupational noise exposure',
  inconsistentProtection: 'Inconsistent hearing protection use',
  neverUsesProtection: 'Never uses hearing protection',
  longTermExposure: 'Long-term exposure (5+ years)',
  veryLongTermExposure: 'Very long-term exposure (10+ years)',
  noPriorHearingTest: 'No previous hearing test',
  familyHistory: 'Family history of hearing loss',
};

const escapeHtml = (value) => {
  if (value === null || value === undefined) return '—';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const formatDate = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatTime = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const infoRow = (label, value) => `
  <tr>
    <td class="info-label">${escapeHtml(label)}</td>
    <td class="info-value">${escapeHtml(value)}</td>
  </tr>
`;

const frequencyRow = (row) => `
  <tr>
    <td>${row.frequency} Hz</td>
    <td class="${row.left === 'Heard' ? 'heard' : 'missed'}">${row.left}</td>
    <td class="${row.right === 'Heard' ? 'heard' : 'missed'}">${row.right}</td>
  </tr>
`;

const earSummaryBlock = (label, summary) => `
  <div class="ear-card">
    <h4>${escapeHtml(label)}</h4>
    <p class="small-label">Heard Frequencies</p>
    <p class="heard">${summary.heardFrequencies.length ? summary.heardFrequencies.join(', ') : 'None'}</p>
    <p class="small-label">Missed Frequencies</p>
    <p class="missed">${summary.missedFrequencies.length ? summary.missedFrequencies.join(', ') : 'None'}</p>
    <table class="mini-table">
      ${infoRow('Highest Audible', summary.highestAudibleFrequency ? `${summary.highestAudibleFrequency} Hz` : '—')}
      ${infoRow('Lowest Audible', summary.lowestAudibleFrequency ? `${summary.lowestAudibleFrequency} Hz` : '—')}
    </table>
  </div>
`;

const scoreCard = (label, score, category) => `
  <div class="score-card">
    <p class="small-label">${escapeHtml(label)}</p>
    <p class="score">${score}%</p>
    <p class="category">${escapeHtml(category)}</p>
  </div>
`;

const factorRow = (label, present) => `
  <div class="factor-row">
    <span class="${present ? 'check-yes' : 'check-no'}">${present ? '&#10003;' : '&#10007;'}</span>
    <span class="${present ? 'factor-present' : 'factor-absent'}">${escapeHtml(label)}</span>
  </div>
`;

export function buildReportHtml(report) {
  const {
    reportId, testDate,
    userInfo, medicalHistorySummary, frequencyTable,
    earSummary, hearingPerformance, medicalRisk, finalRisk,
    recommendations, disclaimer,
  } = report;

  const finalColor = RISK_COLORS[finalRisk.classification] || '#F59E0B';
  const medicalColor = RISK_COLORS[medicalRisk.classification] || '#F59E0B';

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, Helvetica, Arial, sans-serif;
    color: #1E293B;
    padding: 32px;
    font-size: 13px;
    line-height: 1.5;
  }
  h1 { font-size: 20px; margin: 0 0 4px 0; color: #1A3C6E; }
  h2 { font-size: 15px; margin: 28px 0 10px 0; color: #1A3C6E; border-bottom: 2px solid #1A3C6E; padding-bottom: 6px; }
  h4 { font-size: 13px; margin: 0 0 8px 0; }
  .subtitle { color: #64748B; font-size: 12px; margin-bottom: 20px; }

  .banner {
    background: ${finalColor}15;
    border: 1px solid ${finalColor}55;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    margin-bottom: 10px;
  }
  .banner .label { color: #64748B; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
  .banner .classification { color: ${finalColor}; font-size: 22px; font-weight: 800; margin: 6px 0; }
  .banner .explanation { color: #475569; font-size: 12.5px; }
  .referral {
    display: inline-block; margin-top: 10px; background: ${finalColor}; color: #fff;
    padding: 6px 14px; border-radius: 8px; font-size: 11.5px; font-weight: 700;
  }

  table { width: 100%; border-collapse: collapse; }
  .info-table td { padding: 5px 0; }
  .info-label { color: #64748B; font-size: 12px; }
  .info-value { color: #1E293B; font-weight: 700; text-align: right; font-size: 12.5px; }

  .freq-table { margin-top: 4px; }
  .freq-table th {
    background: #F8FAFC; text-align: left; padding: 8px 10px; font-size: 11px; color: #64748B;
  }
  .freq-table td { padding: 7px 10px; border-top: 1px solid #F1F5F9; font-size: 12px; }
  .heard { color: #22C55E; font-weight: 600; }
  .missed { color: #EF4444; font-weight: 600; }

  .ear-summary-wrap { display: flex; gap: 14px; }
  .ear-card {
    flex: 1; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px; background: #FFFFFF;
  }
  .small-label { font-size: 10px; color: #94A3B8; font-weight: 700; margin: 8px 0 2px 0; }
  .mini-table { margin-top: 10px; border-top: 1px solid #F1F5F9; padding-top: 6px; }

  .score-wrap { display: flex; gap: 14px; margin-bottom: 10px; }
  .score-card {
    flex: 1; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; background: #FFFFFF; text-align: center;
  }
  .score { font-size: 22px; font-weight: 800; color: #1A3C6E; margin: 4px 0; }
  .category { font-size: 11px; color: #475569; }

  .risk-badge-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .risk-dot { width: 36px; height: 36px; border-radius: 18px; background: currentColor; opacity: 0.15; }
  .risk-text .label { font-size: 11px; color: #64748B; font-weight: 600; }
  .risk-text .value { font-size: 17px; font-weight: 800; }

  .factor-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 12px; }
  .check-yes { color: #22C55E; font-weight: 800; }
  .check-no { color: #CBD5E1; font-weight: 800; }
  .factor-present { color: #1E293B; font-weight: 600; }
  .factor-absent { color: #94A3B8; }

  .med-history-item { padding: 8px 0; border-top: 1px solid #F1F5F9; }
  .med-history-item:first-child { border-top: none; }
  .med-question { font-size: 12px; color: #374151; }
  .med-answer { font-size: 12.5px; font-weight: 700; color: #1A3C6E; margin-top: 2px; }

  .rec-item { display: flex; gap: 8px; padding: 5px 0; font-size: 12.5px; }
  .rec-bullet { color: #1A3C6E; }

  .disclaimer {
    margin-top: 24px; background: #F1F5F9; border-radius: 10px; padding: 14px;
    font-size: 10.5px; color: #64748B; font-style: italic; text-align: center;
  }

  .card { border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; background: #FFFFFF; }
</style>
</head>
<body>

  <h1>Hearing Screening Report</h1>
  <p class="subtitle">Report ID: ${escapeHtml(reportId)} &nbsp;•&nbsp; ${formatDate(testDate)} at ${formatTime(testDate)}</p>

  <div class="banner">
    <p class="label">FINAL RISK CLASSIFICATION</p>
    <p class="classification">${escapeHtml(finalRisk.classification)} RISK</p>
    <p class="explanation">${escapeHtml(finalRisk.explanation)}</p>
    ${finalRisk.specialistReferral ? '<div class="referral">&#9877; Specialist Referral Recommended</div>' : ''}
  </div>

  <h2>Section 1 — User Information</h2>
  <div class="card">
    <table class="info-table">
      ${infoRow('Name', userInfo.name)}
      ${infoRow('Age', userInfo.age)}
      ${infoRow('Gender', userInfo.gender)}
      ${infoRow('Occupation', userInfo.occupation)}
      ${infoRow('Phone Number', userInfo.phoneNumber)}
      ${infoRow('Email', userInfo.email)}
      ${infoRow('Employee ID', userInfo.employeeId)}
    </table>
  </div>

  <h2>Section 2 — Medical History Summary</h2>
  <div class="card">
    ${medicalHistorySummary.map((item) => `
      <div class="med-history-item">
        <p class="med-question">${escapeHtml(item.question)}</p>
        <p class="med-answer">${escapeHtml(item.answer)}</p>
      </div>
    `).join('')}
  </div>

  <h2>Section 3 — Hearing Screening Results</h2>
  <table class="freq-table">
    <thead>
      <tr><th>Frequency</th><th>Left Ear</th><th>Right Ear</th></tr>
    </thead>
    <tbody>
      ${frequencyTable.map(frequencyRow).join('')}
    </tbody>
  </table>

  <h2>Section 4 — Frequency Response Summary</h2>
  <div class="ear-summary-wrap">
    ${earSummaryBlock('Left Ear', earSummary.left)}
    ${earSummaryBlock('Right Ear', earSummary.right)}
  </div>

  <h2>Section 5 — Hearing Performance Analysis</h2>
  <div class="score-wrap">
    ${scoreCard('Left Ear', hearingPerformance.leftScore, hearingPerformance.leftCategory)}
    ${scoreCard('Right Ear', hearingPerformance.rightScore, hearingPerformance.rightCategory)}
  </div>
  ${scoreCard('Overall Hearing Performance', hearingPerformance.overallScore, hearingPerformance.overallCategory)}

  <h2>Section 6 — Medical Risk Analysis</h2>
  <div class="card">
    <div class="risk-badge-row">
      <div class="risk-text">
        <p class="label">Medical Risk Classification</p>
        <p class="value" style="color:${medicalColor}">${escapeHtml(medicalRisk.classification)}</p>
      </div>
    </div>
    <p class="small-label" style="margin-top:4px;">RISK FACTOR SUMMARY</p>
    ${Object.entries(medicalRisk.factors).map(([key, present]) => factorRow(FACTOR_LABELS[key] || key, present)).join('')}
  </div>

  <h2>Section 7 — Final Risk Evaluation</h2>
  <div class="card">
    <div class="risk-badge-row">
      <div class="risk-text">
        <p class="label">Final Classification</p>
        <p class="value" style="color:${finalColor}">${escapeHtml(finalRisk.classification)}</p>
      </div>
    </div>
    <p style="font-size:12.5px; color:#374151;">${escapeHtml(finalRisk.explanation)}</p>
  </div>

  <h2>Section 8 — Personalized Recommendations</h2>
  <div class="card">
    ${recommendations.map((rec) => `
      <div class="rec-item">
        <span class="rec-bullet">&bull;</span>
        <span>${escapeHtml(rec)}</span>
      </div>
    `).join('')}
  </div>

  <div class="disclaimer">${escapeHtml(disclaimer)}</div>

</body>
</html>
`;
}