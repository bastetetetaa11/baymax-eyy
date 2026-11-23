/**
 * consent.js — Plain-language consent. Auto-advances when checked.
 */
import { t } from '../ui/i18n.js';
import { createFace } from '../ui/face.js';

export function render(root, ctx) {
  const face = createFace('idle');

  root.innerHTML = `
    <section class="page">
      <div class="field-row" style="justify-content:center; align-items:center; gap:1.5rem; margin-bottom:1rem;">
        <div style="width:100px;" id="consentFace"></div>
      </div>
      <h2 class="page-title">${t('consent.title')}</h2>
      <p class="page-sub">${t('consent.intro')}</p>

      <div class="card" style="text-align:left; max-width:700px; margin: 0 auto;">
        <ul class="consent-list">
          <li>${t('consent.li1')}</li>
          <li>${t('consent.li2')}</li>
          <li>${t('consent.li3')}</li>
          <li>${t('consent.li4')}</li>
        </ul>

        <label class="checkbox-row" for="agreeBox">
          <input type="checkbox" id="agreeBox" />
          <span>${t('consent.check')}</span>
        </label>
      </div>
    </section>
  `;

  root.querySelector('#consentFace').appendChild(face);
  ctx.setFace('concerned');
  ctx.speak(t('consent.speak'));

  const box = root.querySelector('#agreeBox');

  box.addEventListener('change', () => {
    if (box.checked) {
      ctx.state.consent = true;
      face.setExpression('happy');
      ctx.setFace('happy');
      // Auto-proceed after a slight delay so they see the checkmark
      setTimeout(() => {
        ctx.navigate('patient');
      }, 800);
    }
  });
}