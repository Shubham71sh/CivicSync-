import { motion } from "framer-motion";
import { FileText, ShieldAlert, BarChart3, TrendingUp } from "lucide-react";

const features = [
  {
    icon: <FileText className="w-6 h-6 text-accent" />,
    title: "AI Bill Simplifier",
    description: "Complex legislation translated into simple, easy-to-understand summaries. Know exactly what you're voting for."
  },
  {
    icon: <ShieldAlert className="w-6 h-6 text-secondary" />,
    title: "Fraud Watch",
    description: "Real-time alerts for suspicious civic activities, misallocated funds, and local government anomalies."
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-accent" />,
    title: "Sentiment Analyzer",
    description: "Understand public opinion with AI-driven analysis of local debates, town halls, and policy discussions."
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-secondary" />,
    title: "Impact Simulator",
    description: "Visualize the long-term economic and social effects of proposed bills before they become law."
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            Powerful Features for <span className="gradient-text">Smart Citizens</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-textSecondary text-lg max-w-2xl mx-auto"
          >
            Everything you need to stay informed, track impact, and make your voice heard.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-white/5 hover:border-white/10 transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {feature.icon}
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/5 group-hover:border-white/20 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-textSecondary leading-relaxed text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
