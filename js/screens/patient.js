/**
 * patient.js — Name and Sex.
 */
import { t } from '../ui/i18n.js';
import { createFace } from '../ui/face.js';

export function render(root, ctx) {
  const p = ctx.state.patient;
  const face = createFace('listening');

  root.innerHTML = `
    <section class="page">
      <div class="field-row" style="justify-content:center; margin-bottom:1rem;">
        <div style="width:100px;" id="patientFace"></div>
      </div>
      <h2 class="page-title">${t('patient.title')}</h2>
      <p class="page-sub">${t('patient.sub')}</p>

      <div class="card" style="max-width:500px; margin: 0 auto;">
        <label class="field">
          <span>${t('patient.name')}</span>
          <input type="text" id="pName" autocomplete="off" placeholder="${t('patient.namePh')}" value="${p.name || ''}" />
        </label>

        <div class="field" style="margin-top:1rem;">
          <span>${t('patient.sex')}</span>
          <div class="segmented" id="sexGroup" role="group">
            <button type="button" class="btn btn-secondary" data-sex="male" aria-pressed="${p.sex === 'male'}">${t('patient.male')}</button>
            <button type="button" class="btn btn-secondary" data-sex="female" aria-pressed="${p.sex === 'female'}">${t('patient.female')}</button>
          </div>
        </div>

        <button class="btn btn-primary btn-xl" id="nextBtn" style="width:100%; margin-top:1.5rem;">${t('common.continue')}</button>
      </div>
    </section>
  `;

  root.querySelector('#patientFace').appendChild(face);
  ctx.setFace('listening');
  ctx.speak(t('patient.speak'));

  let sex = p.sex || '';
  const sexGroup = root.querySelector('#sexGroup');
  sexGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sex]');
    if (!btn) return;
    sex = btn.dataset.sex;
    sexGroup.querySelectorAll('[data-sex]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sex === sex)));
  });

  root.querySelector('#nextBtn').addEventListener('click', () => {
    const name = root.querySelector('#pName').value.trim();
    ctx.state.patient.name = name;
    ctx.state.patient.sex = sex || 'unknown';
    ctx.navigate('bmi');
  });
}