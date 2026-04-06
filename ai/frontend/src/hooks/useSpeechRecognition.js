/**
 * hooks/useSpeechRecognition.js
 * Custom React hook wrapping the Web Speech API.
 *
 * Returns:
 *   - transcript     : current live transcript text (interim)
 *   - finalTranscript: finalized sentences (accumulated)
 *   - isListening    : recording state
 *   - isSupported    : whether browser supports Speech API
 *   - startListening : function to start recording
 *   - stopListening  : function to stop recording
 *   - resetTranscript: clear text
 */

import { useState, useEffect, useRef, useCallback } from "react";

const useSpeechRecognition = () => {
  const [transcript,      setTranscript]      = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [isListening,     setIsListening]     = useState(false);
  const [error,           setError]           = useState(null);

  const recognitionRef    = useRef(null);
  const shouldListenRef   = useRef(false);   // Use ref (not property on recognition) to avoid stale closure
  const finalBufferRef    = useRef("");       // Accumulate final text in a ref to avoid stale state in callbacks
  const isRestartingRef   = useRef(false);   // Guard against double-start during restart

  // ── Check browser support ─────────────────────────────────────────────────
  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // ── Initialize SpeechRecognition ──────────────────────────────────────────
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous      = true;   // Keep listening (don't stop after pause)
    recognition.interimResults  = true;   // Show partial results in real-time
    recognition.lang            = "en-US";
    recognition.maxAlternatives = 1;

    // ── Handle results ────────────────────────────────────────────────────
    recognition.onresult = (event) => {
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          // Accumulate into the ref buffer so we never lose text
          finalBufferRef.current += result[0].transcript + " ";
          setFinalTranscript(finalBufferRef.current);
        } else {
          interimText += result[0].transcript;
        }
      }

      // Show live interim text
      setTranscript(interimText);
    };

    // ── Handle errors ─────────────────────────────────────────────────────
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setError(event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        shouldListenRef.current = false;
        setIsListening(false);
      }
    };

    // ── Auto-restart when browser ends the session ─────────────────────────
    recognition.onend = () => {
      setTranscript("");  // Clear interim on each restart cycle
      if (shouldListenRef.current && !isRestartingRef.current) {
        isRestartingRef.current = true;
        // Small delay prevents rapid-fire restart loops
        setTimeout(() => {
          if (shouldListenRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.warn("Recognition restart failed:", e);
            }
          }
          isRestartingRef.current = false;
        }, 200);
      } else if (!shouldListenRef.current) {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isSupported]);

  // ── Start Recording ───────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!recognitionRef.current || shouldListenRef.current) return;
    setError(null);
    setTranscript("");
    shouldListenRef.current = true;
    isRestartingRef.current = false;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.error("Failed to start recognition:", e);
      shouldListenRef.current = false;
    }
  }, []);

  // ── Stop Recording ────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldListenRef.current = false;
    setTranscript("");  // Clear interim only — finalTranscript is preserved
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  // ── Reset All Text ────────────────────────────────────────────────────────
  const resetTranscript = useCallback(() => {
    finalBufferRef.current = "";
    setTranscript("");
    setFinalTranscript("");
  }, []);

  return {
    transcript,        // Interim (live) text
    finalTranscript,   // Accumulated final sentences
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useSpeechRecognition;
