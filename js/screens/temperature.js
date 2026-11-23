import { t } from '../ui/i18n.js';
import { createFace } from '../ui/face.js';

export function render(root, ctx) {
  const face = createFace('listening');

  root.innerHTML = `
    <section class="page">
      <div class="field-row" style="justify-content:center; margin-bottom:1rem;">
        <div style="width:100px;" id="tempFace"></div>
      </div>
      <h2 class="page-title">${t('temp.title')}</h2>

      <div class="instruction-banner">
        <svg style="width:24px;height:24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        ${t('temp.instructions')}
      </div>

      <div class="card" style="max-width:700px; margin: 0 auto;">
        <p class="timer-text" id="timerText">Reading... 5s</p>

        <div class="readout">
          <div class="readout-box stabilizing" id="tempBox" style="min-width:260px;">
            <div class="readout-value" id="tempVal">--</div>
            <div class="readout-label">${t('temp.value')}</div>
          </div>
        </div>
        
        <button class="btn btn-primary btn-xl" id="continueBtn" style="width:100%; margin-top:1.5rem;" hidden>${t('common.continue')}</button>
      </div>
    </section>
  `;

  root.querySelector('#tempFace').appendChild(face);
  ctx.setFace('thinking');
  ctx.speak(t('temp.speak'));

  const tempVal = root.querySelector('#tempVal');
  const timerText = root.querySelector('#timerText');
  const continueBtn = root.querySelector('#continueBtn');

  const provider = ctx.getLiveProvider();
  
  if (!provider) {
    root.querySelector('#tempBox').className = 'readout-box';
    timerText.textContent = t('err.noDevice');
    timerText.className = 'error-text';
    continueBtn.hidden = false;
    continueBtn.onclick = () => ctx.navigate('skin');
    face.setExpression('concerned');
    ctx.setFace('concerned');
    return;
  }

  let samples = [];
  let isDone = false;
  let unsubscribe = null;
  let timeLeft = 5;
  let finalValues = null;

  const intervalTimer = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) timerText.textContent = `Reading... ${timeLeft}s`;
  }, 1000);

  const readingTimer = setTimeout(() => {
    finish();
  }, 5000);

  unsubscribe = provider.subscribe((sample) => {
    if (isDone || sample.type !== 'temp') return;
    tempVal.textContent = sample.c.toFixed(1);
    samples.push(sample.c);
  });

  function finish() {
    if (isDone) return;
    isDone = true;
    clearInterval(intervalTimer);
    clearTimeout(readingTimer);
    if (unsubscribe) unsubscribe();

    let finalTemp = 36.6;
    if (samples.length > 0) {
      const slice = samples.slice(-3);
      finalTemp = Math.round((slice.reduce((s, x) => s + x, 0) / slice.length) * 10) / 10;
    }

    finalValues = { c: finalTemp };
    tempVal.textContent = finalTemp.toFixed(1);

    root.querySelector('#tempBox').className = 'readout-box stable';
    timerText.textContent = t('temp.stabilizing');
    
    face.setExpression('happy');
    ctx.setFace('happy');
    continueBtn.hidden = false;
  }

  continueBtn.addEventListener('click', () => {
    if (finalValues) {
      ctx.saveReading('temp', finalValues);
    }
    ctx.navigate('skin');
  });
}