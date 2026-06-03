import { useState, useRef, useCallback } from "react";

// Minimal type declarations for Web Speech API (not in lib.dom.d.ts by default)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((e: Event) => void) | null;
  onend: ((e: Event) => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export type VoiceState = "idle" | "listening" | "processing" | "done" | "error";

interface UseVoiceInputOptions {
  onResult: (transcript: string) => void;
  onError?: (msg: string) => void;
}

export function useVoiceInput({ onResult, onError }: UseVoiceInputOptions) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<ISpeechRecognition | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback(() => {
    if (!isSupported) {
      onError?.("Trình duyệt không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome/Edge.");
      setState("error");
      return;
    }

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "vi-VN";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setState("listening");
      setTranscript("");
    };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setTranscript(t);

      if (e.results[e.results.length - 1].isFinal) {
        setState("processing");
        onResult(t);
      }
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      const msgs: Record<string, string> = {
        "not-allowed": "Bạn cần cho phép sử dụng microphone.",
        "no-speech": "Không nghe thấy gì. Hãy thử lại.",
        "network": "Lỗi kết nối mạng.",
        "audio-capture": "Không tìm thấy microphone.",
      };
      const msg = msgs[e.error] ?? `Lỗi: ${e.error}`;
      onError?.(msg);
      setState("error");
    };

    rec.onend = () => {
      if (state !== "processing") setState("idle");
    };

    recRef.current = rec;
    rec.start();
  }, [isSupported, onError, onResult, state]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setState("idle");
  }, []);

  const reset = useCallback(() => {
    recRef.current?.abort();
    setState("idle");
    setTranscript("");
  }, []);

  return { state, transcript, isSupported, start, stop, reset };
}
