import { useSettingsStore } from '@/store/settingsStore';

/**
 * Game sound effects and haptics. All sounds are synthesized with the Web
 * Audio API (no assets, fully offline); every channel is gated by its
 * settings toggle. Failures are swallowed — feedback must never break play.
 */

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return null;
  }
}

interface Tone {
  frequency: number;
  /** Seconds after now when the tone starts. */
  at: number;
  duration: number;
  type: OscillatorType;
  gain: number;
  /** Optional frequency to glide to over the tone's duration. */
  glideTo?: number;
}

function play(tones: Tone[]): void {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const tone of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.frequency, now + tone.at);
    if (tone.glideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        tone.glideTo,
        now + tone.at + tone.duration,
      );
    }
    gain.gain.setValueAtTime(tone.gain, now + tone.at);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.at + tone.duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + tone.at);
    osc.stop(now + tone.at + tone.duration);
  }
}

function vibrate(pattern: number | number[]): void {
  try {
    if (useSettingsStore.getState().vibration && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* haptics are best-effort */
  }
}

export const feedback = {
  /** Warm up the audio context from a user gesture (game start). */
  init(): void {
    getContext();
  },

  /** Soft clock tick, once per second while the countdown runs. */
  tick(): void {
    if (!useSettingsStore.getState().tickSound) return;
    play([{ frequency: 1000, at: 0, duration: 0.03, type: 'square', gain: 0.02 }]);
  },

  /** Cheerful two-note chime for a correct answer. */
  correct(): void {
    if (!useSettingsStore.getState().soundEffects) return;
    play([
      { frequency: 660, at: 0, duration: 0.12, type: 'sine', gain: 0.12 },
      { frequency: 880, at: 0.1, duration: 0.18, type: 'sine', gain: 0.12 },
    ]);
  },

  /** Descending whoosh-buzz for a skip, with a short vibration. */
  skip(): void {
    if (useSettingsStore.getState().soundEffects) {
      play([
        { frequency: 320, at: 0, duration: 0.28, type: 'sawtooth', gain: 0.1, glideTo: 90 },
        { frequency: 140, at: 0.02, duration: 0.22, type: 'square', gain: 0.05, glideTo: 70 },
      ]);
    }
    vibrate(120);
  },

  /** Long alarm + long vibration when the countdown reaches zero. */
  timerEnd(): void {
    if (useSettingsStore.getState().endAlert) {
      play([
        { frequency: 440, at: 0, duration: 0.25, type: 'triangle', gain: 0.16 },
        { frequency: 330, at: 0.3, duration: 0.25, type: 'triangle', gain: 0.16 },
        { frequency: 220, at: 0.6, duration: 0.7, type: 'triangle', gain: 0.18, glideTo: 160 },
      ]);
      vibrate([400, 120, 400]);
    }
  },
};
