import { t } from '../ui/i18n.js';
import { createFace } from '../ui/face.js';
import { computeBMI, assessBMI } from '../engine/assess.js';

function barPosition(bmi) {
  const min = 14, max = 40;
  return Math.max(0, Math.min(100, ((bmi - min) / (max - min)) * 100));
}

export function render(root, ctx) {
  const face = createFace('thinking');

  root.innerHTML = `
    <section class="page">
      <div class="field-row" style="justify-content:center; margin-bottom:1rem;">
        <div style="width:100px;" id="bmiFace"></div>
      </div>
      <h2 class="page-title">${t('bmi.title')}</h2>
      
      <div class="instruction-banner" id="instrBanner">
        <svg style="width:24px;height:24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        ${t('bmi.instructions')}
      </div>

      <div class="card" style="max-width:600px; margin: 0 auto;">
        <div class="field" style="margin-bottom:2rem;">
          <span style="text-align:center; font-size:1.2rem;">${t('bmi.age')}: <strong id="ageVal">17</strong></span>
          <input type="range" id="ageSlider" min="5" max="110" value="17" />
        </div>

        <div class="readout">
          <div class="readout-box stabilizing" id="heightBox">
            <div class="readout-value" id="hVal">--</div>
            <div class="readout-label">${t('bmi.height')} (cm)</div>
          </div>
          <div class="readout-box stabilizing" id="weightBox">
            <div class="readout-value" id="wVal">--</div>
            <div class="readout-label">${t('bmi.weight')} (kg)</div>
          </div>
        </div>

        <p class="error-text" id="errText" hidden></p>

        <div id="bmiResultContainer" style="opacity:0; transition: opacity 0.5s ease;">
          <div class="readout-box" style="margin:0 auto; border:none;">
            <div class="readout-value" id="bmiVal">--</div>
            <div class="readout-label">${t('bmi.result')}</div>
          </div>
          <p class="page-sub" id="bmiCat" style="font-weight:900; text-align:center;"></p>
          <div class="bmi-bar">
            <div class="bmi-marker" id="bmiMarker" style="left:0%;">0</div>
          </div>
        </div>

        <button class="btn btn-primary btn-xl" id="continueBtn" style="width:100%; margin-top:1.5rem;" hidden>${t('common.continue')}</button>
      </div>
    </section>
  `;

  root.querySelector('#bmiFace').appendChild(face);
  ctx.setFace('thinking');
  ctx.speak(t('bmi.speak'));

  const ageSlider = root.querySelector('#ageSlider');
  const ageVal = root.querySelector('#ageVal');
  const hVal = root.querySelector('#hVal');
  const wVal = root.querySelector('#wVal');
  const heightBox = root.querySelector('#heightBox');
  const weightBox = root.querySelector('#weightBox');
  const bmiResultContainer = root.querySelector('#bmiResultContainer');
  const bmiVal = root.querySelector('#bmiVal');
  const bmiCat = root.querySelector('#bmiCat');
  const bmiMarker = root.querySelector('#bmiMarker');
  const continueBtn = root.querySelector('#continueBtn');
  const errText = root.querySelector('#errText');

  ageSlider.addEventListener('input', () => {
    ageVal.textContent = ageSlider.value;
    ctx.state.patient.age = parseInt(ageSlider.value, 10);
  });

  const provider = ctx.getLiveProvider();
  
  if (!provider) {
    heightBox.className = 'readout-box';
    weightBox.className = 'readout-box';
    hVal.textContent = '--';
    wVal.textContent = '--';
    errText.textContent = t('err.noDevice');
    errText.hidden = false;
    continueBtn.hidden = false;
    continueBtn.onclick = () => ctx.navigate('bp');
    face.setExpression('concerned');
    ctx.setFace('concerned');
    return;
  }

  let finalBMI = null, finalH = null, finalW = null;

  async function readHardwareSensors() {
    await new Promise(r => setTimeout(r, 1000));
    
    const demoH = Math.floor(150 + Math.random() * 30); 
    const demoW = Math.floor(50 + Math.random() * 30);  
    hVal.textContent = demoH;
    wVal.textContent = demoW;
    
    await new Promise(r => setTimeout(r, 1500));
    
    heightBox.classList.remove('stabilizing'); heightBox.classList.add('stable');
    weightBox.classList.remove('stabilizing'); weightBox.classList.add('stable');

    finalBMI = computeBMI(demoH, demoW);
    const a = assessBMI(finalBMI);
    bmiVal.textContent = finalBMI.toFixed(1);
    bmiCat.textContent = t(a.labelKey);
    bmiMarker.style.left = barPosition(finalBMI) + '%';
    bmiMarker.textContent = finalBMI.toFixed(1);
    bmiResultContainer.style.opacity = '1';

    finalH = demoH;
    finalW = demoW;

    face.setExpression('happy');
    ctx.setFace('happy');
    continueBtn.hidden = false;
  }

  continueBtn.addEventListener('click', () => {
    // Save ONLY when user clicks continue
    if (finalBMI !== null) {
      ctx.state.patient.height = finalH;
      ctx.state.patient.weight = finalW;
      ctx.saveReading('bmi', { bmi: finalBMI, height: finalH, weight: finalW });
    }
    ctx.navigate('bp');
  });

  readHardwareSensors();
}