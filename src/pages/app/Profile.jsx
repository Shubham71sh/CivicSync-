import { motion } from "framer-motion";
import { User, MapPin, Briefcase, Calendar, Mail, Phone, ShieldCheck, Edit3, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getProfile, updateProfile } from "../../services/profileService";
import Skeleton from "../../components/ui/Skeleton";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});

  // Backend: GET /api/profile
  useEffect(() => {
    getProfile()
      .then(({ profile }) => {
        setProfile(profile);
        setFormData(profile);
      })
      .catch((err) => console.error("[Profile] Failed to load:", err))
      .finally(() => setProfileLoading(false));
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Backend: PUT /api/profile
      await updateProfile(formData);
      setProfile(formData);
      updateUser(formData); // Update AuthContext user state
      setIsEditing(false);
    } catch (err) {
      console.error("[Profile] Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">My Profile</h1>
          <p className="text-sm text-textSecondary">Manage your civic identity and AI parameters.</p>
        </div>
        <button 
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg bg-card border border-border text-textSecondary font-semibold text-sm hover:text-white flex items-center gap-2 transition-colors disabled:opacity-70"
        >
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : isEditing ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit3 className="w-4 h-4" /> Edit Profile</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-3xl bg-[#171a21] border border-border flex flex-col items-center text-center">
          <div className="relative w-32 h-32 rounded-full border-4 border-[#12141d] overflow-hidden mb-4 shadow-glow">
            {user?.avatar 
              ? <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-accent flex items-center justify-center text-4xl font-bold text-background">{initials}</div>
            }
            <div className="absolute inset-0 bg-accent/20"></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            {user ? `${user.firstName} ${user.lastName}` : <Skeleton className="w-32 h-6" />}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 border border-success/20 px-3 py-1 rounded-full mb-6 font-semibold uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Citizen
          </div>

          <div className="w-full space-y-3 mt-4 text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#12141d] border border-border">
              <span className="text-textSecondary flex items-center gap-2"><Mail className="w-4 h-4" /> Email</span>
              <span className="text-white font-medium text-xs truncate ml-2">{user?.email || "—"}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#12141d] border border-border">
              <span className="text-textSecondary flex items-center gap-2"><Phone className="w-4 h-4" /> Phone</span>
              <span className="text-white font-medium text-xs">{profile?.phone || "—"}</span>
            </div>
          </div>
        </motion.div>

        {/* Civic Parameters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-[#171a21] border border-border">
            <h3 className="text-lg font-bold text-white mb-6">AI Impact Parameters</h3>
            <p className="text-sm text-textSecondary mb-6">These details help CivicSync AI personalize bill impacts, calculate tax breaks, and recommend schemes.</p>
            
            {profileLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="w-24 h-3" />
                    <Skeleton className="w-full h-11" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-textSecondary mb-2 block uppercase tracking-wider font-semibold">Location (State/District)</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                    <input 
                      disabled={!isEditing} 
                      type="text" 
                      name="location"
                      value={formData.location || ""}
                      onChange={handleChange}
                      className="w-full bg-[#12141d] border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-70 transition-colors" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-textSecondary mb-2 block uppercase tracking-wider font-semibold">Age / DOB</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                    <input 
                      disabled={!isEditing} 
                      type="text" 
                      name="dob"
                      value={formData.dob || ""}
                      onChange={handleChange}
                      className="w-full bg-[#12141d] border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-70 transition-colors" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-textSecondary mb-2 block uppercase tracking-wider font-semibold">Profession / Industry</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                    <input 
                      disabled={!isEditing} 
                      type="text" 
                      name="profession"
                      value={formData.profession || ""}
                      onChange={handleChange}
                      className="w-full bg-[#12141d] border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-70 transition-colors" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-textSecondary mb-2 block uppercase tracking-wider font-semibold">Annual Income Range</label>
                  <select 
                    disabled={!isEditing}
                    name="incomeRange"
                    value={formData.incomeRange || ""}
                    onChange={handleChange}
                    className="w-full bg-[#12141d] border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-70 transition-colors"
                  >
                    <option>$50,000 - $100,000</option>
                    <option>$100,000 - $150,000</option>
                    <option>$150,000 - $200,000</option>
                    <option>$200,000+</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-textSecondary mb-2 block uppercase tracking-wider font-semibold">Employment Status</label>
                  <select
                    disabled={!isEditing}
                    name="employmentStatus"
                    value={formData.employmentStatus || ""}
                    onChange={handleChange}
                    className="w-full bg-[#12141d] border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-70 transition-colors"
                  >
                    <option value="">Not specified</option>
                    <option>Employed</option>
                    <option>Self-employed</option>
                    <option>Unemployed</option>
                    <option>Retired</option>
                    <option>Student</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-textSecondary mb-2 block uppercase tracking-wider font-semibold">Household Size</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    min="1"
                    name="householdSize"
                    value={formData.householdSize || ""}
                    onChange={handleChange}
                    placeholder="e.g. 4"
                    className="w-full bg-[#12141d] border border-border rounded-xl py-3 px-4 text-sm text-white placeholder:text-textMuted focus:outline-none focus:border-accent disabled:opacity-70 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-textSecondary mb-2 block uppercase tracking-wider font-semibold">Eligibility Category</label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    name="category"
                    value={formData.category || ""}
                    onChange={handleChange}
                    placeholder="e.g. farmer, senior citizen"
                    className="w-full bg-[#12141d] border border-border rounded-xl py-3 px-4 text-sm text-white placeholder:text-textMuted focus:outline-none focus:border-accent disabled:opacity-70 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-textSecondary mb-2 block uppercase tracking-wider font-semibold">Disability Status</label>
                  <select
                    disabled={!isEditing}
                    name="disabilityStatus"
                    value={formData.disabilityStatus || ""}
                    onChange={handleChange}
                    className="w-full bg-[#12141d] border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-70 transition-colors"
                  >
                    <option value="">Not specified</option>
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>
              </div>
            )}
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
                <button className="text-xs font-semibold text-textSecondary hover:text-white transition-colors">Unlink</button>
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
                <button className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent font-semibold text-xs border border-accent/20 hover:bg-accent/20 transition-colors">Connect</button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
