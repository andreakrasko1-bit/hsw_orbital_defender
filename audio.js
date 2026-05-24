// ===== AUDIO ENGINE (Web Audio API - No external files) =====
const AudioEngine = (() => {
    let ctx = null;
    let muted = false;
    let initialized = false;

    function init() {
        if (initialized) return;
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    function ensureContext() {
        if (!ctx) init();
        if (ctx && ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function isMuted() { return muted; }
    function toggleMute() { muted = !muted; return muted; }

    // Sonar ping - short blip on radar sweep
    function sonarPing() {
        if (muted) return;
        const c = ensureContext();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.1);
    }

    // Laser pew - firing sound
    function laserFire() {
        if (muted) return;
        const c = ensureContext();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, c.currentTime + 0.25);
        gain.gain.setValueAtTime(0.15, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.25);

        // Add a second harmonic
        const osc2 = c.createOscillator();
        const gain2 = c.createGain();
        osc2.connect(gain2);
        gain2.connect(c.destination);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1800, c.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.2);
        gain2.gain.setValueAtTime(0.07, c.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
        osc2.start(c.currentTime);
        osc2.stop(c.currentTime + 0.2);
    }

    // Explosion crunch
    function explosion() {
        if (muted) return;
        const c = ensureContext();
        if (!c) return;

        // Noise burst
        const bufferSize = c.sampleRate * 0.4;
        const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const noise = c.createBufferSource();
        noise.buffer = buffer;

        const filter = c.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, c.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.3);

        const gain = c.createGain();
        gain.gain.setValueAtTime(0.25, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        noise.start(c.currentTime);
        noise.stop(c.currentTime + 0.4);

        // Low boom
        const osc = c.createOscillator();
        const oscGain = c.createGain();
        osc.connect(oscGain);
        oscGain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, c.currentTime + 0.35);
        oscGain.gain.setValueAtTime(0.3, c.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.35);
    }

    // Alarm buzz - hazardous asteroid close
    function alarm() {
        if (muted) return;
        const c = ensureContext();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, c.currentTime);
        gain.gain.setValueAtTime(0.0, c.currentTime);
        // Two-tone alarm
        for (let i = 0; i < 4; i++) {
            const t = c.currentTime + i * 0.15;
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.setValueAtTime(0.0, t + 0.07);
            osc.frequency.setValueAtTime(i % 2 === 0 ? 300 : 220, t);
        }
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.6);
    }

    // Purchase sound
    function purchase() {
        if (muted) return;
        const c = ensureContext();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, c.currentTime);
        osc.frequency.setValueAtTime(659, c.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, c.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.35);
    }

    // Impact sound - asteroid hits Earth
    function impact() {
        if (muted) return;
        const c = ensureContext();
        if (!c) return;

        // Deep rumble
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, c.currentTime + 0.8);
        gain.gain.setValueAtTime(0.3, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.8);

        // Crackle
        const bufferSize = c.sampleRate * 0.6;
        const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
        }
        const noise = c.createBufferSource();
        noise.buffer = buffer;
        const nGain = c.createGain();
        nGain.gain.setValueAtTime(0.15, c.currentTime);
        nGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
        noise.connect(nGain);
        nGain.connect(c.destination);
        noise.start(c.currentTime);
        noise.stop(c.currentTime + 0.6);
    }

    return {
        init, isMuted, toggleMute,
        sonarPing, laserFire, explosion, alarm, purchase, impact
    };
})();
