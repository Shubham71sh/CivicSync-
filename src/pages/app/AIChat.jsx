import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { chatQuery } from "../../services/aiService";
import { useAuth } from "../../hooks/useAuth";

const INITIAL_MESSAGE = {
  id: 1,
  type: "bot",
  text: "Hi! I'm CivicSync AI. Ask me about any legislation, your eligibility for government schemes, or how a bill affects you personally.",
};

export default function AIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = { id: Date.now(), type: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    const userInput = input;
    setInput("");
    setIsTyping(true);

    try {
      // Backend: POST /api/ai/chat
      const { response } = await chatQuery(userInput);
      setMessages((prev) => [...prev, { id: Date.now() + 1, type: "bot", text: response }]);
    } catch (err) {
      setMessages((prev) => [...prev, { id: Date.now() + 1, type: "bot", text: "Sorry, I couldn't process that. Please try again." }]);
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
      <div className="flex items-center justify-between border-b border-border pb-6 mb-6 flex-shrink-0">
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
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#171a21] text-textSecondary border border-border">Response in ~2s</span>
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
            <div className={clsx(
              "max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed",
              msg.type === "user"
                ? "bg-accent text-background rounded-tr-sm font-medium"
                : "bg-[#171a21] border border-border text-white rounded-tl-sm"
            )}>
              {msg.text}
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
            placeholder="Ask a civic question..."
            className="w-full bg-[#171a21] border border-border rounded-2xl py-4 pl-6 pr-14 text-sm text-white focus:outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
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
