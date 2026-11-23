/**
 * thresholds.js
 * ------------------------------------------------------------------
 * ALL clinical thresholds live here so a nurse can review them.
 *
 * !! IMPORTANT !!
 * These defaults are for ADULTS and are based on common public
 * references (including Asia-Pacific BMI cutoffs). A school nurse
 * MUST review and adjust them before real-world use.
 * ------------------------------------------------------------------
 */

export const THRESHOLDS = {
  /** Blood pressure, mmHg. */
  bp: {
    lowSysMax: 89,        // <= 89 systolic  -> LOW (caution)
    lowDiaMax: 59,        // <= 59 diastolic -> LOW (caution)
    normalSysMax: 119,
    normalDiaMax: 79,
    elevatedSysMin: 120,  // 120-129 AND dia < 80 -> ELEVATED
    elevatedSysMax: 129,
    elevatedDiaMax: 79,
    stage1SysMin: 130,    // 130-139 OR 80-89 -> STAGE 1
    stage1SysMax: 139,
    stage1DiaMin: 80,
    stage1DiaMax: 89,
    stage2SysMin: 140,    // >= 140 OR >= 90 -> STAGE 2
    stage2DiaMin: 90,
    crisisSysMin: 180,    // >= 180 OR >= 120 -> CRISIS (urgent)
    crisisDiaMin: 120
  },

  /** Resting pulse, bpm. */
  pulse: {
    lowMax: 59,        // < 60  -> low (caution)
    normalMin: 60,
    normalMax: 100,
    highMin: 101,      // > 100 -> high (caution)
    urgentMin: 130     // > 130 at rest -> urgent
  },

  /** Blood oxygen saturation, %. */
  spo2: {
    normalMin: 95,      // 95-100 normal
    borderlineMin: 92,  // 92-94 borderline (caution)
    lowMin: 90,         // 90-91 low (caution, seek care)
    urgentBelow: 90     // < 90 urgent
  },

  /** Body temperature, °C. */
  temp: {
    veryLowMax: 34.9,   // < 35.0 urgent
    lowMax: 36.0,       // 35.0-36.0 slightly low (caution)
    normalMin: 36.1,
    normalMax: 37.2,
    elevatedMax: 37.9,  // 37.3-37.9 slightly elevated (caution)
    feverMax: 39.4,     // 38.0-39.4 fever (caution)
    highFeverMin: 39.5  // >= 39.5 urgent
  },

  /** BMI (Asia-Pacific cutoffs). */
  bmi: {
    underMax: 18.5,   // < 18.5 underweight
    normalMax: 22.9,  // 18.5-22.9 normal
    overMax: 24.9,    // 23-24.9 overweight
    ob1Max: 29.9      // 25-29.9 obese I; >= 30 obese II
  },

  /** Pain scale. */
  pain: {
    moderateMin: 5,   // 5-7 moderate
    severeMin: 8      // 8-10 severe; 8-10 + red flags = urgent
  },

  /**
   * Plausibility limits. Values outside these are rejected as
   * "impossible" (likely sensor or typing errors).
   */
  plausibility: {
    spo2Min: 70,
    spo2Max: 100,
    pulseMin: 30,
    pulseMax: 220,
    tempMin: 30,
    tempMax: 43,
    sysMin: 70,
    sysMax: 250,
    diaMin: 40,
    diaMax: 150
  }
};