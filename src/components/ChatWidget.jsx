import { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Globe, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Trash2,
  History,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { 
  sendMessage, 
  createConversation, 
  getConversations, 
  getMessages, 
  deleteConversation, 
  clearConversation 
} from "../services/api";

const INITIAL_MESSAGE = {
  id: 1,
  type: "bot",
  text: "Hi there! I'm CivicSync AI. You can ask me about local laws, your eligibility for subsidies, or any pending bills."
};

const LANGUAGES = [
  { code: "en-US", name: "English" },
  { code: "es-ES", name: "Espa├▒ol" },
  { code: "fr-FR", name: "Fran├ºais" },
  { code: "de-DE", name: "Deutsch" },
  { code: "hi-IN", name: "αñ╣αñ┐αñ¿αÑìαñªαÑÇ" },
  { code: "zh-CN", name: "Σ╕¡µûç" },
  { code: "ar-SA", name: "╪º┘ä╪╣╪▒╪¿┘è╪⌐" },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [activeSpeakingId, setActiveSpeakingId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load chat conversations when widget is opened
  useEffect(() => {
    if (isOpen) {
      loadConversations(true);
    } else {
      setIsHistoryOpen(false);
    }
  }, [isOpen]);

  const loadConversations = async (autoSelect = true) => {
    try {
      setLoadingHistory(true);
      const chats = await getConversations();
      setConversations(chats || []);
      
      if (autoSelect) {
        if (chats && chats.length > 0) {
          // If we have an active conversation, keep it. Otherwise load the most recent.
          if (conversationId && chats.some(c => c.id === conversationId)) {
            await openConversation(conversationId);
          } else {
            await openConversation(chats[0].id);
          }
        } else {
          setConversationId(null);
          setMessages([INITIAL_MESSAGE]);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openConversation = async (id) => {
    try {
      setConversationId(id);
      setIsTyping(true);
      const history = await getMessages(id);
      if (history && history.length > 0) {
        setMessages(history.map(msg => ({
          id: msg.id || msg._id || Date.now() + Math.random(),
          type: msg.type,
          text: msg.text,
          sources: msg.sources || []
        })));
      } else {
        setMessages([INITIAL_MESSAGE]);
      }
    } catch (err) {
      console.error("Failed to load conversation messages", err);
    } finally {
      setIsTyping(false);
    }
  };

  const newConversation = () => {
    setConversationId(null);
    setMessages([INITIAL_MESSAGE]);
  };

  const handleDeleteConversation = async (id) => {
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      try {
        await deleteConversation(id);
        if (conversationId === id) {
          setConversationId(null);
          setMessages([INITIAL_MESSAGE]);
        }
        await loadConversations(false);
      } catch (err) {
        console.error("Failed to delete conversation", err);
      }
    }
  };

  const handleClearHistory = async () => {
    if (!conversationId) {
      setMessages([INITIAL_MESSAGE]);
      return;
    }
    if (window.confirm("Are you sure you want to clear this conversation's messages?")) {
      try {
        await clearConversation(conversationId);
        setMessages([INITIAL_MESSAGE]);
      } catch (err) {
        console.error("Failed to clear chat history", err);
      }
    }
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

    const userInput = input;
    setInput("");
    setIsTyping(true);

    // Show user message immediately
    setMessages(prev => [...prev, { id: Date.now(), type: "user", text: userInput }]);

    try {
      // Let the backend create the conversation with a smart title on first message
      const langCode = selectedLang.split("-")[0];
      const result = await sendMessage({
        conversation_id: conversationId || null,
        message: userInput,
        language: langCode,
      });

      // Save conversation id returned by backend for new conversations
      if (!conversationId && result.conversation_id) {
        setConversationId(result.conversation_id);
      }

      const botMsgId = Date.now() + 1;
      setMessages(prev => [
        ...prev, 
        { id: botMsgId, type: "bot", text: result.response, sources: result.sources || [] }
      ]);
      handleSpeak(botMsgId, result.response);

      // Refresh conversations list so new smart title appears
      await loadConversations(false);
    } catch (err) {
      console.error("Failed to send chat message", err);
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
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              width: isHistoryOpen ? 580 : 360
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-28 right-6 h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex z-50 overflow-hidden"
          >
            {/* Left Sidebar - Chat History */}
            <AnimatePresence>
              {isHistoryOpen && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 220 }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.25 }}
                  className="h-full bg-[#0d1017] border-r border-border flex flex-col overflow-hidden flex-shrink-0"
                >
                  {/* Sidebar Header */}
                  <div className="flex items-center justify-between p-3 border-b border-border bg-[#11141b]">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Chat History</span>
                    <button
                      onClick={newConversation}
                      className="p-1 rounded hover:bg-accent/20 text-accent transition-colors"
                      title="Start a new chat"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Conversation List */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                    {loadingHistory ? (
                      <div className="text-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-accent" />
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center py-8 text-[11px] text-textSecondary px-2">
                        No conversations yet
                      </div>
                    ) : (
                      conversations.map((chat) => (
                        <div
                          key={chat.id}
                          className={clsx(
                            "group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border text-xs",
                            conversationId === chat.id
                              ? "bg-accent/15 border-accent/30 text-white font-semibold"
                              : "bg-transparent border-transparent hover:bg-[#171a21] text-textSecondary hover:text-white"
                          )}
                        >
                          <button
                            onClick={() => openConversation(chat.id)}
                            className="flex-1 text-left truncate pr-2"
                          >
                            {chat.title || "Untitled Chat"}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(chat.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-500/20 text-textSecondary hover:text-red-400"
                            title="Delete conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Right Panel - Main Chat Box */}
            <div className="w-[360px] h-full flex flex-col flex-shrink-0 bg-card">
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

                <div className="flex items-center gap-1.5">
                  {/* Toggle History Button */}
                  <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={clsx(
                      "p-1.5 rounded-lg transition-colors border",
                      isHistoryOpen
                        ? "bg-accent/15 border-accent/30 text-accent"
                        : "border-transparent text-textSecondary hover:text-white hover:bg-[#202430]"
                    )}
                    title="Toggle history sidebar"
                  >
                    <History className="w-4 h-4" />
                  </button>

                  {/* Quick New Chat Button */}
                  <button
                    onClick={newConversation}
                    className="p-1.5 rounded-lg border border-transparent text-textSecondary hover:text-white hover:bg-[#202430] transition-colors"
                    title="Start new chat"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {/* Clear Chat History for Active Chat */}
                  {messages.length > 1 && (
                    <button
                      onClick={handleClearHistory}
                      className="text-[#ff5b5b] hover:text-[#ff3b3b] transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                      title="Clear chat history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

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

              {/* Messages List */}
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
                      <div className="whitespace-pre-line">{msg.text}</div>
                      {msg.type === "bot" && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2.5 pt-1.5 border-t border-border/30 flex flex-wrap gap-1 items-center">
                          <span className="text-[9px] uppercase tracking-wider text-accent font-bold mr-1">Sources:</span>
                          {msg.sources.map((src, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-medium">
                              {src}
                            </span>
                          ))}
                        </div>
                      )}
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

              {/* Input Area */}
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
