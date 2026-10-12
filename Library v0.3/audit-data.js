/* ============================================================
   NUCLEUX — AI-READINESS AUDIT DATA
   Source of truth: "Nucleux Agentic Components — Audit and
   Improvement Plan" (7 Oct 2026). Every number the homepage
   showcase draws comes from here; the UI derives positions and
   labels from these values and never hard-codes them.

   To publish a new audit: update this object only. Do not add
   history here until a second audit has actually been run.
   ============================================================ */
window.NUCLEUX_AUDIT = {
  framework: { name: 'Open Design System Bench', version: '1.3.0' },

  date: '2026-10-07',

  package: { name: '@nucleux/react', version: '0.4.0' },

  evaluation: {
    model: 'Claude Sonnet',
    harness: 'Claude Code',
    runs: 12,
    tasks: 4,
    contextLevels: 3,
    repetitionsPerCase: 1
  },

  /* Benchmark sub-scores, out of 100. Names in the source report:
     performancePotential = "Ceiling", guidanceImpact = "Lift",
     staticAudit = "Surface". */
  scores: {
    aiReadiness: 75.1,
    staticAudit: 52.3,
    componentEngagement: 91.7,
    vocabularyAccuracy: 100,
    performancePotential: 87.9,
    guidanceImpact: 43.6
  },

  benchmark: {
    scaleMinimum: 0,
    scaleMaximum: 100,
    aiNativeThreshold: 70,
    tier: 'AI-native',
    staticTier: 'Invested'
  },

  findings: {
    appropriateComponentSelection: { successfulCases: 11, totalCases: 12 },
    guidancePerformanceDifference: -6.4
  },

  /* Where "Explore the full audit" goes. There is no audit page on
     the site yet, so this is null and the showcase says the report
     is coming rather than linking somewhere that does not exist.
     Set it to the report's URL (e.g. 'audit.html') when it ships. */
  reportUrl: null
};
