export class AudioService {
  // Disable audio by default to keep the app silent.
  public enabled = false;
  private ctx: AudioContext | null = null;
  private initialized = false;

  public init() {
    if (!this.enabled) return;
    if (!this.initialized) {
      try {
        this.ctx = new AudioContext();
        this.initialized = true;
      } catch (e) {
        console.warn("Web Audio API not supported", e);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  private createPanner(_x: number, _y: number, _z: number) {
    if (!this.enabled || !this.ctx) return null;
    const panner = this.ctx.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 5;
    panner.maxDistance = 100;
    panner.rolloffFactor = 1;
    panner.positionX.value = _x;
    panner.positionY.value = _y;
    panner.positionZ.value = _z;
    return panner;
  }

  public playPlaceSound(_x: number, _y: number, _z: number) {
    if (!this.enabled) return;
  }

  public playRemoveSound(_x: number, _y: number, _z: number) {
    if (!this.enabled) return;
  }

  public playCrashSound(
    _x: number,
    _y: number,
    _z: number,
    _intensity: number = 1.0,
  ) {
    if (!this.enabled) return;
  }

  public playShootSound(_x: number, _y: number, _z: number) {
    if (!this.enabled) return;
  }

  public updateListener(
    _x: number,
    _y: number,
    _z: number,
    _px: number,
    _py: number,
    _pz: number,
  ) {
    if (!this.enabled) return;
  }
}

export const audioService = new AudioService();
