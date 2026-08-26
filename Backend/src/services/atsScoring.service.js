const SCORE_WEIGHTS = Object.freeze({
  atsCompatibility: 30,
  contactInfo: 5,
  summary: 10,
  experience: 25,
  skills: 15,
  education: 5,
  formatting: 10,
});

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

function roundScore(value) {
  return Math.round(value * 10) / 10;
}

/**
 * The model supplies evidence and component scores; this function owns the
 * final score. That prevents the LLM from independently inventing an overall
 * score and makes the same component scores produce the same final result.
 */
function calculateAtsScore(analysis) {
  const sections = analysis?.sections || {};
  const components = {
    atsCompatibility: clampScore(analysis?.atsCompatibility?.score),
    contactInfo: clampScore(sections.contactInfo?.score),
    summary: clampScore(sections.summary?.score),
    experience: clampScore(sections.experience?.score),
    skills: clampScore(sections.skills?.score),
    education: clampScore(sections.education?.score),
    formatting: clampScore(sections.formatting?.score),
  };

  const weighted = Object.entries(SCORE_WEIGHTS).reduce(
    (total, [key, weight]) => total + components[key] * (weight / 100),
    0,
  );

  return {
    overallScore: roundScore(weighted),
    scoreBreakdown: Object.fromEntries(
      Object.entries(SCORE_WEIGHTS).map(([key, weight]) => [
        key,
        {
          score: components[key],
          weight,
          contribution: roundScore(components[key] * (weight / 100)),
        },
      ]),
    ),
    scoringVersion: "v2",
  };
}

function normalizeAnalysis(analysis) {
  const normalized = analysis && typeof analysis === "object" ? analysis : {};
  const calibrated = calculateAtsScore(normalized);
  return {
    ...normalized,
    overallScore: calibrated.overallScore,
    scoreBreakdown: calibrated.scoreBreakdown,
    scoringVersion: calibrated.scoringVersion,
  };
}

module.exports = {
  SCORE_WEIGHTS,
  calculateAtsScore,
  normalizeAnalysis,
};
