import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Loader2, Globe, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { chatQuery } from "../../services/aiService";

const INITIAL_MESSAGE = {
  id: 1,
  type: "bot",
  text: "Hi! I'm CivicSync AI. Ask me about any legislation, your eligibility for government schemes, or how a bill affects you personally.",
};

const LANGUAGES = [
  { code: "en-US", name: "English" },
  { code: "es-ES", name: "Español (Spanish)" },
  { code: "fr-FR", name: "Français (French)" },
  { code: "de-DE", name: "Deutsch (German)" },
  { code: "hi-IN", name: "हिन्दी (Hindi)" },
  { code: "zh-CN", name: "中文 (Chinese)" },
  { code: "ar-SA", name: "العربية (Arabic)" },
];

export default function AIChat() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [activeSpeakingId, setActiveSpeakingId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Clean up synthesis and warm up voice cache
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      // Chrome requires binding to voiceschanged to fully load voices
      const handleVoicesChanged = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = selectedLang;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + " " + transcript : transcript));
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSpeak = (msgId, text) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (activeSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    
    // Tiny delay to allow browser speech engine to clear the cancel state
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLang;
      
      const voices = window.speechSynthesis.getVoices();
      const baseLang = selectedLang.split("-")[0].toLowerCase();
      // Match by exact lang, base lang, or check voice name for language indicators (like "hindi" or "hi")
      const voice = voices.find(v => v.lang.toLowerCase() === selectedLang.toLowerCase()) || 
                    voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(baseLang)) ||
                    voices.find(v => v.name.toLowerCase().includes("hindi") || v.name.toLowerCase().includes("kalpana") || v.name.toLowerCase().includes("hemant") || v.lang.toLowerCase().startsWith("hi"));
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        setActiveSpeakingId(null);
      };

      utterance.onerror = (e) => {
        console.error("Speech synthesis error:", e);
        if (utterance.voice) {
          console.log("Retrying speech synthesis without explicit voice selection...");
          const retryUtterance = new SpeechSynthesisUtterance(text);
          retryUtterance.lang = selectedLang;
          retryUtterance.onend = () => {
            setActiveSpeakingId(null);
          };
          retryUtterance.onerror = (err) => {
            console.error("Retry speech synthesis error:", err);
            setActiveSpeakingId(null);
          };
          window.speechSynthesis.speak(retryUtterance);
        } else {
          setActiveSpeakingId(null);
        }
      };

      setActiveSpeakingId(msgId);
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
    }

    const userMsg = { id: Date.now(), type: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    const userInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const { response } = await chatQuery(userInput, { lang: selectedLang });
      const botMsgId = Date.now() + 1;
      setMessages((prev) => [...prev, { id: botMsgId, type: "bot", text: response }]);
      handleSpeak(botMsgId, response);
    } catch {
      const errorMsgId = Date.now() + 1;
      const errorText = "Sorry, I couldn't process that. Please try again.";
      setMessages((prev) => [...prev, { id: errorMsgId, type: "bot", text: errorText }]);
      handleSpeak(errorMsgId, errorText);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    "Does the Carbon Tax apply to small businesses?",
    "What schemes am I eligible for?",
    "Summarize the Infrastructure Act 2024",
    "How does the new Zoning Law affect me?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Chat</h1>
            <div className="flex items-center gap-1.5 text-xs text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
              CivicSync AI is online
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-[#171a21] border border-border rounded-xl px-3 py-1.5">
            <Globe className="w-4 h-4 text-accent" />
            <select
              value={selectedLang}
              onChange={(e) => {
                setSelectedLang(e.target.value);
                if ("speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                  setActiveSpeakingId(null);
                }
              }}
              className="bg-transparent text-xs text-white border-none outline-none cursor-pointer font-semibold pr-2"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-[#171a21] text-white">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-[#171a21] text-textSecondary border border-border hidden sm:inline-block">Response in ~2s</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx("flex gap-3", msg.type === "user" ? "justify-end" : "justify-start")}
          >
            {msg.type === "bot" && (
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-5 h-5 text-background" />
              </div>
            )}
            <div 
              onClick={() => msg.type === "user" && setInput(msg.text)}
              className={clsx(
                "max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed relative transition-all duration-200 select-none",
                msg.type === "user"
                  ? "bg-accent text-background rounded-tr-sm font-medium cursor-pointer hover:bg-accentHover hover:scale-[1.01] active:scale-[0.99]"
                  : "bg-[#171a21] border border-border text-white rounded-tl-sm"
              )}
              title={msg.type === "user" ? "Click to edit this question" : undefined}
            >
              <div>{msg.text}</div>
              {msg.type === "bot" && (
                <div className="mt-3 pt-2 border-t border-border/40 flex justify-end">
                  <button
                    onClick={() => handleSpeak(msg.id, msg.text)}
                    className={clsx(
                      "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all duration-200",
                      activeSpeakingId === msg.id 
                        ? "bg-accent/20 text-accent border border-accent/30" 
                        : "text-textSecondary hover:text-white hover:bg-[#202430] border border-transparent"
                    )}
                  >
                    {activeSpeakingId === msg.id ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            {msg.type === "user" && (
              <div className="w-8 h-8 rounded-full bg-[#2a2e3d] flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-textSecondary" />
              </div>
            )}
          </motion.div>
        ))}

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-background" />
            </div>
            <div className="bg-[#171a21] border border-border text-white rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span className="text-xs text-textSecondary">AI is thinking...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions (shown only at start) */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mt-4 mb-3 flex-shrink-0">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { setInput(s); }}
              className="text-xs px-3 py-1.5 rounded-full bg-[#171a21] border border-border text-textSecondary hover:text-white hover:border-accent/50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 pt-4 border-t border-border">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isListening ? "Listening... Speak now." : "Ask a civic question..."}
            className={clsx(
              "w-full bg-[#171a21] border rounded-2xl py-4 pl-6 pr-28 text-sm text-white focus:outline-none transition-colors",
              isListening ? "border-danger ring-1 ring-danger/50" : "border-border focus:border-accent"
            )}
          />
          
          {/* Microphone button */}
          <button
            onClick={toggleListening}
            className={clsx(
              "absolute right-14 w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              isListening 
                ? "bg-danger text-white animate-pulse" 
                : "text-textSecondary hover:text-white hover:bg-[#202430]"
            )}
            title={isListening ? "Stop listening" : "Start voice typing"}
          >
            {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
          </button>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping || isListening}
            className="absolute right-2 w-10 h-10 rounded-xl bg-accent text-background flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accentHover transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-textSecondary text-center mt-2">AI responses are for informational purposes. Always verify with official government sources.</p>
      </div>
    </div>
  );
}
