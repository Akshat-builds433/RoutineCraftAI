/**
 * Clause-streaming TTS player.
 * Each clause is fetched as soon as it is produced by the LLM stream and
 * queued for gapless playback. stop() performs an instant barge-in: pending
 * fetches are aborted and the audio element is cleared.
 */
export class TtsPlayer {
  private queue: Blob[] = [];
  private playing = false;
  private audio: HTMLAudioElement | null = null;
  private controllers = new Set<AbortController>();
  private startedAt = 0;
  private firstAudio = false;

  onTtfa?: (ms: number) => void;
  onStart?: () => void;
  onEnd?: () => void;

  beginTurn() {
    this.startedAt = performance.now();
    this.firstAudio = false;
  }

  async speak(text: string, rimeKey?: string) {
    const controller = new AbortController();
    this.controllers.add(controller);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, rimeKey: rimeKey || undefined }),
        signal: controller.signal,
      });
      if (!res.ok) return;
      const blob = await res.blob();
      if (controller.signal.aborted) return;
      if (!this.firstAudio) {
        this.firstAudio = true;
        this.onTtfa?.(Math.round(performance.now() - this.startedAt));
      }
      this.queue.push(blob);
      void this.drain();
    } catch {
      /* aborted or network error */
    } finally {
      this.controllers.delete(controller);
    }
  }

  private async drain() {
    if (this.playing) return;
    this.playing = true;
    this.onStart?.();
    while (this.queue.length) {
      const blob = this.queue.shift();
      if (!blob) break;
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.audio = audio;
      try {
        await audio.play();
        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
        });
      } catch {
        /* interrupted */
      } finally {
        URL.revokeObjectURL(url);
      }
      if (this.audio !== audio) break; // stopped
    }
    this.playing = false;
    this.audio = null;
    this.onEnd?.();
  }

  get isPlaying() {
    return this.playing;
  }

  stop() {
    for (const c of this.controllers) c.abort();
    this.controllers.clear();
    this.queue = [];
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.playing = false;
  }
}
