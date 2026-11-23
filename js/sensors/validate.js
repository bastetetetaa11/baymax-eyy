/**
 * validate.js
 * ------------------------------------------------------------------
 * Plausibility filters. Rejects impossible values coming from sensors
 * OR from people typing them in.
 * ------------------------------------------------------------------
 */

import { THRESHOLDS as T } from '../engine/thresholds.js';

const P = T.plausibility;

/** Blood pressure + optional pulse. */
export function validateBP(sys, dia, pulse) {
  if (sys === null || dia === null || isNaN(sys) || isNaN(dia)) {
    return { ok: false, error: 'err.required' };
  }
  if (sys < P.sysMin || sys > P.sysMax || dia < P.diaMin || dia > P.diaMax) {
    return { ok: false, error: 'err.bp' };
  }
  if (sys <= dia) {
    return { ok: false, error: 'err.bp' };
  }
  if (pulse !== null && pulse !== undefined && pulse !== '') {
    const p = Number(pulse);
    if (isNaN(p) || p < P.pulseMin || p > P.pulseMax) {
      return { ok: false, error: 'err.pulse' };
    }
  }
  return { ok: true };
}

/** SpO2 + pulse. */
export function validateSpo2Pulse(spo2, pulse) {
  if (spo2 === null || spo2 === undefined || isNaN(spo2)) {
    return { ok: false, error: 'err.required' };
  }
  if (spo2 < P.spo2Min || spo2 > P.spo2Max) {
    return { ok: false, error: 'err.spo2' };
  }
  if (pulse !== null && pulse !== undefined && pulse !== '') {
    const p = Number(pulse);
    if (isNaN(p) || p < P.pulseMin || p > P.pulseMax) {
      return { ok: false, error: 'err.pulse' };
    }
  }
  return { ok: true };
}

/** Temperature. */
export function validateTemp(c) {
  if (c === null || c === undefined || isNaN(c)) {
    return { ok: false, error: 'err.required' };
  }
  if (c < P.tempMin || c > P.tempMax) {
    return { ok: false, error: 'err.temp' };
  }
  return { ok: true };
}

/**
 * Filter a streamed sensor sample. Returns the cleaned object or null.
 * Used by the Serial and Mock providers before emitting.
 */
export function filterSample(sample) {
  if (!sample || typeof sample !== 'object') return null;

  if (sample.type === 'spo2') {
    const spo2 = Number(sample.spo2);
    const pulse = Number(sample.pulse);
    if (isNaN(spo2) || spo2 < P.spo2Min || spo2 > P.spo2Max) return null;
    if (isNaN(pulse) || pulse < P.pulseMin || pulse > P.pulseMax) return null;
    return { type: 'spo2', spo2, pulse };
  }

  if (sample.type === 'temp') {
    const c = Number(sample.c);
    if (isNaN(c) || c < P.tempMin || c > P.tempMax) return null;
    return { type: 'temp', c: Math.round(c * 10) / 10 };
  }

  if (sample.type === 'bp') {
    const sys = Number(sample.sys);
    const dia = Number(sample.dia);
    if (isNaN(sys) || sys < P.sysMin || sys > P.sysMax) return null;
    if (isNaN(dia) || dia < P.diaMin || dia > P.diaMax) return null;
    if (sys <= dia) return null;
    const out = { type: 'bp', sys, dia };
    const pulse = Number(sample.pulse);
    if (!isNaN(pulse) && pulse >= P.pulseMin && pulse <= P.pulseMax) {
      out.pulse = pulse;
    }
    return out;
  }

  return null;
}