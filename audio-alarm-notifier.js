class AudioAlarmNotifier {
  constructor() {
    this.audioContext = null;
    this.isPlaying = false;
    this.timeoutId = null;
    this.intervalId = null;
    this.trackAudio = null;
    this.objectTrackUrls = {};
    this.lastTrackName = "";
    this.lastTrackPlayedAt = 0;
    this.trackReplayCooldownMs = 800;
    this.trackVolume = 0.86;
    this.defaultTrackSources = {
      terminalRed: "assets/The_Terminal_Red.mp3",
      pretiumAvaritiae: "assets/Pretium_Avaritiae.mp3"
    };
    this.trackSources = {
      ...this.defaultTrackSources
    };
    this.volume = 0.28;
    this.highFrequency = 880;
    this.lowFrequency = 440;
    this.toneDurationMs = 180;
    this.totalDurationMs = 2400;
  }

  async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    return true;
  }

  playTone(frequency, durationSeconds) {
    if (!this.audioContext || !this.isPlaying) {
      return;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const now = this.audioContext.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.volume, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(this.volume, now + durationSeconds - 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + durationSeconds);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + durationSeconds);
  }

  resolveTrackUrl(trackName) {
    const relativePath = this.trackSources[trackName];
    if (!relativePath) {
      return "";
    }

    if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
      return chrome.runtime.getURL(relativePath);
    }

    return relativePath;
  }

  setTrackReplayCooldownMs(milliseconds) {
    const nextValue = Number(milliseconds);
    if (!Number.isFinite(nextValue) || nextValue < 0) {
      return;
    }

    this.trackReplayCooldownMs = nextValue;
  }

  setTrackSource(trackName, sourcePath, options = {}) {
    if (!this.defaultTrackSources[trackName]) {
      return;
    }

    const { objectUrl = false } = options;
    const normalized = String(sourcePath || "").trim();
    if (!normalized) {
      this.resetTrackSource(trackName);
      return;
    }

    if (this.objectTrackUrls[trackName]) {
      URL.revokeObjectURL(this.objectTrackUrls[trackName]);
      delete this.objectTrackUrls[trackName];
    }

    this.trackSources[trackName] = normalized;
    if (objectUrl) {
      this.objectTrackUrls[trackName] = normalized;
    }
  }

  resetTrackSource(trackName) {
    if (!this.defaultTrackSources[trackName]) {
      return;
    }

    if (this.objectTrackUrls[trackName]) {
      URL.revokeObjectURL(this.objectTrackUrls[trackName]);
      delete this.objectTrackUrls[trackName];
    }

    this.trackSources[trackName] = this.defaultTrackSources[trackName];
  }

  stopTrack() {
    if (!this.trackAudio) {
      return;
    }

    this.trackAudio.pause();
    this.trackAudio.currentTime = 0;
    this.trackAudio = null;
  }

  async playTrack(trackName) {
    const trackUrl = this.resolveTrackUrl(trackName);
    if (!trackUrl) {
      return;
    }

    await this.initAudioContext();
    const now = Date.now();
    if (this.lastTrackName === trackName && now - this.lastTrackPlayedAt < this.trackReplayCooldownMs) {
      return;
    }

    this.stopAlarm();
    this.stopTrack();

    const audio = new Audio(trackUrl);
    audio.preload = "auto";
    audio.volume = this.trackVolume;
    this.trackAudio = audio;
    this.lastTrackName = trackName;
    this.lastTrackPlayedAt = now;

    try {
      await audio.play();
    } catch (error) {
      console.warn("[SF3 Goblin] Failed to play track:", trackName, error);
      this.trackAudio = null;
      return;
    }

    audio.addEventListener("ended", () => {
      if (this.trackAudio === audio) {
        this.trackAudio = null;
      }
    }, { once: true });
  }

  async playAlarm() {
    if (this.isPlaying) {
      return;
    }

    await this.initAudioContext();
    this.stopTrack();
    this.isPlaying = true;

    let useHighTone = true;
    const tick = () => {
      if (!this.isPlaying) {
        return;
      }

      this.playTone(useHighTone ? this.highFrequency : this.lowFrequency, this.toneDurationMs / 1000);
      useHighTone = !useHighTone;
    };

    tick();
    this.intervalId = window.setInterval(tick, this.toneDurationMs);
    this.timeoutId = window.setTimeout(() => {
      this.stopAlarm();
    }, this.totalDurationMs);
  }

  stopAlarm() {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = false;

    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

window.audioAlarmNotifier = new AudioAlarmNotifier();