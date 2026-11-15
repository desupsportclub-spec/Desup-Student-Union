/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let ctx: AudioContext | null = null;
let pending: (() => void) | null = null;

const getCtx = () =>
  (ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());

function tone(freq: number, start: number, dur: number, vol: number) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, c.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.05);
}

function chime(urgent = false) {
  tone(880, 0, 0.9, 0.25);
  tone(1318.5, 0.18, 1.1, 0.2);
  if (urgent) {
    tone(880, 1.0, 0.9, 0.25);
    tone(1318.5, 1.18, 1.1, 0.2);
  }
}

export async function playAlert(opts?: { urgent?: boolean }) {
  if (localStorage.getItem('admin.sound') === 'off') return;
  const c = getCtx();
  if (c.state === 'suspended') {
    try {
      await c.resume();
    } catch {
      // Ignore autoplay restriction until user gesture
    }
  }
  if (c.state === 'running') chime(opts?.urgent);
  else pending = () => chime(opts?.urgent); // เบราว์เซอร์ยังห้ามเล่นเสียง ให้เก็บไว้เล่นตอนผู้ใช้แตะครั้งแรก
}

export function installAudioUnlock() {
  const unlock = async () => {
    const c = getCtx();
    if (c.state === 'suspended') {
      try {
        await c.resume();
      } catch {
        // Ignore resume failure
      }
    }
    if (c.state === 'running') {
      ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.removeEventListener(e, unlock));
      if (pending) {
        const p = pending;
        pending = null;
        p();
      }
    }
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, unlock, { passive: true }));
}
