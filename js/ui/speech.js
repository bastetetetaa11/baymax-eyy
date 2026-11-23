/**
 * speech.js
 * ------------------------------------------------------------------
 * Thin wrapper around the browser's speechSynthesis.
 * Keeps a global mute flag so every screen shares it.
 * ------------------------------------------------------------------
 */

let muted = true;
let cachedVoice = null;
let voicesReady = false;

function pickVoice(lang) {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;

  const want = lang === 'fil' ? 'fil' : 'en';
  // Prefer a Filipino voice for Filipino, an English one otherwise.
  let found = voices.find(
    (v) => v.lang && v.lang.toLowerCase().startsWith(want)
  );
  if (!found && want === 'fil') {
    // Fall back to any English voice for Filipino text (better than nothing).
    found = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  }
  return found || voices[0] || null;
}

if ('speechSynthesis' in window) {
  // Voices load asynchronously in Chrome.
  const onVoices = () => {
    voicesReady = true;
    cachedVoice = pickVoice('en');
  };
  window.speechSynthesis.onvoiceschanged = onVoices;
  setTimeout(onVoices, 300);
}

export function setMuted(value) {
  muted = !!value;
  if (muted) stopSpeech();
}

export function isMuted() {
  return muted;
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

/**
 * Speak text, cancelling anything already speaking.
 * @param {string} text
 * @param {string} lang 'en' | 'fil'
 */
export function speak(text, lang = 'en') {
  if (muted || !text) return;
  if (!('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = 0.9;
    u.volume = 1;
    u.lang = lang === 'fil' ? 'fil-PH' : 'en-US';
    const v = pickVoice(lang) || cachedVoice || (voicesReady ? null : null);
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch (e) {
    /* Speech is a nice-to-have; never let it break the app. */
  }
}

/**
 * Queue text without cancelling what is already speaking.
 * Used by the results screen to read chunk by chunk.
 */
export function speakQueue(text, lang = 'en') {
  if (muted || !text) return;
  if (!('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = 0.9;
    u.volume = 1;
    u.lang = lang === 'fil' ? 'fil-PH' : 'en-US';
    const v = pickVoice(lang);
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch (e) {
    /* ignore */
  }
}

export function stopSpeech() {
  try {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  } catch (e) {
    /* ignore */
  }
}