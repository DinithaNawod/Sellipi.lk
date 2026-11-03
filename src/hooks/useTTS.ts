import { useState, useEffect, useCallback, useRef } from 'react';

export type TTSLang = 'si-LK' | 'en-US';

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const runRef = useRef(0);

  useEffect(() => {
    setSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
    // Some browsers load their available voices asynchronously.
    window.speechSynthesis?.getVoices();
    return () => { runRef.current++; window.speechSynthesis?.cancel(); };
  }, []);

  const speak = useCallback((text: string, lang: TTSLang = 'en-US') => {
    setError('');
    if (!window.speechSynthesis || !('SpeechSynthesisUtterance' in window)) {
      setError('Text-to-speech is not supported in this browser. Open this page in a browser with speech support.');
      return;
    }
    const clean = text.trim();
    if (!clean) return;
    const run = ++runRef.current;
    const synth = window.speechSynthesis;
    synth.cancel();
    // Short utterances avoid browser cut-offs when reading lengthy inscriptions.
    const chunks = clean.match(/.{1,200}(?:\s+|$)|\S{1,200}/gs) || [clean];
    let index = 0;
    setSpeaking(true);
    function next() {
      if (runRef.current !== run) return;
      if (index >= chunks.length) { utteranceRef.current = null; setSpeaking(false); return; }
      const utterance = new SpeechSynthesisUtterance(chunks[index++]);
      utterance.lang = lang;
      const voices = synth.getVoices();
      const voice = voices.find(item => item.lang.toLowerCase() === lang.toLowerCase()) || voices.find(item => item.lang.toLowerCase().startsWith(lang.slice(0, 2)));
      if (voice) utterance.voice = voice;
      utterance.rate = 0.9;
      utterance.volume = 1;
      utterance.onend = next;
      utterance.onerror = event => {
        if (runRef.current !== run) return;
        utteranceRef.current = null;
        setSpeaking(false);
        if (!['canceled', 'interrupted'].includes(event.error)) setError('Voice playback could not start. Check your device audio and installed speech voices, then try again.');
      };
      utteranceRef.current = utterance;
      try { synth.resume(); synth.speak(utterance); }
      catch { utteranceRef.current = null; setSpeaking(false); setError('Voice playback is unavailable. Please try another browser.'); }
    }
    next();
  }, []);

  const stop = useCallback(() => {
    runRef.current++;
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
    setError('');
  }, []);

  return { speak, stop, speaking, supported, error };
}
