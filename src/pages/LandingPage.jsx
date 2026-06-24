import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  Building2, Upload, MessageSquare, FileText, Settings, Activity, 
  ShieldAlert, User, CheckCircle2, ChevronRight, BarChart3, TrendingUp, Sparkles, MapPin, Search
} from "lucide-react";
import clsx from "clsx";
import { AlertCircle, Clock } from "lucide-react"; // Implicitly kept these from before

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-accent" />
            <span className="text-xl font-bold tracking-tight">CivicSync</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#platform" className="text-sm text-white font-medium border-b-2 border-accent pb-1">Platform</a>
            <Link to="/fraud" className="text-sm text-textSecondary hover:text-white transition-colors">Transparency</Link>
            <Link to="/gps" className="text-sm text-textSecondary hover:text-white transition-colors">Governance</Link>
            <Link to="/townhall" className="text-sm text-textSecondary hover:text-white transition-colors">Community</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block text-sm font-semibold text-textSecondary hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="px-6 py-2.5 rounded-lg bg-accent text-[#0a0a0f] text-sm font-semibold hover:bg-accentHover transition-colors shadow-glow-accent">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 flex flex-col items-center text-center px-6 overflow-hidden min-h-[80vh]">
        <div className="absolute inset-0 bg-dot-pattern opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/50 to-[#0a0a0f] z-0"></div>
        
        {/* Floating Animated Background Elements */}
        <motion.div 
          animate={{ y: [0, -30, 0], opacity: [0.3, 0.6, 0.3] }} 
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl z-0 pointer-events-none"
        />
        <motion.div 
          animate={{ y: [0, 30, 0], opacity: [0.2, 0.5, 0.2] }} 
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl z-0 pointer-events-none"
        />

        <div className="relative z-10 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 mb-8 backdrop-blur-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold text-accent tracking-widest uppercase">New Gen Civic Intelligence</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight relative"
          >
            Understand Any <span className="text-accent relative inline-block">
              Law
              <motion.span 
                initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 0.8, duration: 0.8 }}
                className="absolute -bottom-2 left-0 h-1.5 bg-accent/50 rounded-full blur-[2px]"
              />
            </span> in Seconds
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg text-textSecondary max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            AI-powered civic intelligence that explains government bills, policies, and schemes in plain language. Bridge the gap between legal complexity and citizen action.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <button onClick={() => navigate("/upload")} className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-accent text-[#0a0a0f] font-semibold flex items-center justify-center gap-2 hover:bg-accentHover transition-colors shadow-glow-accent group">
              <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
              Upload Bill
            </button>
            <button onClick={() => navigate("/dashboard")} className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-card border border-border text-white font-semibold flex items-center justify-center gap-2 hover:bg-cardHover transition-colors">
              <MessageSquare className="w-5 h-5" />
              Ask CivicSync AI
            </button>
          </motion.div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section id="platform" className="max-w-7xl mx-auto px-6 py-12 space-y-6 relative z-10">
        
        {/* Row 1: Bill Simplifier & Fraud Watch */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:col-span-2 p-8 rounded-3xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-bold">AI Bill Simplifier</h2>
            </div>
            <p className="text-textSecondary mb-8 max-w-md">Transform thousand-page legislative documents into actionable insights instantly.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#171a21]">
                <FileText className="w-5 h-5 text-accent mb-3" />
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-xs text-textSecondary">The core purpose of the bill in 3 sentences.</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#171a21]">
                <Settings className="w-5 h-5 text-textSecondary mb-3" />
                <h3 className="font-semibold mb-2">Key Changes</h3>
                <p className="text-xs text-textSecondary">What specifically shifts from the previous laws.</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#171a21]">
                <Activity className="w-5 h-5 text-success mb-3" />
                <h3 className="font-semibold mb-2">Impact</h3>
                <p className="text-xs text-textSecondary">Predicted environmental and economic outcomes.</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="p-8 rounded-3xl bg-card border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <ShieldAlert className="w-6 h-6 text-danger" />
                <h2 className="text-2xl font-bold">Fraud Watch</h2>
              </div>
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-textSecondary">RISK PROBABILITY</span>
                  <span className="font-bold text-danger">84.2%</span>
                </div>
                <div className="h-2 w-full bg-[#171a21] rounded-full overflow-hidden">
                  <div className="h-full bg-danger w-[84.2%]"></div>
                </div>
              </div>
              <p className="text-sm text-textSecondary">AI scanning of public spending data to detect anomalies and fraudulent procurement patterns.</p>
            </div>
            <button className="text-accent font-semibold text-sm flex items-center gap-2 mt-6 group">
              View Heatmap <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>

        {/* Row 2: How Does This Affect Me */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-8 rounded-3xl bg-card border border-border flex flex-col lg:flex-row gap-12">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-4">How Does This Affect Me?</h2>
            <p className="text-textSecondary mb-8 max-w-md">Personalize legislative impact based on your unique profile. AI maps complex tax codes and subsidies to your life.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="text-xs text-textSecondary mb-2 block uppercase tracking-wider">Profession</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                  <input type="text" placeholder="e.g., Software Developer" className="w-full bg-[#171a21] border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-accent" />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs text-textSecondary mb-2 block uppercase tracking-wider">Annual Income</label>
                <input type="text" placeholder="e.g., $80,000" className="w-full bg-[#171a21] border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent" />
              </div>
            </div>
            <button className="px-6 py-3 rounded-xl bg-accent text-[#0a0a0f] font-semibold text-sm hover:bg-accentHover transition-colors">
              Analyze My Profile
            </button>
          </div>
          <div className="flex-1 space-y-4">
            <div className="p-5 rounded-2xl bg-[#171a21] border border-border">
              <div className="flex gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <h4 className="font-semibold">Tax Saving Opportunity</h4>
              </div>
              <p className="text-sm text-textSecondary ml-8">New Section 42-B allows you to deduct up to $2,500 for home office equipment based on your current profession.</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#171a21] border border-border">
              <div className="flex gap-3 mb-2">
                <Building2 className="w-5 h-5 text-success" />
                <h4 className="font-semibold">Professional Eligibility</h4>
              </div>
              <p className="text-sm text-textSecondary ml-8">You qualify for the "Tech Hub Grant" under the Digital Infrastructure Bill 2024.</p>
            </div>
          </div>
        </motion.div>

        {/* Row 3: Ask CivicSync & Sentiment Analyzer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-8 rounded-3xl bg-card border border-border flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-accent" />
                <h2 className="text-2xl font-bold">Ask CivicSync</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-md bg-[#171a21] text-textSecondary border border-border">Response in 2s</span>
            </div>
            
            <div className="flex-1 space-y-4 mb-6">
              <div className="flex justify-end">
                <div className="bg-[#171a21] border border-border p-4 rounded-2xl rounded-tr-sm max-w-[80%]">
                  <p className="text-sm">Does the new Carbon Tax apply to small businesses?</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-[#24283b]/50 border border-[#24283b] p-4 rounded-2xl rounded-tl-sm max-w-[80%]">
                  <p className="text-sm text-textSecondary leading-relaxed">No. Under Clause 14.2, businesses with annual revenues below $1 million or CO2e neutrality are exempt from the tax levy until 2028.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <input type="text" placeholder="Type your question..." className="w-full bg-[#171a21] border border-border rounded-full py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-accent" />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-accent text-[#0a0a0f] flex items-center justify-center hover:bg-accentHover transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="p-8 rounded-3xl bg-card border border-border flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
              <BarChart3 className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-bold">Sentiment Analyzer</h2>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-xs text-textSecondary mb-2 font-semibold tracking-wider">
                <span>PUBLIC SUPPORT</span>
                <span className="text-success">72% POSITIVE</span>
              </div>
              <div className="h-1.5 w-full bg-[#171a21] rounded-full overflow-hidden flex">
                <div className="h-full bg-accent w-[72%]"></div>
                <div className="h-full bg-border w-[28%]"></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              <div>
                <p className="text-xl font-bold mb-1">4.2k</p>
                <p className="text-xs text-textSecondary uppercase tracking-wider">COMMENTS</p>
              </div>
              <div>
                <p className="text-xl font-bold mb-1">1.8k</p>
                <p className="text-xs text-textSecondary uppercase tracking-wider">SHARES</p>
              </div>
              <div>
                <p className="text-xl font-bold text-danger mb-1">124</p>
                <p className="text-xs text-textSecondary uppercase tracking-wider">OBJECTIONS</p>
              </div>
            </div>
            
            <div className="flex-1 rounded-xl bg-gradient-to-t from-[#1d4ed8]/10 to-transparent border border-border flex items-end justify-center p-4">
               {/* Decorative Bar Chart Placeholder */}
               <div className="flex items-end gap-1 w-full h-24 opacity-50 justify-between">
                  {[40, 25, 45, 30, 60, 40, 80, 50, 70, 90, 65, 85, 40, 50, 20, 60].map((h, i) => (
                    <div key={i} className={`w-full rounded-t-sm ${i > 8 ? 'bg-danger' : 'bg-secondary'}`} style={{ height: `${h}%` }}></div>
                  ))}
               </div>
            </div>
          </motion.div>
        </div>

        {/* Row 4: Civic GPS Roadmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-8 rounded-3xl bg-card border border-border relative overflow-hidden">
          <div className="flex justify-between items-start mb-10 relative z-10">
            <div>
              <h2 className="text-2xl font-bold mb-2">Civic GPS Roadmap</h2>
              <p className="text-textSecondary">Navigating your benefits and upcoming legislative milestones.</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-success/20 text-success border border-success/30">Active</span>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-accent/20 text-accent border border-accent/30">Upcoming</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
             {/* Progress Line */}
             <div className="hidden md:block absolute top-6 left-10 right-10 h-0.5 bg-border z-0">
                <div className="h-full bg-accent w-1/2"></div>
             </div>
             
             <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-accent text-[#0a0a0f] flex items-center justify-center mb-6 mx-auto md:mx-0 shadow-glow-accent">
                   <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold mb-2">Benefit Claimed</h4>
                <p className="text-sm text-textSecondary">Digital Literacy Subsidy - $500 applied to your account.</p>
             </div>
             <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-card border-2 border-accent text-accent flex items-center justify-center mb-6 mx-auto md:mx-0 shadow-glow">
                   <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold mb-2">Action Required</h4>
                <p className="text-sm text-textSecondary">Submit utility bill for 2024 Green Energy Rebate eligibility.</p>
             </div>
             <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-[#171a21] border border-border text-textMuted flex items-center justify-center mb-6 mx-auto md:mx-0">
                   <Clock className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-textSecondary mb-2">Upcoming Bill</h4>
                <p className="text-sm text-textMuted">Infrastructure Act voting starts in 14 days. Likely 54% impact.</p>
             </div>
          </div>
        </motion.div>

        {/* Row 5: Impact Simulator */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-8 rounded-3xl bg-card border border-border flex flex-col md:flex-row gap-8 items-center">
           <div className="md:w-1/3">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-accent" />
                <h2 className="text-2xl font-bold">Impact Simulator</h2>
              </div>
              <p className="text-textSecondary mb-8 text-sm">Adjust parameters to see how potential policy changes affect national metrics.</p>
              
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-xs mb-2">
                       <span>Corporate Tax Rate</span>
                       <span>25%</span>
                    </div>
                    <div className="h-1 w-full bg-border rounded-full"><div className="h-full w-1/2 bg-accent rounded-full"></div></div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs mb-2">
                       <span>Green Subsidy Budget</span>
                       <span>$2.4B</span>
                    </div>
                    <div className="h-1 w-full bg-border rounded-full"><div className="h-full w-3/4 bg-accent rounded-full"></div></div>
                 </div>
              </div>
           </div>
           
           <div className="md:w-2/3 grid grid-cols-2 gap-4 w-full">
              <div className="p-6 rounded-2xl bg-[#171a21] border border-border">
                 <div className="flex justify-between items-center mb-6">
                    <span className="text-sm text-textSecondary font-semibold">GDP Growth</span>
                    <span className="text-success font-bold">+1.2%</span>
                 </div>
                 <div className="flex items-end gap-2 h-20 opacity-80 justify-center">
                    <div className="w-8 bg-accent/40 rounded-sm h-1/3"></div>
                    <div className="w-8 bg-accent/60 rounded-sm h-1/2"></div>
                    <div className="w-8 bg-accent/80 rounded-sm h-3/4"></div>
                    <div className="w-8 bg-accent rounded-sm h-full shadow-glow"></div>
                 </div>
              </div>
              <div className="p-6 rounded-2xl bg-[#171a21] border border-border flex flex-col justify-between">
                 <div className="flex justify-between items-center mb-6">
                    <span className="text-sm text-textSecondary font-semibold">Employment</span>
                    <span className="text-success font-bold">+240k</span>
                 </div>
                 <div className="flex-1 flex items-center justify-center">
                    <User className="w-12 h-12 text-textMuted" />
                 </div>
              </div>
           </div>
        </motion.div>

      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-2">
             <Building2 className="w-5 h-5 text-accent" />
             <span className="font-bold">CivicSync AI</span>
             <span className="text-xs text-textSecondary ml-4">© 2024 CivicSync AI. Secure Governance Systems. Built for citizens and government.</span>
           </div>
           <div className="flex items-center gap-6 text-xs text-textSecondary font-medium">
             <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
             <a href="#" className="hover:text-white transition-colors">AI Ethics</a>
           </div>
           <div className="w-10 h-10 rounded-full bg-accent text-[#0a0a0f] flex items-center justify-center cursor-pointer shadow-glow-accent">
              <Building2 className="w-4 h-4" />
           </div>
        </div>
      </footer>
    </div>
  );
}