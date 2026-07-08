import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const quickActions = [
  { text: "Explain Report", reply: "Your report summarizes ₹2.45L in losses. The damage is assessed at 82% overall severity which exceeds the 40% threshold, qualifying you for maximum grants." },
  { text: "Eligible Schemes", reply: "You are currently eligible for 3 schemes: State Flood Relief (₹10,000), House Repair Grant (₹50,000), and the Electricity Bill Waiver (50%)." },
  { text: "Missing Documents", reply: "You are missing: 1) Bank Passbook copy (Front Page) and 2) local officer damage certificate. Please upload them in the Document Vault to release payment." },
  { text: "Nearest Relief Camp", reply: "The nearest active shelter is the Patna Central High School Camp located 0.8 km away (+91 612 223412). Currently has capacity for 120 people." },
  { text: "Track Application", reply: "Your application is currently at 'Officer Assigned'. Block Officer Rajesh Kumar is scheduled to visit your site on 8 July for physical inspection." }
];

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: "Hello! I am your CivicSync AI Disaster Relief Assistant. I have analyzed your uploaded images and municipal details. How can I help you today?" }
  ]);
  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = (text, customReply = null) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const userMsg = { id: Date.now(), sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");

    // 2. Simulate AI Typing response
    setTimeout(() => {
      let replyText = "I'm analyzing that query in connection with your municipal file. Let me check the local rules engine...";
      
      if (customReply) {
        replyText = customReply;
      } else {
        // Simple word matching logic for custom text input
        const query = text.toLowerCase();
        if (query.includes("flood") || query.includes("damage")) {
          replyText = "Based on the uploaded evidence, you qualify for the State Flood Relief Scheme and House Repair Grant. Estimated government assistance is ₹60,000.";
        } else if (query.includes("scheme") || query.includes("eligible")) {
          replyText = "You match qualifications for the State Flood Relief Scheme, House Repair Grant, and Electricity Bill Waiver. Estimated assistance is ₹60,000.";
        } else if (query.includes("document") || query.includes("missing")) {
          replyText = "Your profile is missing a Bank Passbook copy. Please upload it in the Document Verification block to proceed.";
        } else if (query.includes("camp") || query.includes("shelter") || query.includes("nearest")) {
          replyText = "Patna Central High School shelter is active 0.8 km away from you. Contact helpline: +91 612 223412.";
        }
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: "ai", text: replyText }]);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-55 flex flex-col items-end">
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/20 cursor-pointer ${
          isOpen ? "bg-slate-900" : "bg-blue-600"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-blue-600 animate-pulse" />
          </div>
        )}
      </motion.button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-4 w-90 sm:w-96 h-[500px] bg-white border border-slate-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-none">CivicSync Relief AI</h4>
                  <span className="text-[9px] text-emerald-400 font-medium mt-1 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online Agent
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
              {messages.map((msg) => {
                const isAI = msg.sender === "ai";
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isAI ? "justify-start" : "justify-end"}`}>
                    {isAI && (
                      <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 text-[10px] font-bold">
                        AI
                      </div>
                    )}
                    <div className={`p-3 rounded-2xl text-xs max-w-[75%] leading-relaxed ${
                      isAI 
                        ? "bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-sm" 
                        : "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/10"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="px-4 py-2 bg-white border-t border-slate-50 flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(action.text, action.reply)}
                  className="px-2.5 py-1 rounded-full border border-blue-100 bg-blue-50 hover:bg-blue-100/50 text-blue-700 text-[10px] font-bold whitespace-nowrap transition-colors"
                >
                  {action.text}
                </button>
              ))}
            </div>

            {/* Input Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputVal);
              }}
              className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask about schemes, missing docs..."
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-200 transition-all"
              />
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 transition-colors disabled:bg-slate-100 disabled:text-slate-400"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
