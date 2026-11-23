/**
 * config.js
 * ------------------------------------------------------------------
 * Central place for things you might want to change later.
 * EDIT HERE: the capstone title, emergency number, model paths,
 * and the OPTIONAL online AI endpoint.
 * ------------------------------------------------------------------
 */

export const CONFIG = {
  /** The capstone title shown on the home screen and the top bar. */
  TITLE: 'B.A.Y.M.A.X.',

  /** Shown under the title on the Home screen (translated in i18n.js). */
  EMERGENCY_NUMBER: '911',

  /** Teachable Machine model files (relative to /index.html). */
  MODEL_URL: 'model/model.json',
  METADATA_URL: 'model/metadata.json',

  /**
   * OPTIONAL online advice mode.
   * Leave as '' to stay fully offline (recommended for the capstone demo).
   * If you set it, it MUST be a small proxy you control.
   * NEVER put an API key in this file — anything here is visible to users.
   */
  LLM_ENDPOINT: '',
  LLM_TIMEOUT_MS: 8000,

  /** Auto-wipe everything after 5 minutes of no interaction. */
  INACTIVITY_MS: 5 * 60 * 1000,

  /**
   * Labels used by the SKIN screen's "demo mode" when no real
   * Teachable Machine model is loaded. Purely illustrative.
   */
  DEMO_MODEL_LABELS: [
    'Bruise',
    'Minor cut',
    'Rash',
    'Burn',
    'Insect bite',
    'Normal-looking skin'
  ]
};