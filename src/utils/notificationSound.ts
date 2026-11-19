/**
 * Notification Sound & Haptic Feedback Utility
 * Uses Web Audio API to synthesize a clean, audible notification chime.
 * Works 100% offline, cross-platform on Android, iOS, and PC with zero external audio assets.
 */

let sharedAudioCtx: AudioContext | null = null;
let pendingChime = false;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioCtx = new AudioCtxClass();
      }
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function playChime(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime;

    // Note 1: E5 (659.25 Hz) - bright pleasant intro
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.45, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Note 2: A5 (880 Hz) - resonant alert chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.5, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.48);
  } catch (e) {
    console.warn('[NotificationSound] Chime synthesis error:', e);
  }
}

// Automatically unlock audio context on user interaction (touch, tap, click)
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            if (pendingChime) {
              pendingChime = false;
              playChime(ctx);
            }
          }).catch(() => {});
        } else if (pendingChime) {
          pendingChime = false;
          playChime(ctx);
        }
      }
    } catch {
      // ignore
    }
  };

  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio, { passive: true });
}

/**
 * Play a clear, audible dual-tone alert chime (E5 -> A5)
 * and trigger gentle haptic vibration on mobile devices.
 */
export function playNotificationSound(): void {
  // 1. Haptic vibration for mobile devices (Pulse-pause-pulse)
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([150, 80, 180]);
    }
  } catch {
    // ignore
  }

  // 2. Synthesize dual-tone chime via Web Audio API
  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      pendingChime = true;
      audioCtx.resume().then(() => {
        if (pendingChime) {
          pendingChime = false;
          playChime(audioCtx);
        }
      }).catch(() => {});
    } else {
      pendingChime = false;
      playChime(audioCtx);
    }
  } catch (e) {
    console.warn('[NotificationSound] Audio playback error:', e);
  }
}

/**
 * Play a deep warning / deletion tone (low bass thump)
 * with mobile haptic feedback.
 */
export function playDeepDeleteSound(): void {
  // 1. Heavy haptic vibration on mobile
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([180, 80, 220]);
    }
  } catch {
    // ignore
  }

  // 2. Synthesize deep bass sound via Web Audio API
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const executeDeepTone = (audioContext: AudioContext) => {
      try {
        const now = audioContext.currentTime;

        // Low frequency oscillator (140Hz downward sweep to 55Hz)
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = 'triangle'; // warmer, deeper bass timbre than pure sine
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.35);

        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      } catch (err) {
        console.warn('[NotificationSound] Deep tone synthesis error:', err);
      }
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => executeDeepTone(ctx)).catch(() => {});
    } else {
      executeDeepTone(ctx);
    }
  } catch (e) {
    console.warn('[NotificationSound] Deep delete sound error:', e);
  }
}

/**
 * Play a distinctive error buzz / alert beep (dual low buzzy tones 220Hz / 180Hz)
 * with warning haptic vibration on mobile devices.
 */
export function playErrorBeepSound(): void {
  // 1. Dual haptic pulse for mobile devices
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([120, 60, 160]);
    }
  } catch {
    // ignore
  }

  // 2. Synthesize double error buzz via Web Audio API
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const executeErrorBuzz = (audioContext: AudioContext) => {
      try {
        const now = audioContext.currentTime;

        // Tone 1: 220 Hz sawtooth buzz (0.14s)
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(220, now);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.start(now);
        osc1.stop(now + 0.14);

        // Tone 2: 175 Hz slightly lower buzz (0.2s)
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(175, now + 0.16);
        gain2.gain.setValueAtTime(0.4, now + 0.16);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.start(now + 0.16);
        osc2.stop(now + 0.38);
      } catch (err) {
        console.warn('[NotificationSound] Error buzz synthesis error:', err);
      }
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => executeErrorBuzz(ctx)).catch(() => {});
    } else {
      executeErrorBuzz(ctx);
    }
  } catch (e) {
    console.warn('[NotificationSound] Error buzz sound error:', e);
  }
}

