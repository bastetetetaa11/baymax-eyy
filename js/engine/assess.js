/**
 * assess.js
 * ------------------------------------------------------------------
 * The deterministic rules engine. This is the SOURCE OF TRUTH for
 * urgency. The AI advice module may NEVER downgrade these levels.
 * 
 * Every function returns:
 *   { status: 'normal' | 'caution' | 'urgent', labelKey: 'i18n.key' }
 * ------------------------------------------------------------------
 */

import { THRESHOLDS as T } from './thresholds.js';

/** Blood pressure. */
export function assessBP(sys, dia) {
  if (sys >= T.bp.crisisSysMin || dia >= T.bp.crisisDiaMin) {
    return { status: 'urgent', labelKey: 'assess.bp.crisis' };
  }
  if (sys <= T.bp.lowSysMax || dia <= T.bp.lowDiaMax) {
    return { status: 'caution', labelKey: 'assess.bp.low' };
  }
  if (sys >= T.bp.stage2SysMin || dia >= T.bp.stage2DiaMin) {
    return { status: 'caution', labelKey: 'assess.bp.stage2' };
  }
  if (sys >= T.bp.stage1SysMin || dia >= T.bp.stage1DiaMin) {
    return { status: 'caution', labelKey: 'assess.bp.stage1' };
  }
  if (
    sys >= T.bp.elevatedSysMin &&
    sys <= T.bp.elevatedSysMax &&
    dia <= T.bp.elevatedDiaMax
  ) {
    return { status: 'caution', labelKey: 'assess.bp.elevated' };
  }
  return { status: 'normal', labelKey: 'assess.bp.normal' };
}

/** Resting pulse. */
export function assessPulse(bpm) {
  if (bpm >= T.pulse.urgentMin) {
    return { status: 'urgent', labelKey: 'assess.pulse.veryHigh' };
  }
  if (bpm <= T.pulse.lowMax) {
    return { status: 'caution', labelKey: 'assess.pulse.low' };
  }
  if (bpm >= T.pulse.highMin) {
    return { status: 'caution', labelKey: 'assess.pulse.high' };
  }
  return { status: 'normal', labelKey: 'assess.pulse.normal' };
}

/** Blood oxygen saturation. */
export function assessSpo2(value) {
  if (value < T.spo2.urgentBelow) {
    return { status: 'urgent', labelKey: 'assess.spo2.veryLow' };
  }
  if (value < T.spo2.borderlineMin) {
    return { status: 'caution', labelKey: 'assess.spo2.low' };
  }
  if (value < T.spo2.normalMin) {
    return { status: 'caution', labelKey: 'assess.spo2.borderline' };
  }
  return { status: 'normal', labelKey: 'assess.spo2.normal' };
}

/** Body temperature in °C. */
export function assessTemp(c) {
  if (c < T.temp.veryLowMax + 0.1) {
    return { status: 'urgent', labelKey: 'assess.temp.veryLow' };
  }
  if (c <= T.temp.lowMax) {
    return { status: 'caution', labelKey: 'assess.temp.low' };
  }
  if (c >= T.temp.highFeverMin) {
    return { status: 'urgent', labelKey: 'assess.temp.highFever' };
  }
  if (c >= T.temp.normalMax + 0.1 && c <= T.temp.feverMax) {
    if (c >= 38.0) {
      return { status: 'caution', labelKey: 'assess.temp.fever' };
    }
    return { status: 'caution', labelKey: 'assess.temp.elevated' };
  }
  return { status: 'normal', labelKey: 'assess.temp.normal' };
}

/** BMI using Asia-Pacific cutoffs. */
export function assessBMI(bmi) {
  if (bmi < T.bmi.underMax) {
    return { status: 'caution', labelKey: 'assess.bmi.under' };
  }
  if (bmi <= T.bmi.normalMax) {
    return { status: 'normal', labelKey: 'assess.bmi.normal' };
  }
  if (bmi <= T.bmi.overMax) {
    return { status: 'caution', labelKey: 'assess.bmi.over' };
  }
  if (bmi <= T.bmi.ob1Max) {
    return { status: 'caution', labelKey: 'assess.bmi.ob1' };
  }
  return { status: 'caution', labelKey: 'assess.bmi.ob2' };
}

/** Compute BMI from cm and kg. */
export function computeBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  if (m <= 0) return null;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/** Pain score plus optional symptoms. */
export function assessPain(score, symptoms) {
  if (score === null || score === undefined) {
    return { status: 'normal', labelKey: 'assess.pain.mild' };
  }
  const flags = Array.isArray(symptoms) ? symptoms : [];
  const redFlag = flags.indexOf('breath') !== -1 || flags.indexOf('dizziness') !== -1;

  if (score >= T.pain.severeMin && redFlag) {
    return { status: 'urgent', labelKey: 'assess.pain.emergency' };
  }
  if (score >= T.pain.severeMin) {
    return { status: 'caution', labelKey: 'assess.pain.severe' };
  }
  if (score >= T.pain.moderateMin) {
    return { status: 'caution', labelKey: 'assess.pain.moderate' };
  }
  return { status: 'normal', labelKey: 'assess.pain.mild' };
}

/** Combine statuses: the worst one wins. */
export function overallFrom(items) {
  let level = 'normal';
  for (const it of items) {
    if (it.status === 'urgent') return 'urgent';
    if (it.status === 'caution') level = 'caution';
  }
  return level;
}

/**
 * Build the full summary object used by the results and advice screens.
 * `state` is the app state object from main.js.
 */
export function buildSummary(state) {
  const r = state.readings || {};
  const items = [];

  if (r.bp && r.bp.sys && r.bp.dia) {
    const a = assessBP(r.bp.sys, r.bp.dia);
    items.push({
      id: 'bp',
      titleKey: 'bp.title', // Fixed: Was menu.bp
      value: r.bp.sys + '/' + r.bp.dia + ' mmHg',
      status: a.status,
      labelKey: a.labelKey
    });
  }

  // Pulse comes from SpO2 if available, otherwise from the BP reading.
  const pulseVal = (r.spo2 && r.spo2.pulse) || (r.bp && r.bp.pulse) || null;
  if (pulseVal) {
    const p = assessPulse(pulseVal);
    items.push({
      id: 'pulse',
      titleKey: 'results.pulse',
      value: pulseVal + ' bpm',
      status: p.status,
      labelKey: p.labelKey
    });
  }

  if (r.spo2 && r.spo2.spo2) {
    const s = assessSpo2(r.spo2.spo2);
    items.push({
      id: 'spo2',
      titleKey: 'ox.title', // Fixed: Was menu.oxygen
      value: r.spo2.spo2 + ' %',
      status: s.status,
      labelKey: s.labelKey
    });
  }

  if (r.temp && r.temp.c) {
    const tm = assessTemp(r.temp.c);
    items.push({
      id: 'temp',
      titleKey: 'temp.title', // Fixed: Was menu.temp
      value: r.temp.c.toFixed(1) + ' °C',
      status: tm.status,
      labelKey: tm.labelKey
    });
  }

  if (r.bmi && r.bmi.bmi) {
    const b = assessBMI(r.bmi.bmi);
    items.push({
      id: 'bmi',
      titleKey: 'bmi.title', // Fixed: Was menu.bmi
      value: r.bmi.bmi.toFixed(1) + ' kg/m²',
      status: b.status,
      labelKey: b.labelKey
    });
  }

  if (state.pain && state.pain.score !== null && state.pain.score !== undefined) {
    const p = assessPain(state.pain.score, state.pain.symptoms);
    items.push({
      id: 'pain',
      titleKey: 'results.pain',
      value: state.pain.score + ' / 10',
      status: p.status,
      labelKey: p.labelKey
    });
  }

  if (r.skin && r.skin.confident) {
    items.push({
      id: 'skin',
      titleKey: 'skin.title', // Fixed: Was menu.skin
      value: r.skin.topLabel,
      status: 'caution',
      labelKey: 'skin.looksLike'
    });
  }

  const overall = overallFrom(items);

  return {
    overall,
    items,
    patient: state.patient || {},
    symptoms: (state.pain && state.pain.symptoms) || [],
    painScore: state.pain ? state.pain.score : null
  };
}