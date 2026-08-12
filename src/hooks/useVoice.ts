import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
interface SpeechEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: { 0: { transcript: string }; isFinal: boolean };
  };
}

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

interface UseVoiceOptions {
  onFinalTranscript: (text: string, sttMs: number) => void;
  onSpeechStart?: () => void;
  /** Silence (ms) after the last recognised word before the utterance is submitted. */
  silenceMs?: number;
}

/**
 * Continuous speech-to-text with mic energy VAD used for barge-in detection.
 */
export function useVoice({
  onFinalTranscript,
  onSpeechStart,
  silenceMs = 1800,
}: UseVoiceOptions) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [interim, setInterim] = useState("");
  const [level, setLevel] = useState(0);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const speechStartRef = useRef<number>(0);
  const wantRef = useRef(false);
  const cbRef = useRef({ onFinalTranscript, onSpeechStart });
  cbRef.current = { onFinalTranscript, onSpeechStart };

  useEffect(() => {
    setSupported(getRecognition() !== null);
  }, []);

  const stopMeter = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    setLevel(0);
  }, []);

  const startMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let hot = 0;
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += (v - 128) ** 2;
        const rms = Math.sqrt(sum / data.length) / 128;
        setLevel(rms);
        // VAD: sustained energy above threshold => user is speaking (barge-in)
        if (rms > 0.06) {
          hot += 1;
          if (hot === 4) {
            speechStartRef.current = performance.now();
            cbRef.current.onSpeechStart?.();
          }
        } else {
          hot = 0;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* mic denied — recognition may still work */
    }
  }, []);

  const start = useCallback(async () => {
    const rec = getRecognition();
    if (!rec) {
      setSupported(false);
      return;
    }
    wantRef.current = true;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      setInterim(interimText);
      if (finalText.trim()) {
        const started = speechStartRef.current || performance.now();
        setInterim("");
        cbRef.current.onFinalTranscript(
          finalText.trim(),
          Math.round(performance.now() - started),
        );
        speechStartRef.current = 0;
      }
    };
    rec.onerror = () => undefined;
    rec.onend = () => {
      if (wantRef.current) {
        try {
          rec.start();
        } catch {
          /* already started */
        }
      } else {
        setListening(false);
      }
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      /* already started */
    }
    setListening(true);
    await startMeter();
  }, [startMeter]);

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
    setInterim("");
    stopMeter();
  }, [stopMeter]);

  useEffect(() => stop, [stop]);

  return { listening, supported, interim, level, start, stop };
}
