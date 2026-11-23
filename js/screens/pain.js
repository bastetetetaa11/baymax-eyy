/**
 * pain.js — 1–10 pain scale plus optional symptom chips.
 */

import { t } from '../ui/i18n.js';
import { createFace } from '../ui/face.js';

const SYMPTOMS = ['fever', 'cough', 'headache', 'dizziness', 'nausea', 'breath'];

const EMOJI = {
  1: '😀', 2: '🙂', 3: '🙂', 4: '😐', 5: '😐',
  6: '😣', 7: '😖', 8: '😫', 9: '😭', 10: '😱'
};

export function render(root, ctx) {
  const face = createFace('listening');
  const pain = ctx.state.pain;

  const painButtons = [];
  for (let i = 1; i <= 10; i++) {
    painButtons.push(
      `<button type="button" class="pain-btn" data-score="${i}"
               aria-pressed="${pain.score === i}">
         <span class="pain-emoji">${EMOJI[i]}</span>
         <span>${i}</span>
       </button>`
    );
  }

  const chipButtons = SYMPTOMS.map(
    (s) => `<button type="button" class="chip-btn" data-sym="${s}"
              aria-pressed="${pain.symptoms.indexOf(s) !== -1}">${t('pain.sym.' + s)}</button>`
  ).join('');

  root.innerHTML = `
    <section class="page">
      <div class="field-row" style="align-items:center; gap:1rem;">
        <div style="width:96px;flex:0 0 auto;" id="painFace"></div>
        <div>
          <h2 class="page-title">${t('pain.title')}</h2>
          <p class="page-sub">${t('pain.question')}</p>
        </div>
      </div>

      <div class="card">
        <div class="pain-grid" id="painGrid" role="group"
             aria-label="${t('pain.question')}">
          ${painButtons.join('')}
        </div>

        <p class="hint" style="margin-top:1rem;">${t('pain.symptoms')}</p>
        <div class="field-row" id="symGroup" style="gap:0.6rem;">
          ${chipButtons}
          <button type="button" class="chip-btn" data-sym="none"
                  aria-pressed="${pain.symptoms.length === 0}">${t('pain.sym.none')}</button>
        </div>

        <p class="error-text" id="painErr" hidden>${t('pain.select')}</p>

        <div class="btn-row">
          <button class="btn btn-ghost" id="backBtn">${t('common.back')}</button>
          <button class="btn btn-primary" id="nextBtn">${t('common.continue')}</button>
        </div>
      </div>
    </section>
  `;

  root.querySelector('#painFace').appendChild(face);
  ctx.setFace('listening');
  ctx.speak(t('pain.speak'));

  let score = pain.score;
  const symptoms = new Set(pain.symptoms);

  const grid = root.querySelector('#painGrid');
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-score]');
    if (!btn) return;
    score = parseInt(btn.dataset.score, 10);
    grid.querySelectorAll('[data-score]').forEach((b) => {
      b.setAttribute('aria-pressed', String(parseInt(b.dataset.score, 10) === score));
    });
    root.querySelector('#painErr').hidden = true;
    face.setExpression(score >= 7 ? 'concerned' : 'listening');
  });

  const symGroup = root.querySelector('#symGroup');
  symGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sym]');
    if (!btn) return;
    const sym = btn.dataset.sym;

    if (sym === 'none') {
      symptoms.clear();
    } else {
      if (symptoms.has(sym)) symptoms.delete(sym);
      else symptoms.add(sym);
    }

    symGroup.querySelectorAll('[data-sym]').forEach((b) => {
      const s = b.dataset.sym;
      if (s === 'none') {
        b.setAttribute('aria-pressed', String(symptoms.size === 0));
      } else {
        b.setAttribute('aria-pressed', String(symptoms.has(s)));
      }
    });
  });

  root.querySelector('#nextBtn').addEventListener('click', () => {
    if (score === null || score === undefined) {
      root.querySelector('#painErr').hidden = false;
      face.setExpression('concerned');
      return;
    }
    ctx.state.pain = { score, symptoms: Array.from(symptoms) };
    ctx.navigate('menu');
  });

  root.querySelector('#backBtn').addEventListener('click', () => {
    ctx.navigate('patient');
  });
}