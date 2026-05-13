export interface Soundscape {
  start(): Promise<void>;
  stop(): void;
}

export function createSoundscape(): Soundscape {
  let context: AudioContext | undefined;
  let gain: GainNode | undefined;
  let oscillators: OscillatorNode[] = [];

  return {
    async start() {
      context = context ?? new AudioContext();
      if (context.state === "suspended") await context.resume();
      gain = context.createGain();
      gain.gain.value = 0.035;
      gain.connect(context.destination);

      const base = context.createOscillator();
      base.type = "sine";
      base.frequency.value = 174;
      base.connect(gain);

      const soft = context.createOscillator();
      soft.type = "triangle";
      soft.frequency.value = 261.63;
      soft.connect(gain);

      oscillators = [base, soft];
      oscillators.forEach((oscillator) => oscillator.start());
    },
    stop() {
      oscillators.forEach((oscillator) => oscillator.stop());
      oscillators = [];
      gain?.disconnect();
      gain = undefined;
    },
  };
}
