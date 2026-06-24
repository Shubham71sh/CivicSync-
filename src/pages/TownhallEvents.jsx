import { motion } from "framer-motion";
import { Users, MapPin, Calendar, Clock, ArrowRight, Video, Search } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

const EVENTS = [
  {
    id: 1,
    title: "City Infrastructure Planning 2025",
    type: "In-Person",
    location: "Central District Council Hall",
    date: "Oct 24, 2024",
    time: "10:00 AM - 12:30 PM",
    attendees: 142,
    status: "upcoming"
  },
  {
    id: 2,
    title: "Digital Subsidies Q&A Session",
    type: "Virtual",
    location: "CivicSync Live Stream",
    date: "Oct 26, 2024",
    time: "2:00 PM - 3:30 PM",
    attendees: 350,
    status: "upcoming"
  },
  {
    id: 3,
    title: "Zoning Law Amendments Discussion",
    type: "Hybrid",
    location: "North Wing Auditorium / Online",
    date: "Nov 02, 2024",
    time: "9:00 AM - 11:00 AM",
    attendees: 89,
    status: "upcoming"
  }
];

export default function TownhallEvents() {
  const [registered, setRegistered] = useState([]);

  const handleRegister = (id) => {
    if (!registered.includes(id)) {
      setRegistered([...registered, id]);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Community Townhall</h1>
          <p className="text-sm text-textSecondary">Engage with local leaders and participate in civic discussions.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input 
              type="text" 
              placeholder="Search events..." 
              className="bg-[#12141d] border border-border rounded-lg py-2 pl-10 pr-4 text-sm w-full lg:w-64 focus:outline-none focus:border-accent text-white"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4 mb-6">
            <button className="px-4 py-2 rounded-lg bg-accent text-[#0a0a0f] font-semibold text-sm shadow-glow-accent">Upcoming</button>
            <button className="px-4 py-2 rounded-lg bg-[#171a21] border border-border text-textSecondary font-semibold text-sm hover:text-white transition-colors">Past Events</button>
            <button className="px-4 py-2 rounded-lg bg-[#171a21] border border-border text-textSecondary font-semibold text-sm hover:text-white transition-colors">My Registrations</button>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
            {EVENTS.map((evt) => {
              const isRegistered = registered.includes(evt.id);
              return (
                <motion.div key={evt.id} variants={itemVariants} className="p-6 rounded-3xl bg-[#171a21] border border-border hover:border-white/10 transition-colors group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    <div className="flex-1">
                      <div className="flex gap-2 mb-3">
                        <span className={clsx(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                          evt.type === "Virtual" ? "bg-success/20 text-success" : evt.type === "In-Person" ? "bg-accent/20 text-accent" : "bg-blue-500/20 text-blue-400"
                        )}>
                          {evt.type}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{evt.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-textSecondary">
                        <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {evt.date}</div>
                        <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {evt.time}</div>
                        <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {evt.location}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-4 min-w-[140px]">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Users className="w-4 h-4 text-accent" /> {evt.attendees} Attending
                      </div>
                      <button 
                        onClick={() => handleRegister(evt.id)}
                        disabled={isRegistered}
                        className={clsx(
                          "w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2",
                          isRegistered ? "bg-white/10 text-white cursor-not-allowed" : "bg-[#2a2e3d] text-white hover:bg-accent hover:text-[#0a0a0f]"
                        )}
                      >
                        {isRegistered ? "Registered" : "Register Now"}
                        {!isRegistered && <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <h3 className="text-lg font-bold text-white mb-4">Host a Townhall</h3>
            <p className="text-sm text-textSecondary mb-6 leading-relaxed">
              Have a civic issue that needs public attention? Verified citizens can request to host a local townhall event.
            </p>
            <button className="w-full py-3 rounded-lg border border-accent text-accent font-semibold text-sm hover:bg-accent hover:text-[#0a0a0f] transition-all">
              Submit Request
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-3xl bg-card border border-border relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Watch Live Now</h3>
              <p className="text-sm text-textSecondary mb-4">Mayor's monthly address is currently live.</p>
              <button className="flex items-center gap-2 text-sm font-bold text-accent group-hover:translate-x-1 transition-transform">
                Join Stream <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}
