import { getProfile, updateProfile } from "../services/profileAPI";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, MapPin, Briefcase, Calendar, Mail, Phone, ShieldCheck, Edit3 } from "lucide-react";


export default function MyProfile() {
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    dob: "",
    profession: "",
    income: "",
  });
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setProfile(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, []);
  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };
  const handleSave = async () => {
    try {
      // Save updated profile
      await updateProfile(profile);

      // Fetch the latest profile from backend
      const res = await getProfile();
      setProfile(res.data);

      alert("Profile updated successfully!");

      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert("Failed to update profile");
    }
  };
  console.log("isEditing:", isEditing);



  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">My Profile</h1>
          <p className="text-sm text-textSecondary">Manage your civic identity and AI parameters.</p>
        </div>
        <button
          onClick={() => {
            console.log("Button clicked");

            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white"
        >
          {isEditing ? "Save Changes" : "Edit Profile"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-3xl bg-[#171a21] border border-border flex flex-col items-center text-center">
          <div className="relative w-32 h-32 rounded-full border-4 border-[#12141d] overflow-hidden mb-4 shadow-glow">
            <img src="https://i.pravatar.cc/150?img=11" alt="John Doe" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-accent/20"></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{profile.name}</h2>
          <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 border border-success/20 px-3 py-1 rounded-full mb-6 font-semibold uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Citizen
          </div>

          <div className="w-full space-y-3 mt-4 text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#12141d] border border-border">
              <span className="text-textSecondary flex items-center gap-2"><Mail className="w-4 h-4" /> Email</span>
              <span className="text-white font-medium">{profile.email}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#12141d] border border-border">
              <span className="text-textSecondary flex items-center gap-2"><Phone className="w-4 h-4" /> Phone</span>
              <span className="text-white font-medium">{profile.phone}</span>
            </div>
          </div>
        </motion.div>

        {/* Civic Parameters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <h3 className="text-lg font-bold text-white mb-6">AI Impact Parameters</h3>
            <p className="text-sm text-textSecondary mb-6">These details help CivicSync AI personalize bill impacts, calculate tax breaks, and recommend schemes.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-textSecondary mb-2 block uppercase tracking-wider font-semibold">Location (State/District)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                  <input
                    name="location"
                    type="text"
                    value={profile.location}
                    onChange={(e) => {
                      console.log("Typing:", e.target.value);
                      handleChange(e);
                    }}
                    disabled={!isEditing}
                    className="w-full border rounded-xl py-3 pl-10 pr-4"
                    style={{
                      backgroundColor: isEditing ? "white" : "#0e0e0e",
                      color: "white",
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-textSecondary mb-2 block uppercase tracking-wider font-semibold">Age / DOB</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                  <input
                    name="dob"
                    type="date"
                    value={profile.dob}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-[#12141d] border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-70"
                  />                </div>
              </div>
              <div>
                <label className="text-xs text-textSecondary mb-2 block uppercase tracking-wider font-semibold">Profession / Industry</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                  <input
                    name="profession"
                    type="text"
                    value={profile.profession}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-[#12141d] border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-70"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-textSecondary mb-2 block uppercase tracking-wider font-semibold">Annual Income Range</label>
                <select
                  name="income"
                  value={profile.income}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-[#12141d] border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-70">
                  <option>$50,000 - $100,000</option>
                  <option>$100,000 - $150,000</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <h3 className="text-lg font-bold text-white mb-6">Connected Government IDs</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#12141d] border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">National ID / SSN</h4>
                    <p className="text-xs text-textSecondary">Verified on Oct 2023</p>
                  </div>
                </div>
                <button className="text-xs font-semibold text-textSecondary hover:text-white">Unlink</button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#12141d] border border-border border-dashed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
                    <User className="w-5 h-5 text-textMuted" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Tax Payer Portal</h4>
                    <p className="text-xs text-textSecondary">Not connected</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent font-semibold text-xs border border-accent/20">Connect</button>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
