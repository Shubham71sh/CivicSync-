import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
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
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

import {
  sendMessage,
  createConversation,
  getConversations,
  getMessages,
  deleteConversation,
  clearConversation,
} from "../../services/api";

const INITIAL_MESSAGE = {
  id: 1,
  type: "bot",
  text: "Hi! I'm CivicSync AI. Ask me about any legislation, your eligibility for government schemes, or how a bill affects you personally.",
};

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "pa", name: "Punjabi" },
  { code: "bn", name: "Bengali" },
  { code: "te", name: "Telugu" },
];

export default function AIChat() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [activeSpeakingId, setActiveSpeakingId] = useState(null);

  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isConversationAction, setIsConversationAction] = useState(false);
  const [conversationActionError, setConversationActionError] = useState("");
  const [connectionError, setConnectionError] = useState("");

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async (selectId = null) => {
    try {
      setLoadingHistory(true);

      const chats = await getConversations();

      setConversations(chats || []);
      setConnectionError("");

      if (selectId) {
        await openConversation(selectId);
      } else if (conversationId) {
        const stillExists = chats && chats.some((c) => c.id === conversationId);
        if (stillExists) {
          await openConversation(conversationId);
        } else if (chats && chats.length > 0) {
          await openConversation(chats[0].id);
        } else {
          setConversationId(null);
          setMessages([INITIAL_MESSAGE]);
        }
      } else if (chats && chats.length > 0) {
        await openConversation(chats[0].id);
      } else {
        setMessages([INITIAL_MESSAGE]);
      }
    } catch (err) {
      console.error(err);
      setConnectionError(getConnectionErrorMessage(err));
      setMessages([INITIAL_MESSAGE]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openConversation = async (id) => {
    try {
      setConversationId(id);

      const history = await getMessages(id);

      if (history && history.length > 0) {
        setMessages(history);
      } else {
        setMessages([INITIAL_MESSAGE]);
      }
    } catch (err) {
      console.error(err);
      setConnectionError(getConnectionErrorMessage(err));
    }
  };

  const newConversation = () => {
    setConversationId(null);
    setMessages([INITIAL_MESSAGE]);
    setInput("");
  };

  const getRequestErrorMessage = (error, fallback) =>
    error?.response?.data?.detail || error?.message || fallback;

  const getConnectionErrorMessage = (error) =>
    error?.code === "ERR_NETWORK"
      ? "Chat server is offline. Start the backend on http://127.0.0.1:8000, then refresh this page."
      : error?.code === "ECONNABORTED"
        ? "The chat server took too long to respond. Refresh the page or restart the backend."
        : getRequestErrorMessage(error, "Unable to connect to the chat server.");

  const removeConversation = async (id) => {
    if (!id || isConversationAction) return;

    if (!window.confirm("Delete this conversation permanently?")) return;

    try {
      setIsConversationAction(true);
      setConversationActionError("");
      await deleteConversation(id);

      const chats = await getConversations();
      setConversations(chats || []);

      if (conversationId === id) {
        const nextConversationId = chats?.[0]?.id;

        if (nextConversationId) {
          await openConversation(nextConversationId);
        } else {
          setConversationId(null);
          setMessages([INITIAL_MESSAGE]);
        }
      }
    } catch (err) {
      console.error(err);
      setConversationActionError(
        getRequestErrorMessage(err, "Unable to delete this chat. Please try again.")
      );
    } finally {
      setIsConversationAction(false);
    }
  };

  const handleClearHistory = async () => {
    if (!conversationId || isConversationAction) return;

    if (!window.confirm("Clear this conversation?")) return;

    try {
      setIsConversationAction(true);
      setConversationActionError("");
      await clearConversation(conversationId);
      setMessages([INITIAL_MESSAGE]);
    } catch (err) {
      console.error(err);
      setConversationActionError(
        getRequestErrorMessage(err, "Unable to clear this chat. Please try again.")
      );
    } finally {
      setIsConversationAction(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);
  // =======================
// PART 2 / 6
// Continue immediately after Part 1
// =======================

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();

      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };

      window.speechSynthesis.addEventListener(
        "voiceschanged",
        handleVoicesChanged
      );

      return () => {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged
        );
        window.speechSynthesis.cancel();
        if (speakIntervalRef.current) {
          clearInterval(speakIntervalRef.current);
        }
      };
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech Recognition is not supported in this browser."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();

      const langLocaleMap = {
        "en": "en-US",
        "hi": "hi-IN",
        "pa": "pa-IN",
        "bn": "bn-IN",
        "te": "te-IN",
      };

      recognition.lang = langLocaleMap[selectedLang] || "en-US";

      recognition.continuous = false;

      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript =
          event.results[0][0].transcript;

        setInput((prev) =>
          prev ? prev + " " + transcript : transcript
        );
      };

      recognition.onerror = (err) => {
        console.error(err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;

      recognition.start();
    } catch (err) {
      console.error(err);
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

  const speakIntervalRef = useRef(null);

  const handleSpeak = (id, text) => {
    if (!("speechSynthesis" in window)) return;

    // Stop if already speaking this message
    if (activeSpeakingId === id) {
      window.speechSynthesis.cancel();
      if (speakIntervalRef.current) {
        clearInterval(speakIntervalRef.current);
        speakIntervalRef.current = null;
      }
      setActiveSpeakingId(null);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    if (speakIntervalRef.current) {
      clearInterval(speakIntervalRef.current);
      speakIntervalRef.current = null;
    }

    const langLocaleMap = {
      "en": "en-US",
      "hi": "hi-IN",
      "pa": "pa-IN",
      "bn": "bn-IN",
      "te": "te-IN",
    };

    const locale = langLocaleMap[selectedLang] || "en-US";

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale;

      const voices = window.speechSynthesis.getVoices();
      const baseLang = locale.split("-")[0].toLowerCase();
      const voice =
        voices.find((v) => v.lang.toLowerCase() === locale.toLowerCase()) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(baseLang));

      if (voice) utterance.voice = voice;
      utterance.rate = 1;
      utterance.pitch = 1;

      // Chrome bug fix: resume every 10s to prevent auto-pause
      speakIntervalRef.current = setInterval(() => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        if (!window.speechSynthesis.speaking) {
          clearInterval(speakIntervalRef.current);
          speakIntervalRef.current = null;
        }
      }, 10000);

      utterance.onend = () => {
        clearInterval(speakIntervalRef.current);
        speakIntervalRef.current = null;
        setActiveSpeakingId(null);
      };

      utterance.onerror = () => {
        clearInterval(speakIntervalRef.current);
        speakIntervalRef.current = null;
        setActiveSpeakingId(null);
      };

      setActiveSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
    }

    const question = input;
    setInput("");
    setIsTyping(true);

    // Show user message immediately
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), type: "user", text: question },
    ]);

    try {
      // Send message - if no conversationId the backend will create one
      // with an AI-generated title automatically
      const result = await sendMessage({
        conversation_id: conversationId || null,
        message: question,
        language: selectedLang,
      });

      // If this was a new conversation, save the id the backend returned
      if (!conversationId && result.conversation_id) {
        setConversationId(result.conversation_id);
      }

      const botId = Date.now() + 1;
      const botMessage = {
        id: botId,
        type: "bot",
        text: result.response,
        sources: result.sources || [],
      };

      setMessages((prev) => [...prev, botMessage]);
      // Do NOT auto-speak — browser blocks speech without direct user interaction

      // Refresh sidebar - new title will now appear
      loadConversations();
    } catch (err) {
      console.error(err);
      const errorId = Date.now();
      const error = "Sorry, I couldn't process your request.";
      setMessages((prev) => [
        ...prev,
        { id: errorId, type: "bot", text: error },
      ]);
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

  /* =======================
  PART 3 / 6
  Continue immediately after Part 2
  ======================= */
  return (
<div className="flex h-[calc(100vh-8rem)]">

  {/* ================= Sidebar ================= */}

  <div className="w-72 bg-[#11141b] border-r border-border flex flex-col">

    <div className="p-4">

      <button
        type="button"
        onClick={newConversation}
        className="w-full flex items-center justify-center gap-2 bg-accent text-background rounded-xl py-3 font-semibold hover:bg-accentHover transition"
      >
        <Plus size={18} />
        New Chat
      </button>

    </div>

    <div className="px-4 pb-2 text-xs uppercase tracking-wider text-textSecondary font-semibold">
      Conversations
    </div>

    <div className="flex-1 overflow-y-auto px-2">

      {loadingHistory ? (

        <div className="text-center text-sm text-textSecondary mt-6">
          Loading...
        </div>

      ) : conversations.length === 0 ? (

        <div className="text-center text-sm text-textSecondary mt-6">
          No conversations
        </div>

      ) : (

        conversations.map((chat) => (

          <div
            key={chat.id}
            className={clsx(
              "group flex items-center justify-between px-3 py-3 rounded-xl mb-2 cursor-pointer transition",
              conversationId === chat.id
                ? "bg-accent/20 border border-accent/20"
                : "hover:bg-[#1c202b]"
            )}
          >

            <button
              type="button"
              onClick={() => openConversation(chat.id)}
              className="flex-1 truncate text-left text-sm text-white"
            >
              {chat.title}
            </button>

            <button
              type="button"
              onClick={() => removeConversation(chat.id)}
              disabled={isConversationAction}
              className="text-textSecondary hover:text-red-400 transition p-1 ml-2 flex-shrink-0"
              title="Delete conversation"
            >
              <Trash2 size={15} />
            </button>

          </div>

        ))

      )}

    </div>

  </div>

  {/* ================= Main Chat ================= */}

  <div className="flex-1 flex flex-col px-8">

    {/* Header */}

    <div className="flex items-center justify-between py-6 border-b border-border">

      <div className="flex items-center gap-3">

        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">

          <MessageSquare className="w-6 h-6 text-background" />

        </div>

        <div>

          <h1 className="text-2xl font-bold">
            AI Chat
          </h1>

          <p className="text-textSecondary text-sm">
            CivicSync AI is online
          </p>

        </div>

      </div>

      <div className="flex items-center gap-3">

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => removeConversation(conversationId)}
            disabled={!conversationId || isConversationAction}
            title={conversationId ? "Delete this conversation" : "Start or select a chat first"}
            className="flex items-center gap-2 text-red-500 border border-red-500/30 rounded-xl px-3 py-2 hover:bg-red-500/10 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={15} />
            {isConversationAction ? "Deleting..." : "Delete Chat"}
          </button>

          <button
            type="button"
            onClick={handleClearHistory}
            disabled={!conversationId || isConversationAction}
            title={conversationId ? "Clear this conversation" : "Start or select a chat first"}
            className="flex items-center gap-2 text-textSecondary border border-border rounded-xl px-3 py-2 hover:bg-white/5 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={15} />
            {isConversationAction ? "Clearing..." : "Clear Chat"}
          </button>
        </div>

        <div className="flex items-center gap-2 bg-[#171a21] border border-border rounded-xl px-3 py-2">

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
            className="bg-transparent outline-none text-sm"
          >

            {LANGUAGES.map((lang) => (

              <option
                key={lang.code}
                value={lang.code}
                className="bg-[#171a21]"
              >
                {lang.name}
              </option>

            ))}

          </select>

        </div>

      </div>

    </div>

    {conversationActionError && (
      <p className="mt-3 text-sm text-red-400" role="alert">
        {conversationActionError}
      </p>
    )}

    {connectionError && (
      <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
        {connectionError}
      </p>
    )}

    {/* Messages */}

    <div className="flex-1 overflow-y-auto py-6 space-y-5">
    {/* =======================
PART 4 / 6
Continue immediately after Part 3
======================= */}

      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            "flex gap-3",
            msg.type === "user"
              ? "justify-end"
              : "justify-start"
          )}
        >
          {msg.type === "bot" && (
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-5 h-5 text-background" />
            </div>
          )}

          <div
            onClick={() =>
              msg.type === "user"
                ? setInput(msg.text)
                : null
            }
            className={clsx(
              "max-w-[75%] rounded-2xl p-4 text-sm transition-all",
              msg.type === "user"
                ? "bg-accent text-background rounded-tr-sm cursor-pointer hover:bg-accentHover"
                : "bg-[#171a21] border border-border rounded-tl-sm text-white"
            )}
          >
            <div className="whitespace-pre-wrap">
              {msg.text}
            </div>

            {msg.type === "bot" &&
              msg.sources &&
              msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/40">

                  <div className="text-[10px] uppercase tracking-widest text-accent mb-2">
                    Sources
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((src, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-full text-[11px] bg-accent/10 border border-accent/20 text-accent"
                      >
                        {src}
                      </span>
                    ))}
                  </div>

                </div>
              )}

            {msg.type === "bot" && (
              <div className="mt-3 pt-3 border-t border-border/40 flex justify-end">

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak(msg.id, msg.text);
                  }}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition font-medium",
                    activeSpeakingId === msg.id
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "bg-[#202430] hover:bg-accent/10 text-textSecondary hover:text-accent border border-border"
                  )}
                >
                  {activeSpeakingId === msg.id ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      Listen
                    </>
                  )}
                </button>

              </div>
            )}
          </div>

          {msg.type === "user" && (
            <div className="w-9 h-9 rounded-full bg-[#252936] flex items-center justify-center flex-shrink-0 mt-1">
              <User className="w-4 h-4 text-textSecondary" />
            </div>
          )}
        </motion.div>
      ))}

      {isTyping && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3"
        >
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
            <Bot className="w-5 h-5 text-background" />
          </div>

          <div className="bg-[#171a21] border border-border rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            <span className="text-sm text-textSecondary">
              CivicSync AI is thinking...
            </span>
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} />

    </div>

    {messages.length === 1 && (
      <div className="flex flex-wrap gap-2 mb-5">

        {suggestions.map((item, index) => (

          <button
            key={index}
            onClick={() => setInput(item)}
            className="px-3 py-2 rounded-full text-xs bg-[#171a21] border border-border hover:border-accent transition"
          >
            {item}
          </button>

        ))}

      </div>
    )}
    {/* =======================
PART 5 / 6
Continue immediately after Part 4
======================= */}

    {/* Input Area */}

    <div className="border-t border-border pt-4">

      <div className="relative flex items-center">

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          placeholder={
            isListening
              ? "Listening..."
              : "Ask anything about laws, bills, schemes..."
          }
          className={clsx(
            "w-full bg-[#171a21] border rounded-2xl py-4 pl-6 pr-28 text-sm text-white outline-none transition",
            isListening
              ? "border-red-500 ring-1 ring-red-500/40"
              : "border-border focus:border-accent"
          )}
        />

        {/* Voice */}

        <button
          onClick={toggleListening}
          className={clsx(
            "absolute right-14 w-10 h-10 rounded-xl flex items-center justify-center transition",
            isListening
              ? "bg-red-500 text-white animate-pulse"
              : "hover:bg-[#202430] text-textSecondary"
          )}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Send */}

        <button
          onClick={handleSend}
          disabled={
            !input.trim() ||
            isTyping ||
            isListening
          }
          className="absolute right-2 w-10 h-10 rounded-xl bg-accent text-background flex items-center justify-center disabled:opacity-50 hover:bg-accentHover transition"
        >
          <Send className="w-5 h-5" />
        </button>

      </div>

      <p className="text-xs text-center text-textSecondary mt-2">
        AI responses are informational. Verify with official government
        sources before making legal or financial decisions.
      </p>

    </div>

  </div>

</div>
  );
}
