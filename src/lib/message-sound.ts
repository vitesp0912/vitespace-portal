/** Soft two-tone chime for incoming portal messages (Web Audio, no asset file). */
let lastMessageAt = 0;
let lastNotificationAt = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  return new Ctx();
}

export function playMessageSound() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastMessageAt < 700) return;
  lastMessageAt = now;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const master = ctx.createGain();
    master.gain.value = 0.08;
    master.connect(ctx.destination);

    const tones = [
      { freq: 880, start: 0, dur: 0.09 },
      { freq: 1174.7, start: 0.08, dur: 0.12 },
    ];

    for (const t of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = t.freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + t.start);
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + t.start + 0.015);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + t.start + t.dur
      );
      osc.connect(gain);
      gain.connect(master);
      osc.start(ctx.currentTime + t.start);
      osc.stop(ctx.currentTime + t.start + t.dur + 0.02);
    }

    void ctx.resume();
    window.setTimeout(() => void ctx.close(), 500);
  } catch {
    /* ignore autoplay / unsupported */
  }
}

/** Distinct lower “ping” for bell / invoice notifications. */
export function playNotificationSound() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastNotificationAt < 900) return;
  lastNotificationAt = now;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const master = ctx.createGain();
    master.gain.value = 0.1;
    master.connect(ctx.destination);

    const tones = [
      { freq: 523.25, start: 0, dur: 0.14 },
      { freq: 659.25, start: 0.12, dur: 0.18 },
      { freq: 783.99, start: 0.26, dur: 0.22 },
    ];

    for (const t of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = t.freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + t.start);
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + t.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + t.start + t.dur
      );
      osc.connect(gain);
      gain.connect(master);
      osc.start(ctx.currentTime + t.start);
      osc.stop(ctx.currentTime + t.start + t.dur + 0.03);
    }

    void ctx.resume();
    window.setTimeout(() => void ctx.close(), 700);
  } catch {
    /* ignore */
  }
}
