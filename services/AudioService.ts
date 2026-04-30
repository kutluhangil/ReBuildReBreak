export class AudioService {
    public init() {}
    public playPlaceSound(x: number, y: number, z: number) {}
    public playRemoveSound(x: number, y: number, z: number) {}
    public playCrashSound(x: number, y: number, z: number, intensity: number = 1.0) {}
    public playShootSound(x: number, y: number, z: number) {}
    public updateListener(x: number, y: number, z: number, px: number, py: number, pz: number) {}
}

export const audioService = new AudioService();
