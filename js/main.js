/**
 * main.js
 * ------------------------------------------------------------------
 * The router and global state.
 * ------------------------------------------------------------------
 */

import { CONFIG } from './config.js';
import { t, setLang, getLang, otherLang } from './ui/i18n.js';
import { speak, speakQueue, stopSpeech, isMuted, setMuted } from './ui/speech.js';
import { createFace } from './ui/face.js';
import { buildSummary } from './engine/assess.js';
import { createMockProvider } from './sensors/mock.js';
import { createSerialProvider } from './sensors/serial.js';
import { openSettings } from './screens/settings.js';

import * as Home from './screens/home.js';
import * as Consent from './screens/consent.js';
import * as Patient from './screens/patient.js';
import * as BMI from './screens/bmi.js';
import * as BP from './screens/bp.js';
import * as Oxygen from './screens/oxygen.js';
import * as Temperature from './screens/temperature.js';
import * as Skin from './screens/skin.js';
import * as Results from './screens/results.js';
import * as Emergency from './screens/emergency.js';

const SCREENS = {
  home: Home,
  consent: Consent,
  patient: Patient,
  bmi: BMI,
  bp: BP,
  oxygen: Oxygen,
  temperature: Temperature,
  skin: Skin,
  results: Results,
  emergency: Emergency
};

// Track progress for the slideshow bar (1 to 9)
const FLOW = ['home', 'consent', 'patient', 'bmi', 'bp', 'oxygen', 'temperature', 'skin', 'results'];

const settings = { demoMode: false, fontScale: 1, modelDemo: false };

function freshState() {
  return {
    consent: false,
    patient: { name: '', age: 17, sex: '', height: null, weight: null },
    pain: { score: null, symptoms: [] },
    readings: { bp: null, spo2: null, temp: null, bmi: null, skin: null },
    satisfaction: null
  };
}

let state = freshState();
const mockProvider = createMockProvider();
const serialProvider = createSerialProvider();

function getLiveProvider() {
  if (serialProvider.isConnected()) return serialProvider;
  if (settings.demoMode) return mockProvider;
  return null;
}

const app = document.getElementById('app');
const srStatus = document.getElementById('sr-status');
let brandFace = null;
let currentScreen = 'home';
let idleTimer = null;

function buildShell() {
  app.innerHTML = `
    <div class="progress-container no-print"><div class="progress-fill" id="progressBar"></div></div>
    <div class="app">
      <header class="topbar no-print">
        <button class="brand" id="brandBtn" aria-label="${CONFIG.TITLE} logo. Tap five times for settings.">
          <span class="brand-face" id="brandFace"></span>
          <span class="brand-title">${CONFIG.TITLE}</span>
        </button>
        <div class="topbar-controls">
          <button class="btn btn-icon" id="langBtn" aria-label="Change language"></button>
          <button class="btn btn-icon" id="muteBtn" aria-label="Mute or unmute voice"></button>
        </div>
      </header>
      <main id="screen" class="screen" tabindex="-1"></main>
      <footer class="footer">${t('app.disclaimer')}</footer>
    </div>
  `;

  brandFace = createFace('idle');
  document.getElementById('brandFace').appendChild(brandFace);

  const langBtn = document.getElementById('langBtn');
  const muteBtn = document.getElementById('muteBtn');

  langBtn.addEventListener('click', () => {
    setLang(otherLang());
    refreshControls();
    render();
  });

  muteBtn.addEventListener('click', () => {
    setMuted(!isMuted());
    refreshControls();
  });

  let taps = 0;
  let tapTimer = null;
  document.getElementById('brandBtn').addEventListener('click', () => {
    taps++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { taps = 0; }, 2500);
    if (taps >= 5) { taps = 0; openSettings(ctx); }
  });

  refreshControls();
}

function refreshControls() {
  const langBtn = document.getElementById('langBtn');
  const muteBtn = document.getElementById('muteBtn');
  if (langBtn) {
    langBtn.textContent = getLang() === 'en' ? 'EN' : 'FIL';
    langBtn.setAttribute('aria-label', getLang() === 'en' ? 'Switch to Filipino' : 'Switch to English');
  }
  if (muteBtn) {
    muteBtn.textContent = isMuted() ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-pressed', String(isMuted()));
    muteBtn.setAttribute('aria-label', isMuted() ? 'Unmute voice' : 'Mute voice');
  }
  const footer = document.querySelector('.footer');
  if (footer) footer.textContent = t('app.disclaimer');
}

function updateProgress(screenName) {
  const bar = document.getElementById('progressBar');
  if (!bar) return;
  if (screenName === 'emergency') {
    bar.style.width = '100%';
    bar.style.backgroundColor = 'var(--red-dark)';
    return;
  }
  const idx = FLOW.indexOf(screenName);
  if (idx !== -1) {
    bar.style.backgroundColor = 'var(--red)';
    const pct = (idx / (FLOW.length - 1)) * 100;
    bar.style.width = pct + '%';
  }
}

function navigate(name) {
  if (!SCREENS[name]) return;
  stopSpeech();
  
  // Fade out current screen before loading new one
  const currentEl = document.getElementById('screen');
  if (currentEl && currentEl.innerHTML.trim() !== '') {
    currentEl.classList.add('fade-out-slow');
    setTimeout(() => {
      currentScreen = name;
      render();
    }, 400); // Wait for fade before switching
  } else {
    currentScreen = name;
    render();
  }
  resetIdleTimer();
}

function render() {
  const body = document.getElementById('screen');
  if (!body) return;

  body.classList.remove('fade-out-slow');
  body.innerHTML = '';
  document.body.dataset.screen = currentScreen;
  updateProgress(currentScreen);

  const mod = SCREENS[currentScreen];
  try {
    mod.render(body, ctx);
  } catch (err) {
    console.error(err);
    body.innerHTML = '<div class="card"><p class="error-text">Something went wrong on this screen.</p></div>';
  }

  try { body.focus({ preventScroll: true }); } catch (e) {}
}

const ctx = {
  state,
  settings,
  navigate,
  speak: (text) => speak(text, getLang()),
  speakQueue: (text) => speakQueue(text, getLang()),
  t,
  setFace: (expr) => { if (brandFace) brandFace.setExpression(expr); },
  getLiveProvider,
  serialProvider,
  mockProvider,
  buildSummary: () => buildSummary(state),
  saveReading: (kind, value) => { state.readings[kind] = value; },
  resetAll,
  openSettingsMenu: () => openSettings(ctx),
  announce: (text) => { if (srStatus) srStatus.textContent = text; }
};

function resetAll() {
  stopSpeech();
  mockProvider.stop();
  state = freshState();
  ctx.state = state;
  ctx.navigate = navigate;
  ctx.resetAll = resetAll;
}

function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    resetAll();
    navigate('home');
  }, CONFIG.INACTIVITY_MS);
}

['pointerdown', 'keydown', 'touchstart'].forEach((ev) => {
  window.addEventListener(ev, resetIdleTimer, { passive: true });
});

setLang('en');
buildShell();
navigate('home');