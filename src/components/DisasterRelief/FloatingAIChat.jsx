import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_ACTIONS = [
  { label: "What should I do next?", reply: "Your next step is to complete the physical inspection (July 8). Ensure you are available at your property by 10 AM. Block Officer Rajesh Kumar will contact you at your registered number." },
  { label: "Why am I eligible?", reply: "You qualify because: (1) Disaster is officially declared in your area, (2) Your GPS evidence is within the declared perimeter, (3) Aadhaar is verified, (4) Your structural damage exceeds 40% threshold." },
  { label: "Track my claim", reply: "Your claim is currently at Stage 3 of 6: Officer Assigned. Rajesh Kumar has been assigned. Physical inspection is scheduled for July 8, 2025. Estimated approval in 14–21 working days." },
  { label: "Required documents", reply: "Verified: Aadhaar card, Land certificate, AI photo summary, Officer damage cert. Missing: Bank passbook front page copy. Please upload it in Document Vault to avoid payment delays." },
];

const INITIAL_MESSAGE = {
  id: 0,
  sender: "ai",
  text: "Hello! I am your CivicSync AI Relief Assistant. I have analysed your evidence and linked your profile. Ask me anything about your claim, schemes, or next steps.",
};

export default function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = (text, customReply = null) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let reply = customReply;
      if (!reply) {
        const q = text.toLowerCase();
        if (q.includes("scheme") || q.includes("eligible")) {
          reply = "You qualify for 3 schemes: State Flood Relief (₹10,000 cash), House Repair Grant (₹50,000), and Electricity Bill Waiver (50% for 6 months).";
        } else if (q.includes("document") || q.includes("missing")) {
          reply = "Only your Bank Passbook (front page) is missing. Upload it in Document Vault to unblock your disbursement.";
        } else if (q.includes("camp") || q.includes("shelter") || q.includes("hospital")) {
          reply = "Nearest active shelter: Patna Central High School (0.8 km). Hospital: PMCH (2.4 km, +91 612 230084). Both are currently operational.";
        } else if (q.includes("payment") || q.includes("money") || q.includes("amount")) {
          reply = "Your eligible total is ₹60,000 across all approved schemes. Payment will be released via direct bank transfer within 7 days of final approval.";
        } else {
          reply = "I am reviewing your case file. Based on your damage report, I recommend completing the document upload and confirming your inspection appointment for July 8.";
        }
      }

      setIsTyping(false);
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: "ai", text: reply }]);
    }, 900);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-80 sm:w-96 flex flex-col rounded-[20px] overflow-hidden border border-[rgba(255,255,255,0.08)] shadow-[0_24px_60px_rgba(0,0,0,0.5)] bg-[#11131A]"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-[#0B0B12] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[12px] bg-[#F4C95D]/10 border border-[#F4C95D]/20 flex items-center justify-center text-[#F4C95D]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-poppins leading-none">CivicSync Relief AI</h4>
                  <span className="text-[9px] text-[#22C55E] font-semibold flex items-center gap-1 mt-0.5 font-inter">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                    Active Agent
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-[10px] flex items-center justify-center text-[#A5A8B5] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[rgba(255,255,255,0.1)]">
              {messages.map((msg) => {
                const isAI = msg.sender === "ai";
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isAI ? "justify-start" : "justify-end"}`}>
                    {isAI && (
                      <div className="w-6 h-6 rounded-[8px] bg-[#F4C95D]/10 border border-[#F4C95D]/20 flex items-center justify-center text-[#F4C95D] shrink-0 text-[8px] font-bold">
                        AI
                      </div>
                    )}
                    <div
                      className={`px-3 py-2.5 rounded-[14px] text-xs leading-relaxed max-w-[76%] font-inter ${
                        isAI
                          ? "bg-[#171923] border border-[rgba(255,255,255,0.06)] text-[#A5A8B5] rounded-bl-none"
                          : "bg-[#F4C95D] text-[#0B0B12] font-semibold rounded-br-none shadow-[0_4px_12px_rgba(244,201,93,0.2)]"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-6 h-6 rounded-[8px] bg-[#F4C95D]/10 border border-[#F4C95D]/20 flex items-center justify-center text-[#F4C95D] shrink-0 text-[8px] font-bold">
                    AI
                  </div>
                  <div className="px-3 py-3 bg-[#171923] border border-[rgba(255,255,255,0.06)] rounded-[14px] rounded-bl-none flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#A5A8B5]"
                        animate={{ y: ["0%", "-60%", "0%"] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-3 py-2 border-t border-[rgba(255,255,255,0.05)] flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0 bg-[#0B0B12]/40">
              {QUICK_ACTIONS.map((qa, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(qa.label, qa.reply)}
                  className="px-2.5 py-1.5 rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[#171923] hover:border-[#F4C95D]/30 hover:bg-[#F4C95D]/5 text-[#A5A8B5] hover:text-[#F4C95D] text-[9px] font-bold whitespace-nowrap transition-all duration-200 shrink-0 font-poppins"
                >
                  {qa.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="px-3 py-3 bg-[#0B0B12] border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about schemes, docs, or claim status..."
                className="flex-1 bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[12px] px-3 py-2.5 text-xs text-white placeholder-[#A5A8B5] focus:outline-none focus:border-[#F4C95D]/40 transition-all font-inter"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-9 h-9 rounded-[12px] bg-[#F4C95D] hover:bg-[#FFD978] disabled:bg-[#171923] disabled:text-[#A5A8B5] text-[#0B0B12] flex items-center justify-center shrink-0 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative ${
          isOpen
            ? "bg-[#171923] border border-[rgba(255,255,255,0.1)]"
            : "bg-[#F4C95D] shadow-[0_0_24px_rgba(244,201,93,0.35)]"
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageSquare className="w-6 h-6 text-[#0B0B12]" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-[#0B0B12] animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
