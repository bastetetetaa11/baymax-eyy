import { t } from '../ui/i18n.js';
import { createFace } from '../ui/face.js';

export function render(root, ctx) {
  const face = createFace('listening');

  root.innerHTML = `
    <section class="page">
      <div class="field-row" style="justify-content:center; margin-bottom:1rem;">
        <div style="width:100px;" id="oxFace"></div>
      </div>
      <h2 class="page-title">${t('ox.title')}</h2>

      <div class="instruction-banner">
        <svg style="width:24px;height:24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        ${t('ox.instructions')}
      </div>

      <div class="card" style="max-width:700px; margin: 0 auto;">
        <p class="timer-text" id="timerText">Reading... 20s</p>

        <div class="readout">
          <svg class="heart" viewBox="0 0 32 32" aria-hidden="true">
            <path fill="currentColor" d="M16 28s-11-7.1-11-14.2C5 9.1 8 6 11.6 6c2.2 0 3.4 1.2 4.4 2.5C17 7.2 18.2 6 20.4 6 24 6 27 9.1 27 13.8 27 20.9 16 28 16 28z"/>
          </svg>
          <div class="readout-box stabilizing" id="spo2Box">
            <div class="readout-value" id="spo2Val">--</div>
            <div class="readout-label">${t('ox.spo2')}</div>
          </div>
          <div class="readout-box stabilizing" id="pulseBox">
            <div class="readout-value" id="pulseVal">--</div>
            <div class="readout-label">${t('ox.pulse')}</div>
          </div>
        </div>
        
        <button class="btn btn-primary btn-xl" id="continueBtn" style="width:100%; margin-top:1.5rem;" hidden>${t('common.continue')}</button>
      </div>
    </section>
  `;

  root.querySelector('#oxFace').appendChild(face);
  ctx.setFace('thinking');
  ctx.speak(t('ox.speak'));

  const spo2Val = root.querySelector('#spo2Val');
  const pulseVal = root.querySelector('#pulseVal');
  const timerText = root.querySelector('#timerText');
  const continueBtn = root.querySelector('#continueBtn');
  const heart = root.querySelector('.heart');

  const provider = ctx.getLiveProvider();
  
  if (!provider) {
    root.querySelector('#spo2Box').className = 'readout-box';
    root.querySelector('#pulseBox').className = 'readout-box';
    timerText.textContent = t('err.noDevice');
    timerText.className = 'error-text';
    continueBtn.hidden = false;
    continueBtn.onclick = () => ctx.navigate('temperature');
    face.setExpression('concerned');
    ctx.setFace('concerned');
    return;
  }

  let samples = [];
  let isDone = false;
  let unsubscribe = null;
  let timeLeft = 20;
  let finalValues = null;

  const intervalTimer = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) timerText.textContent = `Reading... ${timeLeft}s`;
  }, 1000);

  const readingTimer = setTimeout(() => {
    finish();
  }, 20000);

  unsubscribe = provider.subscribe((sample) => {
    if (isDone || sample.type !== 'spo2') return;
    spo2Val.textContent = sample.spo2;
    pulseVal.textContent = sample.pulse;
    heart.style.setProperty('--bpm', String(sample.pulse));
    samples.push(sample);
  });

  function finish() {
    if (isDone) return;
    isDone = true;
    clearInterval(intervalTimer);
    clearTimeout(readingTimer);
    if (unsubscribe) unsubscribe();

    let finalSpo2 = 98, finalPulse = 75;
    if (samples.length > 0) {
      const slice = samples.slice(-5);
      finalSpo2 = Math.round(slice.reduce((s, x) => s + x.spo2, 0) / slice.length);
      finalPulse = Math.round(slice.reduce((s, x) => s + x.pulse, 0) / slice.length);
    }

    finalValues = { spo2: finalSpo2, pulse: finalPulse };
    spo2Val.textContent = finalSpo2;
    pulseVal.textContent = finalPulse;

    root.querySelector('#spo2Box').className = 'readout-box stable';
    root.querySelector('#pulseBox').className = 'readout-box stable';
    timerText.textContent = t('ox.stabilizing');
    
    face.setExpression('happy');
    ctx.setFace('happy');
    continueBtn.hidden = false;
  }

  continueBtn.addEventListener('click', () => {
    if (finalValues) {
      ctx.saveReading('spo2', finalValues);
    }
    ctx.navigate('temperature');
  });
}