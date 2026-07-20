import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit 
} from "firebase/firestore";
import { db } from "./firebase";
import { seedFirestore } from "./seed";

// Helper: Get Logged In User ID from localStorage
export const getLoggedUserId = () => {
  try {
    const userStr = localStorage.getItem("civicsync_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || user._id;
    }
  } catch (e) {
    console.error("Error reading user from localStorage:", e);
  }
  return null;
};

// Helper: Format relative time
const formatRelativeTime = (date) => {
  if (!date) return "Unknown";
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
};

// Helper: Calculate profile completion percent
const calcCompletionPercent = (profile) => {
  if (!profile) return 0;
  const fields = [
    profile.phone,
    profile.dob,
    profile.gender,
    profile.category,
    profile.location,
    profile.state,
    profile.district,
    profile.profession,
    profile.education,
  ];
  const filled = fields.filter((f) => f && String(f).trim() !== "").length;
  return Math.round((filled / fields.length) * 100);
};

// Helper: Parse income string range
const getIncomeFromRange = (range) => {
  if (!range) return 0;
  switch (range) {
    case "$0 - $25,000": return 15000;
    case "$25,000 - $50,000": return 35000;
    case "$50,000 - $100,000": return 75000;
    case "$100,000 - $150,000": return 125000;
    case "$150,000 - $200,000": return 175000;
    case "$200,000+": return 250000;
    default:
      const cleaned = range.replace(/[^0-9]/g, "");
      return cleaned ? Number(cleaned) : 0;
  }
};

// Helper: Evaluate scheme eligibility against user profile
const evaluateEligibility = (scheme, profile) => {
  const reasons = [];
  const missingRequirements = [];
  let passedCount = 0;
  let totalRules = 0;

  // 1. Age Rule
  if (scheme.minimumAge !== null && scheme.minimumAge !== undefined || scheme.maximumAge !== null && scheme.maximumAge !== undefined) {
    totalRules++;
    const ageVal = Number(profile.age);
    if (!profile.age && profile.age !== 0) {
      missingRequirements.push("Age verification document or profile update required");
      reasons.push("✗ Age: not specified");
    } else {
      const minOk = scheme.minimumAge === null || scheme.minimumAge === undefined || ageVal >= scheme.minimumAge;
      const maxOk = scheme.maximumAge === null || scheme.maximumAge === undefined || ageVal <= scheme.maximumAge;
      if (minOk && maxOk) {
        passedCount++;
        reasons.push(`✓ Age: ${ageVal} meets requirement (${scheme.minimumAge || 0} - ${scheme.maximumAge || "∞"})`);
      } else {
        reasons.push(`✗ Age: ${ageVal} does not meet requirement (${scheme.minimumAge || 0} - ${scheme.maximumAge || "∞"})`);
        missingRequirements.push(`Age must be between ${scheme.minimumAge || 0} and ${scheme.maximumAge || "∞"}`);
      }
    }
  }

  // 2. Income Rule
  if (scheme.incomeLimit !== null && scheme.incomeLimit !== undefined) {
    totalRules++;
    const incomeVal = typeof profile.income === "number"
      ? profile.income
      : getIncomeFromRange(profile.income || profile.incomeRange);
    
    if (incomeVal === null || incomeVal === undefined) {
      missingRequirements.push("Income certificate document required");
      reasons.push("✗ Income: not specified");
    } else {
      if (incomeVal <= scheme.incomeLimit) {
        passedCount++;
        reasons.push(`✓ Income: ₹${incomeVal.toLocaleString()} is within the ceiling of ₹${scheme.incomeLimit.toLocaleString()}`);
      } else {
        reasons.push(`✗ Income: ₹${incomeVal.toLocaleString()} exceeds limit of ₹${scheme.incomeLimit.toLocaleString()}`);
        missingRequirements.push(`Annual family income must be below ₹${scheme.incomeLimit.toLocaleString()}`);
      }
    }
  }

  // 3. Gender Rule
  if (scheme.gender && scheme.gender !== "All") {
    totalRules++;
    if (!profile.gender) {
      missingRequirements.push("Gender field in profile is empty");
      reasons.push("✗ Gender: not specified");
    } else {
      if (String(profile.gender).toLowerCase() === String(scheme.gender).toLowerCase()) {
        passedCount++;
        reasons.push(`✓ Gender: matches ${scheme.gender}`);
      } else {
        reasons.push(`✗ Gender: expected ${scheme.gender}, got ${profile.gender}`);
        missingRequirements.push(`Scheme is restricted to ${scheme.gender} candidates`);
      }
    }
  }

  // 4. State Rule
  if (scheme.state && scheme.state !== "All India") {
    totalRules++;
    if (!profile.state) {
      missingRequirements.push("State residence proof required");
      reasons.push("✗ State: not specified");
    } else {
      if (String(profile.state).toLowerCase() === String(scheme.state).toLowerCase()) {
        passedCount++;
        reasons.push(`✓ State: matches ${scheme.state}`);
      } else {
        reasons.push(`✗ State: expected ${scheme.state}, got ${profile.state}`);
        missingRequirements.push(`Scheme only open to residents of ${scheme.state}`);
      }
    }
  }

  // 5. Disability Rule
  if (scheme.disabilityEligible) {
    totalRules++;
    const hasDisability = profile.disability === true || String(profile.disability) === "true";
    if (hasDisability) {
      passedCount++;
      reasons.push("✓ Disability status: eligible");
    } else {
      reasons.push("✗ Disability status: expected disabled, got non-disabled");
      missingRequirements.push("Scheme requires a certified physical disability status");
    }
  }

  // 6. Occupation Rule
  if (scheme.occupation && scheme.occupation !== "All") {
    totalRules++;
    if (!profile.occupation && !profile.profession) {
      missingRequirements.push("Occupation field in profile is empty");
      reasons.push("✗ Occupation: not specified");
    } else {
      const inputOcc = String(profile.occupation || profile.profession).toLowerCase();
      const occList = scheme.occupation.split(",").map((o) => o.trim().toLowerCase());
      const matches = occList.some((o) => inputOcc.includes(o) || o.includes(inputOcc));

      if (matches) {
        passedCount++;
        reasons.push(`✓ Occupation: matches ${scheme.occupation}`);
      } else {
        reasons.push(`✗ Occupation: expected [${scheme.occupation}], got ${profile.occupation || profile.profession}`);
        missingRequirements.push(`Occupation must be one of: ${scheme.occupation}`);
      }
    }
  }

  // 7. Category/Caste Rule
  if (scheme.category_caste && scheme.category_caste !== "All") {
    totalRules++;
    const catVal = profile.category || profile.category_caste;
    if (!catVal) {
      missingRequirements.push("Category certificate proof required");
      reasons.push("✗ Category: not specified");
    } else {
      if (String(catVal).toLowerCase() === String(scheme.category_caste).toLowerCase()) {
        passedCount++;
        reasons.push(`✓ Category: matches ${scheme.category_caste}`);
      } else {
        reasons.push(`✗ Category: expected ${scheme.category_caste}, got ${catVal}`);
        missingRequirements.push(`Scheme is reserved for ${scheme.category_caste} category`);
      }
    }
  }

  if (totalRules === 0) {
    return {
      verdict: "Eligible",
      score: 100,
      reasons: ["✓ Universally eligible: matches all generic conditions"],
      missingRequirements: [],
    };
  }

  const score = Math.round((passedCount / totalRules) * 100);
  let verdict;
  if (score === 100) verdict = "Eligible";
  else if (score >= 60) verdict = "Maybe Eligible";
  else verdict = "Not Eligible";

  return { verdict, score, reasons, missingRequirements };
};

// ─── Firestore Operations: Schemes ───────────────────────────────────────────

export const firestoreGetSchemes = async (params = {}) => {
  const schemesCol = collection(db, "schemes");
  let querySnapshot = await getDocs(schemesCol);
  
  if (querySnapshot.empty) {
    const userId = getLoggedUserId();
    await seedFirestore(userId);
    querySnapshot = await getDocs(schemesCol);
  }

  let list = [];
  querySnapshot.forEach((doc) => {
    list.push({ _id: doc.id, id: doc.id, ...doc.data() });
  });

  // Client side filters
  // 1. Status filter
  list = list.filter(s => s.status === "active" || s.status === "upcoming");

  // 2. Keyword filter
  if (params.keyword) {
    const kw = params.keyword.trim().toLowerCase();
    list = list.filter(s => 
      s.name?.toLowerCase().includes(kw) || 
      s.description?.toLowerCase().includes(kw) || 
      s.tags?.some(t => t.toLowerCase().includes(kw))
    );
  }

  // 3. Category filter
  if (params.category && params.category !== "all") {
    list = list.filter(s => s.category === params.category);
  }

  // 4. State filter
  if (params.state && params.state !== "all") {
    const st = params.state.toLowerCase();
    list = list.filter(s => s.state === "All India" || s.state?.toLowerCase().includes(st));
  }

  // 5. Age filter
  if (params.age) {
    const ageNum = parseInt(params.age);
    if (!isNaN(ageNum)) {
      list = list.filter(s => (s.minimumAge === null || s.minimumAge === undefined || s.minimumAge <= ageNum) && (s.maximumAge === null || s.maximumAge === undefined || s.maximumAge >= ageNum));
    }
  }

  // 6. Income filter
  if (params.income) {
    const incomeNum = parseFloat(params.income);
    if (!isNaN(incomeNum)) {
      list = list.filter(s => s.incomeLimit === null || s.incomeLimit === undefined || s.incomeLimit >= incomeNum);
    }
  }

  // 7. Occupation filter
  if (params.occupation && params.occupation !== "all") {
    const occ = params.occupation.toLowerCase();
    list = list.filter(s => s.occupation === "All" || s.occupation?.toLowerCase().includes(occ));
  }

  // 8. Education filter
  if (params.education && params.education !== "all") {
    const edu = params.education.toLowerCase();
    list = list.filter(s => s.education === "None" || s.education?.toLowerCase().includes(edu));
  }

  // Pagination slice
  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(50, parseInt(params.limit) || 10);
  const total = list.length;
  const pages = Math.ceil(total / limit) || 1;
  const paginated = list.slice((page - 1) * limit, page * limit);

  return {
    schemes: paginated,
    total,
    page,
    pages,
    limit
  };
};

export const firestoreGetSchemeById = async (schemeId) => {
  const schemeDoc = doc(db, "schemes", schemeId);
  const snapshot = await getDoc(schemeDoc);
  if (!snapshot.exists()) {
    throw new Error("Scheme not found.");
  }
  return { scheme: { _id: snapshot.id, id: snapshot.id, ...snapshot.data() } };
};

// ─── Firestore Operations: Eligibility ────────────────────────────────────────

export const firestoreCheckEligibility = async (payload = {}) => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  // Load profile from input or user's citizens doc
  let profile = null;
  const profileParamsExist = [
    "age", "income", "gender", "state", "occupation", "education", "category", "disability"
  ].some(k => payload[k] !== undefined);

  if (profileParamsExist) {
    profile = { ...payload };
  } else {
    const citizenDoc = doc(db, "citizens", userId);
    const snap = await getDoc(citizenDoc);
    if (!snap.exists()) {
      return {
        eligible: false,
        verdict: "Not Eligible",
        matchScore: 0,
        reasons: ["Complete your civic profile first to check eligibility."],
        missingRequirements: ["Civic profile not set up"],
        suggestedSchemes: []
      };
    }
    profile = snap.data();
  }

  const schemeId = payload.schemeId;
  if (schemeId) {
    const { scheme } = await firestoreGetSchemeById(schemeId);
    const evalResult = evaluateEligibility(scheme, profile);
    return {
      verdict: evalResult.verdict,
      score: evalResult.score,
      reasons: evalResult.reasons,
      missingRequirements: evalResult.missingRequirements,
      scheme
    };
  }

  // Evaluate against all schemes
  const schemesCol = collection(db, "schemes");
  const querySnapshot = await getDocs(schemesCol);
  const schemes = [];
  querySnapshot.forEach((doc) => {
    schemes.push({ _id: doc.id, id: doc.id, ...doc.data() });
  });

  const eligible = [];
  const maybeEligible = [];
  const notEligible = [];

  for (const s of schemes) {
    if (s.status !== "active" && s.status !== "upcoming") continue;
    const evalResult = evaluateEligibility(s, profile);
    const item = {
      ...s,
      verdict: evalResult.verdict,
      score: evalResult.score,
      reasons: evalResult.reasons,
      missingRequirements: evalResult.missingRequirements,
    };

    if (evalResult.verdict === "Eligible") eligible.push(item);
    else if (evalResult.verdict === "Maybe Eligible") maybeEligible.push(item);
    else notEligible.push(item);
  }

  let verdict = "Not Eligible";
  if (eligible.length > 0) verdict = "Eligible";
  else if (maybeEligible.length > 0) verdict = "Maybe Eligible";

  return {
    verdict,
    eligibleCount: eligible.length,
    maybeCount: maybeEligible.length,
    notEligibleCount: notEligible.length,
    suggestedSchemes: [...eligible, ...maybeEligible],
    detailedReport: { eligible, maybeEligible, notEligible }
  };
};

// ─── Firestore Operations: Benefits Tracker ───────────────────────────────────

export const firestoreGetApplications = async () => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const appsCol = collection(db, `users/${userId}/applications`);
  const snapshot = await getDocs(appsCol);
  const applications = [];
  
  let approvedCount = 0;
  let totalEstimatedBenefit = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const app = { _id: doc.id, id: doc.id, ...data };
    applications.push(app);

    if (app.status === "approved") {
      approvedCount++;
      const val = parseFloat(app.estimatedBenefit?.replace(/[^0-9]/g, "") || "0");
      totalEstimatedBenefit += isNaN(val) ? 0 : val;
    }
  });

  return {
    applications,
    summary: {
      total: applications.length,
      approved: approvedCount,
      pending: applications.filter(a => a.status === "pending" || a.status === "submitted").length,
      underReview: applications.filter(a => a.status === "under_review").length,
      rejected: applications.filter(a => a.status === "rejected").length,
      totalBenefitValue: `₹${totalEstimatedBenefit.toLocaleString()}`
    }
  };
};

export const firestoreApplyForScheme = async (schemeId) => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const { scheme } = await firestoreGetSchemeById(schemeId);

  // Write application using a composed key {userId}_{schemeId} to guarantee uniqueness
  const appDocRef = doc(db, `users/${userId}/applications`, `${userId}_${schemeId}`);
  const snap = await getDoc(appDocRef);
  if (snap.exists()) {
    throw new Error("You have already applied for this scheme.");
  }

  const appData = {
    userId,
    schemeId,
    schemeName: scheme.name,
    schemeCategory: scheme.category,
    status: "submitted",
    appliedAt: new Date().toISOString(),
    reviewedAt: null,
    approvedAt: null,
    rejectedAt: null,
    rejectionReason: "",
    estimatedBenefit: scheme.benefitAmount || scheme.estimatedBenefit,
    notes: "Applied via CivicSync Scheme Finder."
  };

  await setDoc(appDocRef, appData);
  return { application: { _id: appDocRef.id, id: appDocRef.id, ...appData } };
};

export const firestoreGetApplicationById = async (applicationId) => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const appDocRef = doc(db, `users/${userId}/applications`, applicationId);
  const snapshot = await getDoc(appDocRef);
  if (!snapshot.exists()) {
    throw new Error("Application not found.");
  }

  return { application: { _id: snapshot.id, id: snapshot.id, ...snapshot.data() } };
};

export const firestoreUpdateApplicationStatus = async (applicationId, status, remarks = "") => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const appDocRef = doc(db, `users/${userId}/applications`, applicationId);
  const snapshot = await getDoc(appDocRef);
  if (!snapshot.exists()) {
    throw new Error("Application not found.");
  }

  const updates = { status, remarks };
  if (status === "approved") {
    updates.approvedAt = new Date().toISOString();
  } else if (status === "rejected") {
    updates.rejectedAt = new Date().toISOString();
    updates.rejectionReason = remarks;
  } else if (status === "under_review") {
    updates.reviewedAt = new Date().toISOString();
  }

  await updateDoc(appDocRef, updates);
  return { application: { _id: snapshot.id, id: snapshot.id, ...snapshot.data(), ...updates } };
};

// ─── Firestore Operations: Profile ────────────────────────────────────────────

export const firestoreGetProfile = async () => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const citizenDoc = doc(db, "citizens", userId);
  const snap = await getDoc(citizenDoc);
  if (!snap.exists()) {
    // Return empty starter profile
    const starterProfile = {
      userId,
      phone: "",
      dob: "",
      age: null,
      gender: "",
      category: "",
      disability: false,
      disabilityType: "",
      location: "",
      address: "",
      state: "",
      district: "",
      pincode: "",
      profession: "",
      occupation: "",
      incomeRange: "$50,000 - $100,000",
      education: "",
      familySize: null,
      familyMembers: [],
      verificationStatus: "Unverified",
      connectedIds: [
        { name: "National ID / SSN", verified: false },
        { name: "Tax Payer Portal", verified: false }
      ],
      completionPercent: 0
    };
    await setDoc(citizenDoc, starterProfile);
    return { profile: starterProfile };
  }

  const profile = snap.data();
  profile.completionPercent = calcCompletionPercent(profile);
  return { profile };
};

export const firestoreUpdateProfile = async (updateData) => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const citizenDoc = doc(db, "citizens", userId);
  const snap = await getDoc(citizenDoc);
  const existing = snap.exists() ? snap.data() : {};

  const merged = {
    ...existing,
    ...updateData,
    userId,
    // Calculate fields if needed
    age: updateData.dob ? new Date().getFullYear() - new Date(updateData.dob).getFullYear() : (updateData.age || existing.age || null),
    completionPercent: calcCompletionPercent({ ...existing, ...updateData })
  };

  await setDoc(citizenDoc, merged);
  return { profile: merged, success: true };
};

// ─── Firestore Operations: Notifications ───────────────────────────────────────

export const firestoreGetNotifications = async (params = {}) => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const notifsCol = collection(db, `users/${userId}/notifications`);
  const snapshot = await getDocs(notifsCol);
  let notifications = [];

  snapshot.forEach((doc) => {
    notifications.push({ _id: doc.id, id: doc.id, ...doc.data() });
  });

  // Sort by createdAt descending
  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (params.unreadOnly) {
    notifications = notifications.filter(n => !n.read);
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const shaped = notifications.map(n => ({
    _id: n._id,
    id: n.id,
    type: n.type,
    iconType: n.iconType,
    title: n.title,
    desc: n.desc,
    read: n.read,
    time: formatRelativeTime(n.createdAt),
    createdAt: n.createdAt
  }));

  return { notifications: shaped, unreadCount };
};

export const firestoreMarkNotificationRead = async (notificationId) => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const notifDocRef = doc(db, `users/${userId}/notifications`, notificationId);
  await updateDoc(notifDocRef, { read: true });
  return { success: true };
};

export const firestoreMarkAllNotificationsRead = async () => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const notifsCol = collection(db, `users/${userId}/notifications`);
  const snapshot = await getDocs(notifsCol);

  let count = 0;
  for (const item of snapshot.docs) {
    if (!item.data().read) {
      await updateDoc(doc(db, `users/${userId}/notifications`, item.id), { read: true });
      count++;
    }
  }

  return { success: true, count };
};

// ─── Firestore Operations: Civic GPS / Roadmap ─────────────────────────────────

export const firestoreGetGpsDashboard = async () => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  // Load counts of documents, applications, etc.
  const docsCol = collection(db, `users/${userId}/documents`);
  const docsSnap = await getDocs(docsCol);

  const appsCol = collection(db, `users/${userId}/applications`);
  const appsSnap = await getDocs(appsCol);

  const recsCol = collection(db, `users/${userId}/recommendations`);
  const recsSnap = await getDocs(recsCol);

  const tasksCol = collection(db, `users/${userId}/tasks`);
  const tasksSnap = await getDocs(tasksCol);

  const citizenDoc = doc(db, "citizens", userId);
  const citizenSnap = await getDoc(citizenDoc);
  const profileCompletion = citizenSnap.exists() ? citizenSnap.data().completionPercent || 0 : 0;

  return {
    dashboard: {
      profileCompletion,
      documentCount: docsSnap.size,
      applicationCount: appsSnap.size,
      recommendationCount: recsSnap.size,
      pendingTasks: tasksSnap.docs.filter(t => !t.data().completed).length
    }
  };
};

export const firestoreGetGpsRoadmap = async () => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const roadmapDoc = doc(db, "roadmaps", userId);
  const snap = await getDoc(roadmapDoc);
  if (!snap.exists()) {
    return { roadmap: { items: [], summary: { completed: 0, actionRequired: 0, upcoming: 0, pending: 0 } } };
  }

  const data = snap.data();
  const items = data.items || [];
  const completed = items.filter(i => i.status === "completed").length;
  const actionRequired = items.filter(i => i.status === "action_required").length;
  const upcoming = items.filter(i => i.status === "upcoming").length;
  const pending = items.filter(i => i.status === "pending").length;

  return { 
    roadmap: { 
      ...data,
      summary: { completed, actionRequired, upcoming, pending }
    } 
  };
};

export const firestoreGenerateGpsRoadmap = async () => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const defaultSteps = [
    {
      title: "Current Status: Profile Verified",
      date: "Step Completed",
      desc: "Citizen profile verified using digital credentials.",
      status: "completed",
      badge: "Verified",
      badgeBg: "bg-success/10 text-success border-success/20",
      icon: "CheckCircle2",
      color: "success",
    },
    {
      title: "Eligible Schemes Identification",
      date: "Determined",
      desc: "AI flagged active trajectories.",
      status: "completed",
      badge: "Ready",
      badgeBg: "bg-accent/10 text-accent border-accent/20",
      icon: "Award",
      color: "accent",
    },
    {
      title: "Required Documents Verification",
      date: "Action Required",
      desc: "Upload documents to clear standard compliance gap.",
      status: "action_required",
      badge: "Gap Found",
      badgeBg: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: "AlertCircle",
      color: "red-400",
    },
    {
      title: "Application Forms Submission",
      date: "Upcoming Step",
      desc: "Unlock form templates once compliance gap is cleared.",
      status: "upcoming",
      badge: "Locked",
      badgeBg: "bg-[#2a2e3d] text-textSecondary border-border",
      icon: "Clock",
      color: "textSecondary",
    },
    {
      title: "Department Verification & Disbursal",
      date: "Future Milestone",
      desc: "Physical audit or virtual credential check prior to grant.",
      status: "pending",
      badge: "Locked",
      badgeBg: "bg-[#2a2e3d] text-textSecondary border-border",
      icon: "Lock",
      color: "textSecondary",
    }
  ];

  const roadmapDoc = doc(db, "roadmaps", userId);
  await setDoc(roadmapDoc, { citizenId: userId, items: defaultSteps });
  return { roadmap: { items: defaultSteps } };
};

export const firestoreGetGpsTasks = async () => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const tasksCol = collection(db, `users/${userId}/tasks`);
  const snap = await getDocs(tasksCol);
  const tasks = [];
  snap.forEach(d => {
    tasks.push({ _id: d.id, id: d.id, ...d.data() });
  });
  return { tasks };
};

export const firestoreGetGpsDocuments = async () => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const docsCol = collection(db, `users/${userId}/documents`);
  const snap = await getDocs(docsCol);
  const documents = [];
  snap.forEach(d => {
    documents.push({ _id: d.id, id: d.id, ...d.data() });
  });
  return { documents };
};

export const firestoreUploadGpsDocument = async (payload) => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const docsCol = collection(db, `users/${userId}/documents`);
  const docData = {
    userId,
    name: payload.name || "Other",
    fileName: payload.fileName || "document.pdf",
    fileSize: payload.fileSize || 0,
    mimeType: payload.mimeType || "application/pdf",
    fileData: payload.fileData || "",
    status: "verified", // Auto-verify on client-side for ease
    verificationNote: "Automatically verified on upload.",
    expiryDate: payload.expiryDate || null,
    isExpired: false,
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(docsCol, docData);
  return { document: { _id: docRef.id, id: docRef.id, ...docData } };
};

export const firestoreDeleteGpsDocument = async (id) => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const docRef = doc(db, `users/${userId}/documents`, id);
  await deleteDoc(docRef);
  return { success: true };
};

export const firestoreGetGpsRecommendations = async () => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const recsCol = collection(db, `users/${userId}/recommendations`);
  const snap = await getDocs(recsCol);
  const recommendations = [];
  snap.forEach(d => {
    recommendations.push({ _id: d.id, id: d.id, ...d.data() });
  });
  return { recommendations };
};

export const firestoreGetGpsDeadlines = async () => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const calCol = collection(db, `users/${userId}/calendarEvents`);
  const snap = await getDocs(calCol);
  const deadlines = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.type === "deadline" || data.type === "renewal") {
      deadlines.push({ _id: d.id, id: d.id, ...data });
    }
  });
  return { deadlines };
};

export const firestoreGetGpsCalendar = async () => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const calCol = collection(db, `users/${userId}/calendarEvents`);
  const snap = await getDocs(calCol);
  const events = [];
  snap.forEach(d => {
    events.push({ _id: d.id, id: d.id, ...d.data() });
  });
  return { events };
};

// ─── Firestore Operations: Analytics ──────────────────────────────────────────

export const firestoreGetAnalytics = async () => {
  const userId = getLoggedUserId();
  if (!userId) throw new Error("Unauthorized");

  const { profile } = await firestoreGetProfile();
  const { applications } = await firestoreGetApplications();
  const { documents } = await firestoreGetGpsDocuments();

  // Monthly applications breakdown (last 6 months)
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyMap = {};
  const approvedMap = {};

  for (const app of applications) {
    const d = new Date(app.appliedAt);
    const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + 1;
    if (app.status === "approved") {
      approvedMap[key] = (approvedMap[key] || 0) + 1;
    }
  }

  const monthlyApplications = [];
  const benefitsReceived = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    monthlyApplications.push({ month: key, applications: monthlyMap[key] || 0 });
    benefitsReceived.push({ month: key, benefits: approvedMap[key] || 0 });
  }

  const totalApps = applications.length;
  const approvedApps = applications.filter(a => a.status === "approved").length;
  const approvalRate = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;

  // Category breakdown
  const categoryMap = {};
  for (const app of applications) {
    const cat = app.schemeCategory || "general";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  }
  const schemeCategories = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

  return {
    analytics: {
      monthlyApplications,
      benefitsReceived,
      approvalRate,
      profileCompletion: profile.completionPercent || 0,
      schemeCategories,
      eligibleVsApplied: {
        eligible: Math.max(totalApps + 2, 3),
        applied: totalApps,
      },
      documentsUploaded: documents.length,
      totalApplications: totalApps,
      totalApproved: approvedApps
    }
  };
};
