/**
 * advice.js
 * ------------------------------------------------------------------
 * Generates Baymax's advice with specific color statuses.
 * The flow is: Reading -> Meaning -> Tip (if needed).
 * ------------------------------------------------------------------
 */

import { CONFIG } from '../config.js';
import { t, getLang } from '../ui/i18n.js';

function ageRange(age) {
  if (!age) return 'unknown';
  if (age < 18) return '13-17';
  if (age < 40) return '18-39';
  if (age < 65) return '40-64';
  return '65+';
}

/** Build the offline template advice as an array of { text, status } */
export function buildOfflineAdvice(summary) {
  const out = [];
  const push = (text, status = 'normal') => out.push({ text, status });
  const overall = summary.overall || 'normal';

  push(t('advice.intro'), overall);

  if (overall === 'normal') {
    push(t('advice.overall.normal'), 'normal');
  } else {
    push(t('advice.overall.caution'), 'caution');
  }

  // Loop through each reading, and add the specific tip right after it!
  summary.items.forEach((item) => {
    // 1. The Reading (e.g., "Blood Pressure: 119/74 mmHg")
    push(t(item.titleKey) + ': ' + item.value, item.status);
    
    // 2. The Meaning (e.g., "Your blood pressure is in the normal range.")
    push(t(item.labelKey), item.status);

    // 3. The Specific Advice Tip
    if (item.id === 'bp') {
      if (item.status === 'caution') push(t('advice.tip.bp.caution'), 'caution');
      if (item.status === 'urgent') push(t('advice.tip.bp.urgent'), 'urgent');
    }
    
    if (item.id === 'pulse') {
      if (item.status === 'caution') push(t('advice.tip.pulse.caution'), 'caution');
      if (item.status === 'urgent') push(t('advice.tip.pulse.urgent'), 'urgent');
    }
    
    if (item.id === 'temp') {
      if (item.status === 'caution') push(t('advice.tip.temp.caution'), 'caution');
      if (item.status === 'urgent') push(t('advice.tip.temp.urgent'), 'urgent');
    }
    
    if (item.id === 'spo2') {
      if (item.status === 'caution') push(t('advice.tip.spo2.caution'), 'caution');
      if (item.status === 'urgent') push(t('advice.tip.spo2.urgent'), 'urgent');
    }
    
    if (item.id === 'pain') {
      if (item.status === 'caution') push(t('advice.tip.pain.caution'), 'caution');
      if (item.status === 'urgent') push(t('advice.tip.pain.urgent'), 'urgent');
    }
    
    if (item.id === 'bmi' && item.status === 'caution') {
      push(t('advice.tip.bmi'), 'caution');
    }
  });

  // General self-care comes after all the specific readings
  if (overall === 'normal') {
    push(t('advice.selfcare.normal'), 'normal');
  } else {
    push(t('advice.selfcare.caution'), 'caution');
  }

  push(t('advice.warning'), 'caution');
  push(t('advice.closing'), overall);

  return out;
}

async function fetchOnlineAdvice(summary) {
  if (!CONFIG.LLM_ENDPOINT) throw new Error('no endpoint');
  const payload = {
    ageRange: ageRange(summary.patient.age),
    sex: summary.patient.sex || 'unknown',
    language: getLang(),
    overall: summary.overall,
    symptoms: summary.symptoms,
    painScore: summary.painScore,
    readings: summary.items.map((i) => ({
      id: i.id, value: i.value, status: i.status
    }))
  };
  const systemPrompt = 'You are Baymax, a gentle healthcare companion. Give PRELIMINARY GUIDANCE ONLY. Never diagnose. Never prescribe specific medicines or dosages. Defer to the provided urgency level. Include a line telling the person to see a healthcare professional. Keep it under 150 words. Simple language. Reply in the requested language.';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.LLM_TIMEOUT_MS);

  try {
    const res = await fetch(CONFIG.LLM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: systemPrompt, data: payload }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    const text = data.text || (data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '');
    if (!text) throw new Error('empty');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function getAdvice(summary) {
  if (CONFIG.LLM_ENDPOINT) {
    try {
      const text = await fetchOnlineAdvice(summary);
      if (text) {
        return { 
          chunks: [{ text, status: summary.overall }], 
          source: 'online' 
        };
      }
    } catch (e) {}
  }
  return { chunks: buildOfflineAdvice(summary), source: 'offline' };
}