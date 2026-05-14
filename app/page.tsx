"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Phone, PhoneOff, Languages, Globe } from "lucide-react";
import { Conversation } from "@elevenlabs/client";

// Language configurations - agentId not needed anymore
const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇦🇪" },
];

export default function Home() {
  const [volume, setVolume] = useState(0.3);
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Disconnected");
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string, content: string, language?: string }>>([]);

  const conversationRef = useRef<any>(null);

  // Orb animation based on volume
  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(() => {
      setVolume(0.25 + Math.random() * 0.75);
    }, 120);

    return () => clearInterval(interval);
  }, [connected]);

  const rays = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => {
      const seed = (i + 1) * 9973;
      const scale = 0.7 + ((seed % 1000) / 1000) * 0.5;
      const pulseDuration = 1 + (((seed * 7) % 1000) / 1000) * 1;

      return {
        id: i,
        rotate: i * 20,
        delay: i * 0.08,
        scale,
        pulseDuration,
      };
    });
  }, []);

  // Get language-specific greeting
  const getGreeting = (langCode: string) => {
    const greetings: { [key: string]: string } = {
      en: "Hello! How can I help you today?",
      hi: "नमस्ते! आज मैं आपकी कैसे मदद कर सकता हूँ?",
      es: "¡Hola! ¿Cómo puedo ayudarte hoy?",
      fr: "Bonjour! Comment puis-je vous aider aujourd'hui?",
      de: "Hallo! Wie kann ich Ihnen heute helfen?",
      it: "Ciao! Come posso aiutarti oggi?",
      ja: "こんにちは！今日はどのようにお手伝いできますか？",
      ko: "안녕하세요! 오늘 어떻게 도와드릴까요?",
      zh: "你好！今天我能帮您什么？",
      ar: "مرحباً! كيف يمكنني مساعدتك اليوم؟"
    };
    return greetings[langCode] || greetings.en;
  };

  const startConversation = async (signedUrl: string) => {
    try {
      setStatus("Connecting...");

      const conversation = await Conversation.startSession({
        signedUrl: signedUrl,
        onConnect: () => {
          console.log("Connected to conversation");
          setConnected(true);
          setStatus(`${selectedLanguage.name}: Listening... Say something!`);
          setError(null);

          // Add greeting to conversation history
          const greeting = getGreeting(selectedLanguage.code);
          setConversationHistory(prev => [...prev, {
            role: "ai",
            content: greeting,
            language: selectedLanguage.name
          }]);
        },
        onDisconnect: () => {
          console.log("Disconnected from conversation");
          setConnected(false);
          setStatus("Disconnected");
          conversationRef.current = null;
        },
        onError: (error: any) => {
          console.error("Conversation error:", error);
          setError(error.message || "Conversation error occurred");
          setStatus("Error");
          setConnected(false);
        },
        onModeChange: (mode: any) => {
          console.log("Mode changed:", mode);
          if (mode.mode === "speaking") {
            setStatus(`${selectedLanguage.name}: AI is speaking...`);
          } else if (mode.mode === "listening") {
            setStatus(`${selectedLanguage.name}: Listening... You can speak now`);
          }
        },
        onMessage: (message: any) => {
          console.log("Message received:", message);
          if (message.type === "user") {
            setConversationHistory(prev => [...prev, {
              role: "user",
              content: message.text,
              language: selectedLanguage.name
            }]);
          } else if (message.type === "ai") {
            setConversationHistory(prev => [...prev, {
              role: "ai",
              content: message.text,
              language: selectedLanguage.name
            }]);
          }
        }
      });

      conversationRef.current = conversation;
    } catch (err: any) {
      console.error("Failed to start conversation:", err);
      throw new Error(err.message || "Failed to start conversation");
    }
  };

  const handleCallToggle = async () => {
    if (isLoading) return;

    // Disconnect if already connected
    if (connected && conversationRef.current) {
      try {
        setStatus("Disconnecting...");
        await conversationRef.current.endSession();
        conversationRef.current = null;
        setConnected(false);
        setStatus("Disconnected");
        setConversationHistory([]);
      } catch (err) {
        console.error("Error disconnecting:", err);
        setStatus("Disconnected");
      }
      return;
    }

    // Start new conversation
    setIsLoading(true);
    setError(null);
    setStatus(`Requesting microphone access...`);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      setStatus(`Getting signed URL for ${selectedLanguage.name}...`);

      // Send selected language to API (agentId not needed, server uses env variable)
      const response = await fetch("/api/signed-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: selectedLanguage.code,
          // No need to send agentId anymore
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.signedUrl) {
        throw new Error("No signed URL received");
      }

      setStatus(`Starting ${selectedLanguage.name} conversation...`);
      await startConversation(data.signedUrl);

    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Something went wrong");
      setStatus("Error");
      setConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = (language: typeof languages[0]) => {
    if (connected) {
      setError("Please end current conversation before changing language");
      return;
    }
    setSelectedLanguage(language);
    setShowLanguageMenu(false);
    setStatus(`Ready to speak ${language.name}`);

    // Optional: Clear conversation history when changing language
    setConversationHistory([]);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_55%)]" />

      {/* Language Selector Button */}
      <div className="fixed top-6 right-6 z-20">
        <button
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          disabled={connected}
          className={`flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-2 border border-white/20 text-white hover:bg-white/20 transition-all duration-300 ${connected ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          <Globe size={18} />
          <span>{selectedLanguage.flag} {selectedLanguage.name}</span>
          <Languages size={16} />
        </button>

        {/* Language Dropdown Menu */}
        {showLanguageMenu && !connected && (
          <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-slate-800/95 backdrop-blur-md border border-white/20 shadow-xl overflow-hidden z-30">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang)}
                className={`w-full text-left px-4 py-2 hover:bg-white/10 transition-colors flex items-center gap-2 ${selectedLanguage.code === lang.code ? "bg-white/10 text-cyan-300" : "text-white"
                  }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                {selectedLanguage.code === lang.code && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Orb Container */}
        <div className="relative flex items-center justify-center animate-float">
          {/* Outer Glow */}
          <div
            className="absolute h-[350px] w-[350px] rounded-full bg-cyan-400/20 blur-3xl transition-all duration-200"
            style={{
              transform: `scale(${1 + volume * 0.15})`,
            }}
          />

          {/* Main Orb */}
          <div className="relative flex h-[290px] w-[290px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 shadow-[0_30px_80px_rgba(0,0,0,0.3)]">
            {/* Rays */}
            {rays.map((ray) => (
              <div
                key={ray.id}
                className="absolute left-1/2 top-1/2 origin-top"
                style={{
                  transform: `translate(-50%, -100%) rotate(${ray.rotate}deg) scaleY(${ray.scale})`,
                }}
              >
                <div
                  className="animate-pulse rounded-full bg-gradient-to-b from-white via-cyan-300 to-transparent opacity-60 blur-[8px]"
                  style={{
                    width: "48px",
                    height: `${100 + volume * 80}px`,
                    animationDelay: `${ray.delay}s`,
                    animationDuration: `${ray.pulseDuration}s`,
                  }}
                />
              </div>
            ))}

            {/* Rotating Shine */}
            <div
              className="absolute inset-0 animate-spin rounded-full bg-[conic-gradient(from_90deg,rgba(255,255,255,0.4),transparent,rgba(255,255,255,0.3),transparent)] opacity-60"
              style={{
                animationDuration: "8s",
              }}
            />

            {/* Language Indicator on Orb */}
            <div className="absolute top-4 right-4 text-3xl z-10 drop-shadow-lg">
              {selectedLanguage.flag}
            </div>

            {/* Inner Glow */}
            <div
              className="absolute h-20 w-20 rounded-full bg-white/30 blur-2xl transition-all duration-150"
              style={{
                transform: `scale(${1 + volume * 0.4})`,
              }}
            />

            {/* Center Dot */}
            <div className="absolute h-4 w-4 rounded-full bg-white/80 blur-sm" />
          </div>

          {/* Call/End Button */}
          <button
            onClick={handleCallToggle}
            disabled={isLoading}
            className={`absolute -bottom-12 cursor-pointer flex h-24 w-24 items-center justify-center rounded-full border-[6px] border-slate-900 shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${connected
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-br from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700"
              }`}
          >
            {isLoading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : connected ? (
              <PhoneOff className="text-white" size={34} />
            ) : (
              <Phone className="text-white" size={34} />
            )}
          </button>
        </div>

        {/* Status Card */}
        <div className="mt-20">
          <div className="rounded-2xl bg-white/10 backdrop-blur-md px-8 py-4 border border-white/20">
            <div className="flex items-center gap-2 justify-center mb-2">
              <span className="text-2xl">{selectedLanguage.flag}</span>
              <div className="text-2xl font-semibold text-white text-center">
                {status}
              </div>
            </div>
            {connected && (
              <div className="text-xs text-cyan-300 text-center mt-1">
                Speaking {selectedLanguage.name}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-500/20 backdrop-blur-md px-6 py-3 text-sm text-red-200 border border-red-500/30">
            {error}
          </div>
        )}

        {/* Optional: Conversation History - Uncomment if needed */}
        {/* {conversationHistory.length > 0 && (
          <div className="mt-12 w-full max-w-2xl mx-4">
            <div className="rounded-2xl bg-white/5 backdrop-blur-md p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-3 text-center flex items-center justify-center gap-2">
                <Globe size={18} />
                Conversation History ({selectedLanguage.name})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {conversationHistory.slice(-8).map((msg, idx) => (
                  <div key={idx} className={`text-sm p-2 rounded-lg ${msg.role === 'user'
                      ? 'bg-cyan-500/10 text-cyan-300'
                      : 'bg-purple-500/10 text-white'
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        {msg.role === 'user' ? 'You' : 'AI'}:
                      </span>
                      {msg.language && (
                        <span className="text-xs opacity-70">
                          {languages.find(l => l.name === msg.language)?.flag}
                        </span>
                      )}
                    </div>
                    <div className="pl-2">
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )} */}
      </div>

      {/* Ambient Glow */}
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />
    </div>
  );
}
