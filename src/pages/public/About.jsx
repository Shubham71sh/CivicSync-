import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Building2, Users, Shield, Globe, ArrowRight, Sparkles } from "lucide-react";

const values = [
  { icon: Shield, title: "Privacy First", desc: "Every piece of civic data is encrypted. We never sell your information." },
  { icon: Globe, title: "Open Governance", desc: "We believe every citizen deserves to understand the laws that govern them." },
  { icon: Users, title: "Community Driven", desc: "Built by engineers and civic activists who believe in democratic transparency." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Hero */}
      <section className="pt-40 pb-20 text-center px-6 relative">
        <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none"></div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold text-accent tracking-widest uppercase">Our Mission</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Built for <span className="text-accent">Citizens</span>,<br />Powered by <span className="text-accent">AI</span>
          </h1>
          <p className="text-lg text-textSecondary max-w-2xl mx-auto leading-relaxed">
            CivicSync was founded on a simple belief: democracy works better when citizens understand the laws that govern them. We're building the infrastructure for a more informed and engaged society.
          </p>
        </motion.div>
      </section>

      {/* Mission Cards */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {values.map((val, i) => {
            const Icon = val.icon;
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-[#12141d] border border-border text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <Icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">{val.title}</h3>
                <p className="text-sm text-textSecondary leading-relaxed">{val.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Story */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="p-10 rounded-3xl bg-[#12141d] border border-border mb-20"
        >
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-bold">Our Story</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <p className="text-textSecondary leading-relaxed mb-4">
                CivicSync started as a hackathon project in 2024, born from frustration with the inaccessibility of government legislation. Our founders — developers and policy wonks alike — were tired of needing a law degree to understand tax bills that affected everyday life.
              </p>
              <p className="text-textSecondary leading-relaxed">
                We built the first prototype in 48 hours. The reaction was overwhelming. Citizens wanted a tool that could decode the language of government and connect policy to personal impact.
              </p>
            </div>
            <div>
              <p className="text-textSecondary leading-relaxed mb-4">
                Today, CivicSync serves over 50,000 citizens across 12 districts, processing over 1,200 bills through our AI engine daily. We're expanding to include more jurisdictions and government portals every week.
              </p>
              <p className="text-textSecondary leading-relaxed">
                Our roadmap includes real-time legislative tracking, AI-powered petition drafting, and deep integrations with government APIs — all designed to close the gap between citizens and the systems that serve them.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {[
            { value: "50K+", label: "Active Citizens" },
            { value: "1,284", label: "Bills Analyzed Daily" },
            { value: "12", label: "Districts Covered" },
            { value: "$4.2M", label: "Benefits Uncovered" },
          ].map((stat, i) => (
            <div key={i} className="p-6 rounded-2xl bg-[#12141d] border border-border text-center">
              <p className="text-3xl font-bold text-accent mb-2">{stat.value}</p>
              <p className="text-sm text-textSecondary uppercase tracking-wider font-semibold">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Join the Movement</h2>
          <p className="text-textSecondary mb-8 max-w-lg mx-auto">
            Whether you're a first-time voter or a seasoned policy analyst, CivicSync is for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-[#0a0a0f] font-bold hover:bg-accentHover transition-colors shadow-glow-accent">
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-card border border-border text-white font-semibold hover:bg-cardHover transition-colors">
              Contact Us
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
