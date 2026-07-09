import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, MessageSquare, MapPin, Send, CheckCircle2, Building2 } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: Connect to backend contact endpoint → POST /api/contact
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Hero */}
      <section className="pt-40 pb-16 text-center px-6 relative">
        <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none"></div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <h1 className="text-5xl font-bold mb-4">Get in <span className="text-accent">Touch</span></h1>
          <p className="text-lg text-textSecondary max-w-lg mx-auto">
            Have a question, feature request, or partnership inquiry? We'd love to hear from you.
          </p>
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          
          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="p-6 rounded-2xl bg-[#12141d] border border-border">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-bold text-white mb-1">CivicSync AI</h3>
              <p className="text-sm text-textSecondary">Civic Intelligence Platform</p>
            </div>

            {[
              { icon: Mail, title: "Email Us", value: "hello@civicsync.ai" },
              { icon: MessageSquare, title: "Live Chat", value: "Available in the dashboard" },
              { icon: MapPin, title: "Location", value: "Central District, India" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="p-5 rounded-2xl bg-[#12141d] border border-border flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm mb-0.5">{item.title}</h4>
                    <p className="text-sm text-textSecondary">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="p-10 rounded-3xl bg-[#12141d] border border-border text-center h-full flex flex-col items-center justify-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
                <p className="text-textSecondary">We'll get back to you within 24 hours.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 rounded-3xl bg-[#12141d] border border-border space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-textSecondary uppercase tracking-widest font-semibold block mb-2">Name</label>
                    <input 
                      required name="name" type="text" value={formData.name} onChange={handleChange}
                      placeholder="John Doe" 
                      className="w-full bg-[#171a21] border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-textSecondary uppercase tracking-widest font-semibold block mb-2">Email</label>
                    <input 
                      required name="email" type="email" value={formData.email} onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full bg-[#171a21] border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-widest font-semibold block mb-2">Subject</label>
                  <input 
                    required name="subject" type="text" value={formData.subject} onChange={handleChange}
                    placeholder="How can we help?"
                    className="w-full bg-[#171a21] border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-widest font-semibold block mb-2">Message</label>
                  <textarea 
                    required name="message" value={formData.message} onChange={handleChange}
                    rows={5} placeholder="Tell us more..."
                    className="w-full bg-[#171a21] border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-colors text-sm resize-none"
                  />
                </div>

                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-accent text-[#0a0a0f] font-bold hover:bg-accentHover transition-colors shadow-glow-accent flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? "Sending..." : <><Send className="w-4 h-4" /> Send Message</>}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
