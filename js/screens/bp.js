import { t } from '../ui/i18n.js';
import { createFace } from '../ui/face.js';

export function render(root, ctx) {
  const face = createFace('listening');

  root.innerHTML = `
    <section class="page">
      <div class="field-row" style="justify-content:center; margin-bottom:1rem;">
        <div style="width:100px;" id="bpFace"></div>
      </div>
      <h2 class="page-title">${t('bp.title')}</h2>

      <div class="instruction-banner">
        <svg style="width:24px;height:24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        ${t('bp.instructions')}
      </div>

      <div class="card" style="max-width:700px; margin: 0 auto;">
        <p class="timer-text" id="timerText">Reading... 30s</p>

        <div class="readout">
          <div class="readout-box stabilizing" id="sysBox">
            <div class="readout-value" id="sysVal">--</div>
            <div class="readout-label">${t('bp.sys')}</div>
          </div>
          <div class="readout-box stabilizing" id="diaBox">
            <div class="readout-value" id="diaVal">--</div>
            <div class="readout-label">${t('bp.dia')}</div>
          </div>
          <div class="readout-box stabilizing" id="pulseBox">
            <div class="readout-value" id="pulseVal">--</div>
            <div class="readout-label">${t('bp.pulse')}</div>
          </div>
        </div>
        
        <button class="btn btn-primary btn-xl" id="continueBtn" style="width:100%; margin-top:1.5rem;" hidden>${t('common.continue')}</button>
      </div>
    </section>
  `;

  root.querySelector('#bpFace').appendChild(face);
  ctx.setFace('thinking');
  ctx.speak(t('bp.speak'));

  const sysVal = root.querySelector('#sysVal');
  const diaVal = root.querySelector('#diaVal');
  const pulseVal = root.querySelector('#pulseVal');
  const timerText = root.querySelector('#timerText');
  const continueBtn = root.querySelector('#continueBtn');

  const provider = ctx.getLiveProvider();
  
  if (!provider) {
    root.querySelector('#sysBox').className = 'readout-box';
    root.querySelector('#diaBox').className = 'readout-box';
    root.querySelector('#pulseBox').className = 'readout-box';
    timerText.textContent = t('err.noDevice');
    timerText.className = 'error-text';
    continueBtn.hidden = false;
    continueBtn.onclick = () => ctx.navigate('oxygen');
    face.setExpression('concerned');
    ctx.setFace('concerned');
    return;
  }

  let samples = [];
  let isDone = false;
  let unsubscribe = null;
  let timeLeft = 30;
  let finalValues = null;

  const intervalTimer = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) timerText.textContent = `Reading... ${timeLeft}s`;
  }, 1000);

  const readingTimer = setTimeout(() => {
    finish();
  }, 30000);

  unsubscribe = provider.subscribe((sample) => {
    if (isDone || sample.type !== 'bp') return;
    sysVal.textContent = sample.sys;
    diaVal.textContent = sample.dia;
    if (sample.pulse) pulseVal.textContent = sample.pulse;
    samples.push(sample);
  });

  function finish() {
    if (isDone) return;
    isDone = true;
    clearInterval(intervalTimer);
    clearTimeout(readingTimer);
    if (unsubscribe) unsubscribe();

    let finalSys = 120, finalDia = 80, finalPulse = 72;
    if (samples.length > 0) {
      const slice = samples.slice(-5);
      finalSys = Math.round(slice.reduce((s, x) => s + x.sys, 0) / slice.length);
      finalDia = Math.round(slice.reduce((s, x) => s + x.dia, 0) / slice.length);
      finalPulse = Math.round(slice.reduce((s, x) => s + x.pulse, 0) / slice.length);
    }

    finalValues = { sys: finalSys, dia: finalDia, pulse: finalPulse };

    sysVal.textContent = finalSys;
    diaVal.textContent = finalDia;
    pulseVal.textContent = finalPulse;

    root.querySelector('#sysBox').className = 'readout-box stable';
    root.querySelector('#diaBox').className = 'readout-box stable';
    root.querySelector('#pulseBox').className = 'readout-box stable';
    timerText.textContent = t('bp.stabilizing');
    
    face.setExpression('happy');
    ctx.setFace('happy');
    continueBtn.hidden = false;
  }

  continueBtn.addEventListener('click', () => {
    if (finalValues) {
      ctx.saveReading('bp', finalValues);
    }
    ctx.navigate('oxygen');
  });
}