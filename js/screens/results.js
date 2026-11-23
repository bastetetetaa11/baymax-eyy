/**
 * results.js — The assessment summary + Baymax's advice.
 * ------------------------------------------------------------------
 */

import { t } from '../ui/i18n.js';
import { createFace } from '../ui/face.js';
import { getAdvice } from '../engine/advice.js';

export function render(root, ctx) {
  const summary = ctx.buildSummary();
  const face = createFace('thinking');

  const rows = summary.items.length
    ? summary.items.map((item) => `
          <div class="summary-row">
            <span style="font-weight:900;">${t(item.titleKey)}</span>
            <span class="summary-value">${item.value}</span>
            <span class="chip chip--${item.status}">${t(item.labelKey)}</span>
          </div>`).join('')
    : `<p class="hint">${t('results.none')}</p>`;

  root.innerHTML = `
    <section class="page">
      <div class="field-row" style="justify-content:center; margin-bottom:1rem;">
        <div style="width:120px;" id="resultFace"></div>
      </div>
      <h2 class="page-title">${t('results.title')}</h2>
      <p class="page-sub">${t('app.disclaimer')}</p>

      <div class="card" style="margin-bottom:1rem; text-align:left;">
        <h3 style="font-size:1.05rem;font-weight:900;margin-bottom:0.4rem;">${t('results.summary')}</h3>
        ${rows}
      </div>

      <div class="card" style="text-align:left;">
        <h3 style="font-size:1.05rem;font-weight:900;margin-bottom:0.6rem;">${t('results.advice')}</h3>
        <div id="adviceBox">
          <p class="hint" id="thinkingLine">
            ${t('results.thinking')} <span class="thinking-dots"><span></span><span></span><span></span></span>
          </p>
        </div>
        <div class="btn-row no-print">
          <button class="btn btn-secondary" id="readAgainBtn" hidden>${t('results.readAgain')}</button>
        </div>
      </div>

      <div class="btn-row no-print" style="justify-content:center; margin-top:1.5rem;">
        <button class="btn btn-secondary" id="printBtn">${t('results.print')}</button>
        <button class="btn btn-ghost" id="newBtn">${t('results.newPatient')}</button>
      </div>

      <div class="card no-print" style="margin-top:1.5rem;" id="satisfactionCard">
        <p style="font-weight:900;margin-bottom:0.8rem;">${t('results.satisfied')}</p>
        <div class="btn-row" style="margin-top:0; justify-content:center;">
          <button class="btn btn-primary" id="yesBtn">${t('common.yes')}</button>
          <button class="btn btn-secondary" id="noBtn">${t('common.no')}</button>
        </div>
      </div>
    </section>
  `;

  root.querySelector('#resultFace').appendChild(face);
  ctx.setFace('thinking');
  ctx.speak(t('results.speak'));

  const adviceBox = root.querySelector('#adviceBox');
  const readAgainBtn = root.querySelector('#readAgainBtn');
  let chunks = [];
  let revealed = 0;
  let revealTimer = null;

  function revealNext() {
    if (revealed >= chunks.length) {
      face.setExpression('idle');
      ctx.setFace('idle');
      return;
    }
    
    const chunk = chunks[revealed];
    const p = document.createElement('p');
    p.className = 'advice-line advice-line--' + chunk.status;
    p.textContent = chunk.text;
    adviceBox.appendChild(p);
    
    ctx.speakQueue(chunk.text);
    revealed++;
    
    const delay = Math.max(1500, Math.min(6000, chunk.text.length * 50));
    revealTimer = setTimeout(revealNext, delay);
  }

  getAdvice(summary).then((result) => {
    chunks = result.chunks;
    const thinking = adviceBox.querySelector('#thinkingLine');
    if (thinking) thinking.remove();

    revealNext();
    readAgainBtn.hidden = false;
  });

  readAgainBtn.addEventListener('click', () => {
    clearTimeout(revealTimer);
    revealed = 0;
    adviceBox.querySelectorAll('.advice-line').forEach((el) => el.remove());
    face.setExpression('thinking');
    revealNext();
  });

  const satCard = root.querySelector('#satisfactionCard');
  function answerSatisfaction(value) {
    ctx.state.satisfaction = value;
    satCard.innerHTML = `<p style="font-weight:900;">${t('results.thanks')}</p>`;
    face.setExpression(value === 'yes' ? 'happy' : 'concerned');
    ctx.setFace(value === 'yes' ? 'happy' : 'concerned');
  }

  root.querySelector('#yesBtn').addEventListener('click', () => answerSatisfaction('yes'));
  root.querySelector('#noBtn').addEventListener('click', () => answerSatisfaction('no'));

  root.querySelector('#printBtn').addEventListener('click', () => window.print());

  root.querySelector('#newBtn').addEventListener('click', () => {
    clearTimeout(revealTimer);
    ctx.resetAll();
    ctx.navigate('home');
  });
}