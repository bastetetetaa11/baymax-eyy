/**
 * skin.js
 * ------------------------------------------------------------------
 * Camera capture + Teachable Machine image classifier.
 * Includes a "Skip" button for the slideshow flow.
 * ------------------------------------------------------------------
 */

import { CONFIG } from '../config.js';
import { t } from '../ui/i18n.js';
import { createFace } from '../ui/face.js';

const CDN_TF = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js';
const CDN_TM = 'https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8/dist/teachablemachine-image.min.js';
const CONFIDENCE_FLOOR = 0.7;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('failed to load ' + src));
    document.head.appendChild(s);
  });
}

let cachedModel = null;
let modelLoadFailed = false;

async function loadModel() {
  if (cachedModel) return cachedModel;
  if (modelLoadFailed) return null;

  try {
    if (!window.tf) await loadScript(CDN_TF);
    if (!window.tmImage) await loadScript(CDN_TM);
    if (!window.tmImage) throw new Error('tmImage missing');

    cachedModel = await window.tmImage.load(CONFIG.MODEL_URL, CONFIG.METADATA_URL);
    return cachedModel;
  } catch (e) {
    modelLoadFailed = true;
    return null;
  }
}

function demoPredictions() {
  const labels = CONFIG.DEMO_MODEL_LABELS;
  const raw = labels.map(() => Math.random());
  const sum = raw.reduce((a, b) => a + b, 0);
  return labels.map((label, i) => ({ className: label, probability: raw[i] / sum })).sort((a, b) => b.probability - a.probability);
}

export function render(root, ctx) {
  const existing = ctx.state.readings.skin;
  const face = createFace('listening');

  root.innerHTML = `
    <section class="page">
      <div class="field-row" style="justify-content:center; margin-bottom:1rem;">
        <div style="width:100px;" id="skinFace"></div>
      </div>
      <h2 class="page-title">${t('skin.title')}</h2>
      <p class="page-sub">${t('skin.instructions')}</p>

      <div class="card" style="max-width:600px; margin:0 auto;">
        <div class="camera-wrap" id="cameraWrap">
          <video id="video" playsinline autoplay muted></video>
          <div class="camera-guide" id="guide"></div>
        </div>

        <p class="hint" id="skinHint"></p>
        <p class="error-text" id="skinErr" hidden></p>

        <div class="btn-row" style="justify-content:center;">
          <button class="btn btn-primary" id="startBtn">${t('skin.start')}</button>
          <button class="btn btn-primary" id="captureBtn" hidden>${t('skin.capture')}</button>
          <button class="btn btn-secondary" id="retakeBtn" hidden>${t('skin.retake')}</button>
          <button class="btn btn-ghost" id="skipBtn">${t('common.skip')}</button>
        </div>

        <div id="results" style="margin-top:1rem;"></div>
      </div>
    </section>
  `;

  root.querySelector('#skinFace').appendChild(face);
  ctx.setFace('listening');
  ctx.speak(t('skin.speak'));

  const wrap = root.querySelector('#cameraWrap');
  const video = root.querySelector('#video');
  const guide = root.querySelector('#guide');
  const hint = root.querySelector('#skinHint');
  const errEl = root.querySelector('#skinErr');
  const startBtn = root.querySelector('#startBtn');
  const captureBtn = root.querySelector('#captureBtn');
  const retakeBtn = root.querySelector('#retakeBtn');
  const resultsEl = root.querySelector('#results');

  let stream = null;
  let capturedCanvas = null;

  async function startCamera() {
    errEl.hidden = true;
    hint.textContent = '';
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      video.srcObject = stream;
      video.hidden = false;
      guide.hidden = false;
      startBtn.hidden = true;
      captureBtn.hidden = false;
      retakeBtn.hidden = true;
      resultsEl.innerHTML = '';
      face.setExpression('listening');
    } catch (e) {
      errEl.textContent = t('skin.cameraError');
      errEl.hidden = false;
      face.setExpression('concerned');
    }
  }

  function stopCamera() {
    if (stream) { stream.getTracks().forEach((tr) => tr.stop()); stream = null; }
    video.srcObject = null;
  }

  function capture() {
    if (!video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = 224; canvas.height = 224;
    const g = canvas.getContext('2d');
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    g.drawImage(video, sx, sy, size, size, 0, 0, 224, 224);

    capturedCanvas = canvas;
    stopCamera();

    video.hidden = true;
    guide.hidden = true;
    const img = document.createElement('img');
    img.alt = 'Captured photo (not saved)';
    img.src = canvas.toDataURL('image/png');
    wrap.appendChild(img);

    captureBtn.hidden = true;
    retakeBtn.hidden = false;
    analyse(canvas);
  }

  async function analyse(canvas) {
    resultsEl.innerHTML = '<p class="hint">' + t('skin.analyzing') + '</p>';
    face.setExpression('thinking');
    ctx.setFace('thinking');

    let predictions = null;
    let demo = false;
    const useDemo = ctx.settings.modelDemo || ctx.settings.demoMode || modelLoadFailed;

    if (!useDemo) {
      const model = await loadModel();
      if (model) {
        try { predictions = await model.predict(canvas); } catch (e) { predictions = null; }
      }
    }

    if (!predictions) {
      demo = true;
      predictions = demoPredictions();
      hint.textContent = t('skin.modelMissing');
    }

    showPredictions(predictions, demo);
    capturedCanvas = null;
    try { canvas.width = 1; canvas.height = 1; } catch (e) {}
  }

  function showPredictions(predictions, demo) {
    const sorted = predictions.slice().sort((a, b) => b.probability - a.probability).slice(0, 3);
    const top = sorted[0];
    const confident = top && top.probability >= CONFIDENCE_FLOOR;

    const rows = sorted.map((p) => `
          <li class="pred-item">
            <span>${escapeHtml(p.className)}</span>
            <span class="pred-bar"><span style="width:${Math.round(p.probability * 100)}%"></span></span>
            <span>${Math.round(p.probability * 100)}%</span>
          </li>`).join('');

    resultsEl.innerHTML = `
      <h3 style="font-size:1rem;font-weight:900;margin:0 0 0.4rem;">
        ${t('skin.results')} ${demo ? `<span class="chip chip--none">${t('skin.demo')}</span>` : ''}
      </h3>
      <p class="hint" style="margin-top:0;">
        ${confident ? t('skin.looksLike') + ' <strong>' + escapeHtml(top.className) + '</strong>' : t('skin.notSure')}
      </p>
      <ul class="pred-list">${rows}</ul>
      <p class="hint">${t('skin.discard')}</p>
      <button class="btn btn-primary" id="saveSkinBtn" style="width:100%;">${t('common.continue')}</button>
    `;

    face.setExpression(confident ? 'thinking' : 'concerned');
    ctx.setFace(confident ? 'thinking' : 'concerned');

    resultsEl.querySelector('#saveSkinBtn').addEventListener('click', () => {
      ctx.saveReading('skin', {
        topLabel: confident ? top.className : '',
        confident, demo,
        predictions: sorted.map((p) => ({ label: p.className, prob: Math.round(p.probability * 100) / 100 }))
      });
      ctx.navigate('results');
    });
  }

  startBtn.addEventListener('click', startCamera);
  captureBtn.addEventListener('click', capture);

  retakeBtn.addEventListener('click', () => {
    const img = wrap.querySelector('img');
    if (img) img.remove();
    resultsEl.innerHTML = '';
    capturedCanvas = null;
    retakeBtn.hidden = true;
    startCamera();
  });

  root.querySelector('#skipBtn').addEventListener('click', () => {
    stopCamera();
    ctx.navigate('results');
  });

  const observer = new MutationObserver(() => {
    if (!document.body.contains(root)) { stopCamera(); observer.disconnect(); }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  if (existing) {
    resultsEl.innerHTML = '<p class="hint">' + t('menu.doneWith') + ': ' + escapeHtml(existing.topLabel || '—') + '</p>';
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}