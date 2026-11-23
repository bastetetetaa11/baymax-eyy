/**
 * emergency.js
 * ------------------------------------------------------------------
 * Shown FIRST whenever the rules engine returns URGENT.
 * No casual advice is shown here — only a calm, clear instruction.
 * ------------------------------------------------------------------
 */

import { CONFIG } from '../config.js';
import { t } from '../ui/i18n.js';
import { createFace } from '../ui/face.js';

export function render(root, ctx) {
  const summary = ctx.buildSummary();
  const face = createFace('alert');

  const rows = summary.items
    .map(
      (item) => `
      <div class="summary-row">
        <span style="font-weight:900;">${t(item.titleKey)}</span>
        <span class="summary-value">${item.value}</span>
        <span class="chip chip--${item.status}">${t(item.labelKey)}</span>
      </div>`
    )
    .join('');

  root.innerHTML = `
    <section class="urgent-page">
      <div class="urgent-face" id="alertFace"></div>

      <h2 class="urgent-title">${t('emergency.title')}</h2>
      <p class="urgent-message">${t('emergency.message')}</p>

      <a class="btn btn-danger btn-xl" href="tel:${CONFIG.EMERGENCY_NUMBER}" style="margin-bottom:1rem;">
        ${t('emergency.call')} — ${CONFIG.EMERGENCY_NUMBER}
      </a>

      <div class="card" style="text-align:left;">
        <h3 style="font-size:1rem;font-weight:900;margin-bottom:0.5rem;">
          ${t('emergency.readings')}
        </h3>
        ${rows || `<p class="hint">${t('results.none')}</p>`}
      </div>

      <div class="btn-row" style="justify-content:center;">
        <button class="btn btn-ghost" id="restartBtn">${t('emergency.restart')}</button>
      </div>
    </section>
  `;

  root.querySelector('#alertFace').appendChild(face);
  ctx.setFace('alert');
  ctx.speak(t('emergency.speak'));

  root.querySelector('#restartBtn').addEventListener('click', () => {
    ctx.resetAll();
    ctx.navigate('home');
  });
}