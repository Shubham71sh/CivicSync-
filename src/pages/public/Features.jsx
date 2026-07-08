import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  FileText, MessageSquare, ShieldAlert, MapPin, TrendingUp, BarChart3, 
  CheckCircle2, GitCompare, Users, ArrowRight, Sparkles, Zap
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "AI Bill Simplifier",
    description: "Transform thousand-page legislative documents into plain-language summaries with key impacts highlighted.",
    badge: "Core Feature",
    color: "accent",
  },
  {
    icon: MessageSquare,
    title: "AI Civic Chat",
    description: "Ask any question about legislation, policies, or your eligibility for government schemes. Get answers in 2 seconds.",
    badge: "AI Powered",
    color: "accent",
  },
  {
    icon: ShieldAlert,
    title: "Fraud Watch",
    description: "AI scanning of public spending data detects anomalies and fraudulent procurement patterns in real-time.",
    badge: "Transparency",
    color: "danger",
  },
  {
    icon: MapPin,
    title: "Civic GPS",
    description: "Navigate your benefits and upcoming legislative milestones with a personalized governance roadmap.",
    badge: "Navigation",
    color: "success",
  },
  {
    icon: TrendingUp,
    title: "Impact Simulator",
    description: "Adjust policy parameters and simulate their effect on national metrics like GDP, employment, and tax revenues.",
    badge: "Analytics",
    color: "accent",
  },
  {
    icon: BarChart3,
    title: "Sentiment Analyzer",
    description: "Track public opinion on any bill with AI-analyzed social media data, objections, and community pulse.",
    badge: "Insights",
    color: "accent",
  },
  {
    icon: GitCompare,
    title: "Compare Bills",
    description: "Side-by-side comparison of multiple bills. Identify differences, similarities, and clause-level conflicts.",
    badge: "Analysis",
    color: "accent",
  },
  {
    icon: CheckCircle2,
    title: "Eligibility Checker",
    description: "Verify your eligibility across 100+ local and federal programs based on your profile automatically.",
    badge: "Government",
    color: "success",
  },
  {
    icon: Users,
    title: "Townhall Events",
    description: "Discover local civic events, public hearings, and government consultations in your district.",
    badge: "Community",
    color: "accent",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Features() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Hero */}
      <section className="pt-40 pb-20 text-center px-6 relative">
        <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none"></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold text-accent tracking-widest uppercase">Full Platform</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Everything You Need for<br /><span className="text-accent">Civic Awareness</span>
          </h1>
          <p className="text-lg text-textSecondary max-w-2xl mx-auto mb-10 leading-relaxed">
            CivicSync bundles AI bill analysis, fraud detection, impact simulation, and personal eligibility tracking into one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="px-8 py-4 rounded-xl bg-accent text-[#0a0a0f] font-bold hover:bg-accentHover transition-colors shadow-glow-accent flex items-center gap-2 justify-center">
              Start for Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="px-8 py-4 rounded-xl bg-card border border-border text-white font-semibold hover:bg-cardHover transition-colors">
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12 pb-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                className="p-6 rounded-3xl bg-[#12141d] border border-border hover:border-white/10 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#171a21] text-textSecondary border border-border">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-sm text-textSecondary leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-20 text-center p-12 rounded-3xl bg-[#12141d] border border-border"
        >
          <Zap className="w-10 h-10 text-accent mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-textSecondary mb-8 max-w-lg mx-auto">
            All features are available on the free plan. No credit card required.
          </p>
          <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-[#0a0a0f] font-bold hover:bg-accentHover transition-colors shadow-glow-accent">
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
