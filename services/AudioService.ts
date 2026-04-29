export class AudioService {
    private ctx: AudioContext | null = null;
    private initialized = false;

    public init() {
        if (!this.initialized) {
            try {
                this.ctx = new AudioContext();
                this.initialized = true;
            } catch (e) {
                console.warn("Web Audio API not supported", e);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    private createPanner(x: number, y: number, z: number) {
        if (!this.ctx) return null;
        const panner = this.ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 5;
        panner.maxDistance = 100;
        panner.rolloffFactor = 1;
        panner.positionX.value = x;
        panner.positionY.value = y;
        panner.positionZ.value = z;
        return panner;
    }

    public playPlaceSound(x: number, y: number, z: number) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const panner = this.createPanner(x, y, z);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);

        gain.gain.setValueAtTime(0.0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        if (panner) {
            gain.connect(panner);
            panner.connect(this.ctx.destination);
        } else {
            gain.connect(this.ctx.destination);
        }

        osc.start(t);
        osc.stop(t + 0.1);
    }

    public playRemoveSound(x: number, y: number, z: number) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const panner = this.createPanner(x, y, z);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);

        gain.gain.setValueAtTime(0.0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(gain);
        if (panner) {
            gain.connect(panner);
            panner.connect(this.ctx.destination);
        } else {
            gain.connect(this.ctx.destination);
        }

        osc.start(t);
        osc.stop(t + 0.15);
    }

    public playCrashSound(x: number, y: number, z: number, intensity: number = 1.0) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.2; // 200ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; // White noise
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800 * intensity;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5 * Math.min(1, intensity), t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        const panner = this.createPanner(x, y, z);

        noise.connect(filter);
        filter.connect(gain);
        if (panner) {
            gain.connect(panner);
            panner.connect(this.ctx.destination);
        } else {
            gain.connect(this.ctx.destination);
        }

        noise.start(t);
    }

    public playShootSound(x: number, y: number, z: number) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const panner = this.createPanner(x, y, z);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);

        gain.gain.setValueAtTime(0.0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc.connect(gain);
        if (panner) {
            gain.connect(panner);
            panner.connect(this.ctx.destination);
        } else {
            gain.connect(this.ctx.destination);
        }

        osc.start(t);
        osc.stop(t + 0.3);
    }

    public updateListener(x: number, y: number, z: number, px: number, py: number, pz: number) {
        if (!this.ctx) return;
        const listener = this.ctx.listener;
        // setPosition and setOrientation are deprecated, but still widely used. Using new properties if available.
        if (listener.positionX) {
            listener.positionX.value = x;
            listener.positionY.value = y;
            listener.positionZ.value = z;
            listener.forwardX.value = px;
            listener.forwardY.value = py;
            listener.forwardZ.value = pz;
            listener.upX.value = 0;
            listener.upY.value = 1;
            listener.upZ.value = 0;
        } else {
            // Fallback for older browsers
            (listener as any).setPosition(x, y, z);
            (listener as any).setOrientation(px, py, pz, 0, 1, 0);
        }
    }
}

export const audioService = new AudioService();
