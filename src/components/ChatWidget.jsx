import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Globe, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { chatQuery } from "../services/aiService";

const INITIAL_MESSAGE = {
  id: 1,
  type: "bot",
  text: "Hi there! I'm CivicSync AI. You can ask me about local laws, your eligibility for subsidies, or any pending bills."
};

const LANGUAGES = [
  { code: "en-US", name: "English" },
  { code: "es-ES", name: "Español" },
  { code: "fr-FR", name: "Français" },
  { code: "de-DE", name: "Deutsch" },
  { code: "hi-IN", name: "हिन्दी" },
  { code: "zh-CN", name: "中文" },
  { code: "ar-SA", name: "العربية" },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
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
      const handleVoicesChanged = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
        window.speechSynthesis.cancel();
      };
    }
  }, [isOpen]);

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
    setMessages(prev => [...prev, userMsg]);
    const userInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const { response } = await chatQuery(userInput, { lang: selectedLang });
      const botMsgId = Date.now() + 1;
      setMessages(prev => [...prev, { id: botMsgId, type: "bot", text: response }]);
      handleSpeak(botMsgId, response);
    } catch (err) {
      const errorMsgId = Date.now() + 1;
      const errorText = "Sorry, I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { id: errorMsgId, type: "bot", text: errorText }]);
      handleSpeak(errorMsgId, errorText);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-28 right-6 w-[360px] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-[#171a21]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <Bot className="w-5 h-5 text-background" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">CivicSync AI</h3>
                  <p className="text-[10px] text-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Online
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mini Language Selector */}
                <div className="flex items-center gap-1 bg-[#0a0a0f] border border-border rounded-lg px-2 py-1">
                  <Globe className="w-3.5 h-3.5 text-accent" />
                  <select
                    value={selectedLang}
                    onChange={(e) => {
                      setSelectedLang(e.target.value);
                      if ("speechSynthesis" in window) {
                        window.speechSynthesis.cancel();
                        setActiveSpeakingId(null);
                      }
                    }}
                    className="bg-transparent text-[10px] text-white border-none outline-none cursor-pointer font-semibold pr-1"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-[#0a0a0f] text-white">
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-textSecondary hover:text-white transition-colors pl-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-[#0a0a0f]">
              {messages.map((msg) => (
                <div key={msg.id} className={clsx("flex flex-col", msg.type === "user" ? "items-end" : "items-start")}>
                  <div 
                    onClick={() => msg.type === "user" && setInput(msg.text)}
                    className={clsx(
                      "max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed relative transition-all duration-200 select-none",
                      msg.type === "user" 
                        ? "bg-accent text-background rounded-tr-sm cursor-pointer hover:bg-accentHover hover:scale-[1.01] active:scale-[0.99]" 
                        : "bg-[#171a21] border border-border text-white rounded-tl-sm"
                    )}
                    title={msg.type === "user" ? "Click to edit this question" : undefined}
                  >
                    <div>{msg.text}</div>
                    {msg.type === "bot" && (
                      <div className="mt-2 pt-1.5 border-t border-border/30 flex justify-end">
                        <button
                          onClick={() => handleSpeak(msg.id, msg.text)}
                          className={clsx(
                            "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-all duration-200",
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
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#171a21] border border-border text-white rounded-2xl rounded-tl-sm p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span className="text-xs text-textSecondary">AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-[#171a21]">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={isListening ? "Listening..." : "Ask a civic question..."}
                  className={clsx(
                    "w-full bg-[#0a0a0f] border rounded-xl py-3 pl-4 pr-24 text-sm text-white focus:outline-none transition-colors",
                    isListening ? "border-danger ring-1 ring-danger/50" : "border-border focus:border-accent"
                  )}
                />
                
                {/* Microphone button */}
                <button
                  onClick={toggleListening}
                  className={clsx(
                    "absolute right-11 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isListening 
                      ? "bg-danger text-white animate-pulse" 
                      : "text-textSecondary hover:text-white hover:bg-[#202430]"
                  )}
                  title={isListening ? "Stop listening" : "Start voice typing"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping || isListening}
                  className="absolute right-2 w-8 h-8 rounded-lg bg-accent text-background flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accentHover transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
            isOpen ? "bg-[#171a21] text-white border border-border shadow-xl" : "bg-accent text-background shadow-glow-accent"
          )}
        >
          {isOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7 fill-current" />}
        </motion.button>
      </div>
    </>
  );
}
