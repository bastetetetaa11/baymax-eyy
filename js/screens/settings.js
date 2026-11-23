/**
 * settings.js
 * ------------------------------------------------------------------
 * Hidden settings panel. Open it by tapping the logo 5 times.
 *
 * Contains: demo mode, serial connect, voice, font size,
 * read-only thresholds viewer, and camera demo simulation.
 * ------------------------------------------------------------------
 */

import { t, setLang, getLang } from '../ui/i18n.js';
import { isMuted, setMuted } from '../ui/speech.js';
import { THRESHOLDS } from '../engine/thresholds.js';

export function openSettings(ctx) {
  // Avoid stacking multiple overlays.
  const old = document.getElementById('settingsOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'settingsOverlay';

  const serialStatus = ctx.serialProvider.isConnected()
    ? t('settings.connected')
    : t('settings.disconnected');

  const serialSupported = 'serial' in navigator;

  overlay.innerHTML = `
    <div class="overlay-panel" role="dialog" aria-modal="true" aria-label="${t('settings.title')}">
      <h2 class="page-title">${t('settings.title')}</h2>

      <div class="setting-row">
        <span>${t('settings.demo')}</span>
        <button class="btn btn-secondary" id="setDemo"
                aria-pressed="${ctx.settings.demoMode}">
          ${ctx.settings.demoMode ? t('common.yes') : t('common.no')}
        </button>
      </div>

      <div class="setting-row">
        <span>${t('settings.voice')}</span>
        <button class="btn btn-secondary" id="setVoice"
                aria-pressed="${!isMuted()}">
          ${isMuted() ? '🔇' : '🔊'}
        </button>
      </div>

      <div class="setting-row">
        <span>${t('settings.language')}</span>
        <button class="btn btn-secondary" id="setLang">
          ${getLang() === 'en' ? 'EN' : 'FIL'}
        </button>
      </div>

      <div class="setting-row">
        <span>${t('settings.font')}</span>
        <div class="btn-row" style="margin:0;">
          <button class="btn btn-secondary" data-font="1">A</button>
          <button class="btn btn-secondary" data-font="1.1">A+</button>
          <button class="btn btn-secondary" data-font="1.2">A++</button>
        </div>
      </div>

      <div class="setting-row">
        <span>${t('settings.serial')} — <strong id="serialStatus">${serialStatus}</strong></span>
        <div class="btn-row" style="margin:0;">
          ${serialSupported
            ? `<button class="btn btn-secondary" id="connectBtn">${t('settings.connect')}</button>
               <button class="btn btn-ghost" id="disconnectBtn">${t('settings.disconnect')}</button>`
            : `<span class="hint">${t('settings.unsupported')}</span>`}
        </div>
      </div>

      <div class="setting-row">
        <span>${t('settings.modelDemo')}</span>
        <button class="btn btn-secondary" id="setModelDemo"
                aria-pressed="${ctx.settings.modelDemo}">
          ${ctx.settings.modelDemo ? t('common.yes') : t('common.no')}
        </button>
      </div>

      <details style="margin-top:1rem;">
        <summary style="cursor:pointer;font-weight:900;padding:0.5rem 0;">
          ${t('settings.thresholds')}
        </summary>
        <pre class="thresholds">${escapeHtml(JSON.stringify(THRESHOLDS, null, 2))}</pre>
      </details>

      <div class="btn-row" style="margin-top:1.2rem;">
        <button class="btn btn-danger" id="wipeBtn">${t('settings.reset')}</button>
        <button class="btn btn-primary" id="closeBtn">${t('common.close')}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  overlay.querySelector('#closeBtn').addEventListener('click', close);

  overlay.querySelector('#setDemo').addEventListener('click', (e) => {
    ctx.settings.demoMode = !ctx.settings.demoMode;
    e.currentTarget.setAttribute('aria-pressed', String(ctx.settings.demoMode));
    e.currentTarget.textContent = ctx.settings.demoMode ? t('common.yes') : t('common.no');
  });

  overlay.querySelector('#setVoice').addEventListener('click', (e) => {
    setMuted(!isMuted());
    e.currentTarget.textContent = isMuted() ? '🔇' : '🔊';
    e.currentTarget.setAttribute('aria-pressed', String(!isMuted()));
  });

  overlay.querySelector('#setLang').addEventListener('click', (e) => {
    setLang(getLang() === 'en' ? 'fil' : 'en');
    e.currentTarget.textContent = getLang() === 'en' ? 'EN' : 'FIL';
    // Re-render the app behind the overlay so text updates.
    ctx.navigate(document.body.dataset.screen || 'home');
  });

  overlay.querySelectorAll('[data-font]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const scale = parseFloat(btn.dataset.font);
      ctx.settings.fontScale = scale;
      document.documentElement.style.setProperty(
        '--base-font',
        Math.round(22 * scale) + 'px'
      );
    });
  });

  const connectBtn = overlay.querySelector('#connectBtn');
  if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
      const statusEl = overlay.querySelector('#serialStatus');
      try {
        await ctx.serialProvider.connect();
        statusEl.textContent = t('settings.connected');
      } catch (err) {
        statusEl.textContent = 'Error: ' + (err && err.message ? err.message : 'unknown');
      }
    });
  }

  const disconnectBtn = overlay.querySelector('#disconnectBtn');
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', async () => {
      const statusEl = overlay.querySelector('#serialStatus');
      await ctx.serialProvider.disconnect();
      statusEl.textContent = t('settings.disconnected');
    });
  }

  overlay.querySelector('#setModelDemo').addEventListener('click', (e) => {
    ctx.settings.modelDemo = !ctx.settings.modelDemo;
    e.currentTarget.setAttribute('aria-pressed', String(ctx.settings.modelDemo));
    e.currentTarget.textContent = ctx.settings.modelDemo ? t('common.yes') : t('common.no');
  });

  overlay.querySelector('#wipeBtn').addEventListener('click', () => {
    close();
    ctx.resetAll();
    ctx.navigate('home');
  });

  // Focus the close button for keyboard users.
  try {
    overlay.querySelector('#closeBtn').focus();
  } catch (e) {
    /* ignore */
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}