"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Phone, Mic, Volume2, PhoneOff } from "lucide-react";
import { Conversation } from "@elevenlabs/client";

export default function Home() {
  const [volume, setVolume] = useState(0.3);
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Disconnected");
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string, content: string }>>([]);

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

  const startConversation = async (signedUrl: string) => {
    try {
      setStatus("Connecting...");

      const conversation = await Conversation.startSession({
        signedUrl: signedUrl,
        onConnect: () => {
          console.log("Connected to conversation");
          setConnected(true);
          setStatus("Listening... Say something!");
          setError(null);
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
            setStatus("AI is speaking...");
          } else if (mode.mode === "listening") {
            setStatus("Listening... You can speak now");
          }
        },
        onMessage: (message: any) => {
          // Add user and AI messages to conversation history
          if (message.type === "user") {
            setConversationHistory(prev => [...prev, {
              role: "user",
              content: message.text
            }]);
          } else if (message.type === "ai") {
            setConversationHistory(prev => [...prev, {
              role: "ai",
              content: message.text
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
    setStatus("Requesting microphone access...");

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      setStatus("Getting signed URL...");

      // Get signed URL from API
      const response = await fetch("/api/signed-url");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get signed URL");
      }

      if (!data.signedUrl) {
        throw new Error("No signed URL received");
      }

      setStatus("Starting conversation...");
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

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_55%)]" />


      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Orb Container */}
        <div className="relative flex items-center justify-center">
          {/* Outer Glow */}
          <div
            className="absolute h-[350px] w-[350px] rounded-full bg-cyan-400/20 blur-3xl transition-all duration-200"
            style={{
              transform: `scale(${1 + volume * 0.15})`,
            }}
          />

          {/* Main Orb */}
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
          </div>

          {/* Call/End Button */}
          <button
            onClick={handleCallToggle}
            disabled={isLoading}
            className={`absolute -bottom-12 flex h-24 w-24 items-center justify-center rounded-full border-[6px] border-slate-900 shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${connected
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
            <div className="text-2xl font-semibold text-white text-center">
              {status}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-500/20 backdrop-blur-md px-6 py-3 text-sm text-red-200 border border-red-500/30">
            {error}
          </div>
        )}

        {/* Control Panel */}
        {/* <div className="mt-8 flex items-center gap-4 rounded-full bg-white/10 backdrop-blur-md px-8 py-4 border border-white/20 shadow-xl">
          <Volume2 size={20} className="text-cyan-300" />
          <div className="h-7 w-px bg-white/20" />
          <div className="flex items-center gap-3">
            <Mic className="text-cyan-300" size={22} />
            <span className="text-lg font-medium text-white">
              {connected ? "Active Conversation" : "Ready to Connect"}
            </span>
          </div>
        </div> */}

        {/* Conversation History (Optional) */}
        {conversationHistory.length > 0 && (
          <div className="mt-12 w-full max-w-2xl mx-4">
            <div className="rounded-2xl bg-white/5 backdrop-blur-md p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-3 text-center">Conversation History</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {conversationHistory.slice(-6).map((msg, idx) => (
                  <div key={idx} className={`text-sm ${msg.role === 'user' ? 'text-cyan-300' : 'text-white'}`}>
                    <span className="font-semibold">{msg.role === 'user' ? 'You: ' : 'AI: '}</span>
                    {msg.content}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ambient Glow */}
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />
    </div>
  );
}