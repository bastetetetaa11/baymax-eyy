/**
 * mock.js
 * ------------------------------------------------------------------
 * "Demo mode" provider. Generates realistic fake readings with a
 * little noise so the whole app can be tested with no hardware.
 *
 * Toggle it in Settings (tap the logo 5 times).
 * ------------------------------------------------------------------
 */

import { filterSample } from './validate.js';

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function jitter(amount) {
  return (Math.random() * 2 - 1) * amount;
}

export function createMockProvider() {
  const listeners = new Set();
  let timer = null;
  let subscribers = 0;

  // The "true" values drift slowly (random walk).
  const v = { spo2: 97, pulse: 76, temp: 36.7, sys: 118, dia: 76 };

  function emit(sample) {
    const clean = filterSample(sample);
    if (!clean) return;
    listeners.forEach((fn) => {
      try {
        fn(clean);
      } catch (e) {
        /* a broken listener should not stop the stream */
      }
    });
  }

  function tick() {
    v.spo2 = clamp(v.spo2 + jitter(0.7), 94, 100);
    v.pulse = clamp(v.pulse + jitter(2.5), 62, 96);
    v.temp = clamp(v.temp + jitter(0.07), 36.2, 37.1);
    v.sys = clamp(v.sys + jitter(2), 108, 128);
    v.dia = clamp(v.dia + jitter(1.5), 68, 84);

    const pulse = Math.round(v.pulse);

    emit({ type: 'spo2', spo2: Math.round(v.spo2), pulse });
    emit({ type: 'temp', c: Math.round(v.temp * 10) / 10 });

    // Blood pressure only shows up now and then.
    if (Math.random() < 0.35) {
      emit({
        type: 'bp',
        sys: Math.round(v.sys),
        dia: Math.round(v.dia),
        pulse
      });
    }
  }

  return {
    name: 'mock',
    isConnected() {
      return true;
    },
    subscribe(fn) {
      listeners.add(fn);
      subscribers++;
      if (subscribers === 1) this.start();
      return () => {
        listeners.delete(fn);
        subscribers--;
        if (subscribers === 0) this.stop();
      };
    },
    start() {
      if (timer) return;
      timer = setInterval(tick, 700);
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
  };
}