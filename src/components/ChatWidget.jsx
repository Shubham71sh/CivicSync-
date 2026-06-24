import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

const INITIAL_MESSAGE = {
  id: 1,
  type: "bot",
  text: "Hi there! I'm CivicSync AI. You can ask me about local laws, your eligibility for subsidies, or any pending bills."
};

const DUMMY_RESPONSES = [
  "Based on your profile, you're eligible for the Solar Rebate. Would you like me to start the application?",
  "The new Zoning Law (Bill #4290) has a 94% match with your interests. It primarily affects tech businesses in the Central District.",
  "I've added the Townhall Meeting to your calendar. Is there anything else you need?",
  "Your corruption risk alert has been forwarded to the local oversight committee securely."
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), type: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botMsg = { 
        id: Date.now() + 1, 
        type: "bot", 
        text: DUMMY_RESPONSES[Math.floor(Math.random() * DUMMY_RESPONSES.length)] 
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
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
              <button onClick={() => setIsOpen(false)} className="text-textSecondary hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-[#0a0a0f]">
              {messages.map((msg) => (
                <div key={msg.id} className={clsx("flex", msg.type === "user" ? "justify-end" : "justify-start")}>
                  <div className={clsx(
                    "max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed",
                    msg.type === "user" 
                      ? "bg-accent text-background rounded-tr-sm" 
                      : "bg-[#171a21] border border-border text-white rounded-tl-sm"
                  )}>
                    {msg.text}
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
                  placeholder="Ask a civic question..."
                  className="w-full bg-[#0a0a0f] border border-border rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-accent"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
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
