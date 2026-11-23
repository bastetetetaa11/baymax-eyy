/**
 * serial.js
 * ------------------------------------------------------------------
 * Reads newline-delimited JSON from an ESP32 over Web Serial.
 *
 * Wire format (one JSON object per line, 115200 baud):
 *   {"type":"spo2","spo2":97,"pulse":78}
 *   {"type":"temp","c":36.8}
 *   {"type":"bp","sys":120,"dia":80,"pulse":72}
 *
 * Malformed lines are ignored. Values are plausibility-filtered.
 * ------------------------------------------------------------------
 */

import { filterSample } from './validate.js';

export function createSerialProvider() {
  const listeners = new Set();
  const statusListeners = new Set();

  let port = null;
  let reader = null;
  let running = false;
  let buffer = '';
  let connected = false;

  function emit(sample) {
    listeners.forEach((fn) => {
      try {
        fn(sample);
      } catch (e) {
        /* ignore */
      }
    });
  }

  function setStatus(status, message) {
    connected = status === 'connected';
    statusListeners.forEach((fn) => {
      try {
        fn(status, message || '');
      } catch (e) {
        /* ignore */
      }
    });
  }

  function handleLine(line) {
    if (!line) return;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch (e) {
      return; // malformed line — ignore
    }
    if (!obj || typeof obj !== 'object' || !obj.type) return;

    const clean = filterSample(obj);
    if (clean) emit(clean);
  }

  async function readLoop() {
    const decoder = new TextDecoder();
    try {
      while (running && port && port.readable) {
        reader = port.readable.getReader();
        try {
          while (running) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += decoder.decode(value, { stream: true });
              let idx;
              while ((idx = buffer.indexOf('\n')) >= 0) {
                const line = buffer.slice(0, idx).trim();
                buffer = buffer.slice(idx + 1);
                handleLine(line);
              }
              // Guard against runaway garbage without newlines.
              if (buffer.length > 4096) buffer = '';
            }
          }
        } finally {
          try {
            reader.releaseLock();
          } catch (e) {
            /* ignore */
          }
          reader = null;
        }
      }
    } catch (err) {
      setStatus('error', err && err.message ? err.message : 'read error');
    } finally {
      running = false;
    }
  }

  async function connect() {
    if (!('serial' in navigator)) {
      setStatus('error', 'unsupported');
      throw new Error('unsupported');
    }
    if (connected) return;

    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    setStatus('connected');
    running = true;
    readLoop();
  }

  async function disconnect() {
    running = false;
    try {
      if (reader) await reader.cancel();
    } catch (e) {
      /* ignore */
    }
    try {
      if (port) await port.close();
    } catch (e) {
      /* ignore */
    }
    port = null;
    setStatus('disconnected');
  }

  // Auto-detect unplugging.
  if ('serial' in navigator) {
    navigator.serial.addEventListener('disconnect', () => {
      if (connected) {
        running = false;
        port = null;
        setStatus('disconnected');
      }
    });
  }

  return {
    name: 'serial',
    isConnected() {
      return connected;
    },
    connect,
    disconnect,
    onStatus(fn) {
      statusListeners.add(fn);
      return () => statusListeners.delete(fn);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
  };
}