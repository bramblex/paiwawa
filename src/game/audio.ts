type AudioTrack = {
  element: HTMLAudioElement;
  source: string;
  volume: number;
};

export interface AudioState {
  muted: boolean;
  started: boolean;
  backgroundPaused: boolean;
  backgroundTime: number;
  shutterTime: number;
  successTime: number;
  failTime: number;
  greetingTime: number;
}

const createTrack = (
  source: string,
  volume: number,
  preload: 'auto' | 'metadata' | 'none',
  deferSource = false,
): AudioTrack => {
  const element = new Audio();
  element.preload = preload;
  element.volume = volume;
  if (!deferSource) element.src = source;
  return { element, source, volume };
};

/** Browser-safe music and one-shot effects, unlocked by the start button. */
export class GameAudio {
  private readonly bgm = createTrack('assets/audio/bgm/calm-track-loop.ogg', 0.13, 'none', true);
  private readonly shutter = createTrack('assets/audio/sfx/camera-shutter.ogg', 0.62, 'auto');
  private readonly success = createTrack('assets/audio/sfx/success-jingle.ogg', 0.44, 'auto');
  private readonly fail = createTrack('assets/audio/sfx/fail-jingle.ogg', 0.28, 'auto');
  private readonly greeting = createTrack('assets/audio/voice/yaoyao-leading.mp3', 0.78, 'auto');
  private readonly tracks: AudioTrack[];
  private hasStarted = false;
  private mutedState = false;

  constructor() {
    this.tracks = [this.bgm, this.shutter, this.success, this.fail, this.greeting];
    this.bgm.element.loop = true;
    this.bgm.element.addEventListener('error', this.onAudioError);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  get muted(): boolean {
    return this.mutedState;
  }

  get state(): AudioState {
    return {
      muted: this.mutedState,
      started: this.hasStarted,
      backgroundPaused: this.bgm.element.paused,
      backgroundTime: this.bgm.element.currentTime,
      shutterTime: this.shutter.element.currentTime,
      successTime: this.success.element.currentTime,
      failTime: this.fail.element.currentTime,
      greetingTime: this.greeting.element.currentTime,
    };
  }

  start(): void {
    this.hasStarted = true;
    if (!this.mutedState) void this.playBackgroundMusic();
  }

  toggleMuted(): boolean {
    this.setMuted(!this.mutedState);
    return this.mutedState;
  }

  setMuted(muted: boolean): void {
    this.mutedState = muted;
    for (const track of this.tracks) track.element.muted = muted;

    if (muted) {
      this.bgm.element.pause();
    } else if (this.hasStarted && !document.hidden) {
      void this.playBackgroundMusic();
    }
  }

  playShutter(): void {
    this.playEffect(this.shutter);
  }

  playSuccess(): void {
    this.playEffect(this.success);
  }

  playFail(): void {
    this.playEffect(this.fail);
  }

  playGreeting(): void {
    this.playEffect(this.greeting);
  }

  dispose(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.bgm.element.removeEventListener('error', this.onAudioError);
    for (const track of this.tracks) {
      track.element.pause();
      track.element.removeAttribute('src');
      track.element.load();
    }
  }

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) {
      this.bgm.element.pause();
    } else if (this.hasStarted && !this.mutedState) {
      void this.playBackgroundMusic();
    }
  };

  private readonly onAudioError = (): void => {
    console.warn('Background music could not be loaded.');
  };

  private async playBackgroundMusic(): Promise<void> {
    try {
      if (!this.bgm.element.hasAttribute('src')) {
        this.bgm.element.src = this.bgm.source;
        this.bgm.element.preload = 'auto';
      }
      this.bgm.element.volume = this.bgm.volume;
      await this.bgm.element.play();
    } catch {
      // Autoplay can still be denied in embedded browsers. The next explicit
      // sound-toggle interaction retries without blocking the game.
    }
  }

  private playEffect(track: AudioTrack): void {
    if (this.mutedState) return;
    track.element.pause();
    track.element.currentTime = 0;
    track.element.volume = track.volume;
    void track.element.play().catch(() => undefined);
  }
}
