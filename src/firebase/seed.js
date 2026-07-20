import { collection, doc, getDocs, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase.js";

// Core 20 Schemes
const SCHEMES = [
  {
    name: "PM Kisan Samman Nidhi",
    category: "agriculture",
    description: "Direct income support of ₹6,000 per year to small and marginal farmer families across India in three equal installments.",
    state: "All India",
    incomeLimit: null,
    minimumAge: 18,
    maximumAge: null,
    gender: "All",
    occupation: "Farmer",
    education: "None",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "₹6,000/year",
    estimatedBenefit: "₹6,000 per year (₹2,000 per installment)",
    requiredDocuments: ["Aadhaar Card", "Land Records", "Bank Passbook", "Mobile Number"],
    applicationDeadline: "Ongoing",
    officialWebsite: "https://pmkisan.gov.in",
    matchScore: 90,
    status: "active",
    tags: ["farmer", "agriculture", "income support", "direct benefit transfer"],
    badge: "High Match",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    eligibilityCriteria: [
      { field: "occupation", operator: "includes", value: "Farmer" }
    ]
  },
  {
    name: "Ayushman Bharat - PM Jan Arogya Yojana",
    category: "healthcare",
    description: "World's largest health insurance scheme providing ₹5 lakh per family per year for secondary and tertiary hospitalization to economically vulnerable families.",
    state: "All India",
    incomeLimit: 200000,
    minimumAge: null,
    maximumAge: null,
    gender: "All",
    occupation: "All",
    education: "None",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "₹5 lakh/year per family",
    estimatedBenefit: "Cashless hospitalization up to ₹5 lakh",
    requiredDocuments: ["Aadhaar Card", "Ration Card", "PMJAY Card"],
    applicationDeadline: "Ongoing",
    officialWebsite: "https://pmjay.gov.in",
    matchScore: 88,
    status: "active",
    tags: ["healthcare", "insurance", "hospitalization", "health cover"],
    badge: "High Match",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    eligibilityCriteria: [
      { field: "incomeRange", operator: "includes", value: ["$0 - $25,000", "$25,000 - $50,000"] }
    ]
  },
  {
    name: "PM Awas Yojana - Urban",
    category: "housing",
    description: "Housing for All mission providing financial assistance for construction of pucca houses to eligible urban beneficiaries. Subsidy up to ₹2.67 lakh.",
    state: "All India",
    incomeLimit: 1800000,
    minimumAge: 21,
    maximumAge: null,
    gender: "All",
    occupation: "All",
    education: "None",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "Up to ₹2.67 lakh subsidy",
    estimatedBenefit: "Interest subsidy of 6.5% on home loans + ₹1.5 lakh grant",
    requiredDocuments: ["Aadhaar Card", "Income Certificate", "Land Documents", "Bank Account", "Caste Certificate (if applicable)"],
    applicationDeadline: "December 31, 2024",
    officialWebsite: "https://pmaymis.gov.in",
    matchScore: 85,
    status: "active",
    tags: ["housing", "home loan", "subsidy", "urban"],
    badge: "High Match",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    eligibilityCriteria: [
      { field: "incomeRange", operator: "includes", value: ["$0 - $25,000", "$25,000 - $50,000", "$50,000 - $100,000"] }
    ]
  },
  {
    name: "Skill India - PMKVY",
    category: "employment",
    description: "Pradhan Mantri Kaushal Vikas Yojana — free short-term skill training with government-recognized certification and cash reward of ₹8,000.",
    state: "All India",
    incomeLimit: null,
    minimumAge: 15,
    maximumAge: 45,
    gender: "All",
    occupation: "All",
    education: "Primary",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "Free training + ₹8,000 reward",
    estimatedBenefit: "Free training + ₹8,000 cash + placement assistance",
    requiredDocuments: ["Aadhaar Card", "Bank Account", "Mobile Number", "Educational Certificate"],
    applicationDeadline: "Ongoing",
    officialWebsite: "https://pmkvyofficial.org",
    matchScore: 82,
    status: "active",
    tags: ["skill", "employment", "training", "youth", "vocational"],
    badge: "Active",
    badgeBg: "bg-success/10 text-success border-success/20",
    eligibilityCriteria: [
      { field: "age", operator: "gte", value: 15 },
      { field: "age", operator: "lte", value: 45 }
    ]
  },
  {
    name: "Startup India Seed Fund",
    category: "business",
    description: "Financial assistance for startups in their early stages. Provides up to ₹50 lakh for proof of concept, prototyping, product trials, and market entry.",
    state: "All India",
    incomeLimit: null,
    minimumAge: 18,
    maximumAge: null,
    gender: "All",
    occupation: "Entrepreneur",
    education: "Graduate",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "Up to ₹50 lakh",
    estimatedBenefit: "₹20 lakh grant for proof of concept + ₹50 lakh loans",
    requiredDocuments: ["Aadhaar Card", "PAN Card", "Startup India Certificate", "Business Plan", "Bank Account"],
    applicationDeadline: "March 31, 2025",
    officialWebsite: "https://seedfund.startupindia.gov.in",
    matchScore: 80,
    status: "active",
    tags: ["startup", "business", "entrepreneur", "seed fund", "innovation"],
    badge: "Active",
    badgeBg: "bg-success/10 text-success border-success/20",
    eligibilityCriteria: [
      { field: "occupation", operator: "includes", value: "Entrepreneur" },
      { field: "education", operator: "includes", value: ["Graduate", "Post Graduate", "Doctorate"] }
    ]
  },
  {
    name: "National Scholarship Portal - Merit Scholarship",
    category: "scholarship",
    description: "Central Sector Scheme of Scholarships — monthly scholarships for meritorious students from low-income families to cover educational expenses.",
    state: "All India",
    incomeLimit: 800000,
    minimumAge: 16,
    maximumAge: 30,
    gender: "All",
    occupation: "Student",
    education: "Higher Secondary",
    disabilityEligible: false,
    category_caste: "All",
    benefitAmount: "₹10,000 - ₹20,000/year",
    estimatedBenefit: "₹1,000/month for 10 months per academic year",
    requiredDocuments: ["Aadhaar Card", "Income Certificate", "Mark Sheet (Class 12)", "Bank Account", "Enrollment Certificate"],
    applicationDeadline: "October 31, 2024",
    officialWebsite: "https://scholarships.gov.in",
    matchScore: 78,
    status: "active",
    tags: ["scholarship", "education", "student", "merit"],
    badge: "Active",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    eligibilityCriteria: [
      { field: "occupation", operator: "includes", value: "Student" },
      { field: "age", operator: "lte", value: 30 }
    ]
  },
  {
    name: "PM Mudra Yojana",
    category: "business",
    description: "Micro Units Development and Refinance Agency — loans up to ₹10 lakh for non-corporate, non-farm small/micro enterprises without collateral.",
    state: "All India",
    incomeLimit: null,
    minimumAge: 18,
    maximumAge: null,
    gender: "All",
    occupation: "All",
    education: "None",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "Up to ₹10 lakh loan",
    estimatedBenefit: "Shishu: up to ₹50,000 | Kishore: up to ₹5 lakh | Tarun: up to ₹10 lakh",
    requiredDocuments: ["Aadhaar Card", "PAN Card", "Business Plan", "Bank Statements", "Residence Proof"],
    applicationDeadline: "Ongoing",
    officialWebsite: "https://mudra.org.in",
    matchScore: 75,
    status: "active",
    tags: ["loan", "business", "micro enterprise", "MSME", "entrepreneur"],
    badge: "Available",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    eligibilityCriteria: []
  },
  {
    name: "Beti Bachao Beti Padhao",
    category: "women",
    description: "Scheme for welfare of the girl child — promotes education, prevents female foeticide, and ensures social security for girls through Sukanya Samriddhi Account.",
    state: "All India",
    incomeLimit: null,
    minimumAge: null,
    maximumAge: 10,
    gender: "Female",
    occupation: "All",
    education: "None",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "Sukanya Samriddhi maturity benefits",
    estimatedBenefit: "Interest rate 7.6% on deposits + tax benefits",
    requiredDocuments: ["Birth Certificate (girl child)", "Aadhaar Card (parents)", "Address Proof"],
    applicationDeadline: "Ongoing",
    officialWebsite: "https://wcd.nic.in",
    matchScore: 70,
    status: "active",
    tags: ["women", "girl child", "education", "savings", "sukanya"],
    badge: "Available",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    eligibilityCriteria: [
      { field: "gender", operator: "equals", value: "Female" }
    ]
  },
  {
    name: "Pradhan Mantri Ujjwala Yojana",
    category: "housing",
    description: "Free LPG connections to women from BPL households. Provides deposit-free LPG connection with first refill and stove free of cost.",
    state: "All India",
    incomeLimit: 120000,
    minimumAge: 18,
    maximumAge: null,
    gender: "Female",
    occupation: "All",
    education: "None",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "Free LPG connection + first refill",
    estimatedBenefit: "Free connection worth ₹1,600 + subsidized cylinders",
    requiredDocuments: ["Aadhaar Card", "BPL Ration Card", "Bank Account", "Address Proof"],
    applicationDeadline: "Ongoing",
    officialWebsite: "https://pmuy.gov.in",
    matchScore: 68,
    status: "active",
    tags: ["LPG", "women", "BPL", "cooking gas", "clean fuel"],
    badge: "Available",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    eligibilityCriteria: [
      { field: "gender", operator: "equals", value: "Female" }
    ]
  },
  {
    name: "Stand Up India",
    category: "business",
    description: "Promotes entrepreneurship among SC/ST and women borrowers. Bank loans between ₹10 lakh to ₹1 crore for greenfield enterprises.",
    state: "All India",
    incomeLimit: null,
    minimumAge: 18,
    maximumAge: null,
    gender: "All",
    occupation: "Entrepreneur",
    education: "None",
    disabilityEligible: true,
    category_caste: "SC",
    benefitAmount: "₹10 lakh to ₹1 crore loan",
    estimatedBenefit: "Composite loan at low interest for setting up enterprise",
    requiredDocuments: ["Aadhaar Card", "PAN Card", "Caste Certificate (SC/ST)", "Business Plan", "Bank Account"],
    applicationDeadline: "Ongoing",
    officialWebsite: "https://www.standupmitra.in",
    matchScore: 72,
    status: "active",
    tags: ["SC/ST", "women", "entrepreneur", "loan", "business"],
    badge: "Available",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    eligibilityCriteria: [
      { field: "category_caste", operator: "equals", value: "SC" }
    ]
  },
  {
    name: "PM SVANidhi - Street Vendor Scheme",
    category: "business",
    description: "Micro-credit scheme for street vendors. Provides collateral-free working capital loans starting at ₹10,000 with interest subsidy.",
    state: "All India",
    incomeLimit: null,
    minimumAge: 18,
    maximumAge: null,
    gender: "All",
    occupation: "Street Vendor",
    education: "None",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "₹10,000 - ₹50,000 loan",
    estimatedBenefit: "₹10,000 initial loan + 7% interest subsidy",
    requiredDocuments: ["Aadhaar Card", "Vendor Certificate or Recommendation Letter", "Bank Account"],
    applicationDeadline: "Ongoing",
    officialWebsite: "https://pmsvanidhi.mohua.gov.in",
    matchScore: 60,
    status: "active",
    tags: ["street vendor", "micro credit", "working capital", "urban poor"],
    badge: "Available",
    badgeBg: "bg-white/5 text-textSecondary border-white/10",
    eligibilityCriteria: []
  },
  {
    name: "e-Shram Portal Registration",
    category: "employment",
    description: "National database of unorganized workers. Provides UAN, ₹2 lakh accident insurance, and links to welfare schemes for informal sector workers.",
    state: "All India",
    incomeLimit: null,
    minimumAge: 16,
    maximumAge: 59,
    gender: "All",
    occupation: "Unorganized Worker",
    education: "None",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "₹2 lakh accident insurance",
    estimatedBenefit: "Free registration + ₹2 lakh PM SBY insurance + access to 50+ schemes",
    requiredDocuments: ["Aadhaar Card", "Mobile Number linked to Aadhaar", "Bank Account"],
    applicationDeadline: "Ongoing",
    officialWebsite: "https://eshram.gov.in",
    matchScore: 65,
    status: "active",
    tags: ["unorganized worker", "informal sector", "insurance", "registration"],
    badge: "Active",
    badgeBg: "bg-success/10 text-success border-success/20",
    eligibilityCriteria: []
  },
  {
    name: "Kisan Credit Card (KCC)",
    category: "agriculture",
    description: "Provides farmers timely credit support from banking system for their cultivation and other needs at low interest rate of 7% per annum.",
    state: "All India",
    incomeLimit: null,
    minimumAge: 18,
    maximumAge: null,
    gender: "All",
    occupation: "Farmer",
    education: "None",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "Credit limit based on land holding",
    estimatedBenefit: "Short term credit at 7% interest rate with insurance coverage",
    requiredDocuments: ["Aadhaar Card", "Land Records", "Bank Account", "Passport Size Photo"],
    applicationDeadline: "Ongoing",
    officialWebsite: "https://www.nabard.org",
    matchScore: 70,
    status: "active",
    tags: ["farmer", "credit card", "agriculture", "loan"],
    badge: "Available",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    eligibilityCriteria: [
      { field: "occupation", operator: "includes", value: "Farmer" }
    ]
  },
  {
    name: "Sukanya Samriddhi Yojana",
    category: "women",
    description: "Small savings scheme for girl child education and marriage expenses. Highest interest rate among government schemes — currently 8.2%.",
    state: "All India",
    incomeLimit: null,
    minimumAge: null,
    maximumAge: 10,
    gender: "Female",
    occupation: "All",
    education: "None",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "Maturity amount at 8.2% compounded interest",
    estimatedBenefit: "Deposit ₹1.5 lakh/year, get ₹65+ lakh at maturity",
    requiredDocuments: ["Birth Certificate (girl)", "Aadhaar (parents)", "Address Proof", "Photo"],
    applicationDeadline: "Ongoing",
    officialWebsite: "https://www.nsiindia.gov.in",
    matchScore: 62,
    status: "active",
    tags: ["girl child", "savings", "education", "marriage", "women"],
    badge: "Available",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    eligibilityCriteria: [
      { field: "gender", operator: "equals", value: "Female" }
    ]
  },
  {
    name: "Pradhan Mantri Vaya Vandana Yojana",
    category: "other",
    description: "Pension scheme for senior citizens providing assured pension of ₹9,250/month for 10 years. Operated by LIC of India.",
    state: "All India",
    incomeLimit: null,
    minimumAge: 60,
    maximumAge: null,
    gender: "All",
    occupation: "All",
    education: "None",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "Up to ₹9,250/month pension",
    estimatedBenefit: "Assured pension of 7.4% p.a. for 10 years on investment of ₹15 lakh",
    requiredDocuments: ["Aadhaar Card", "PAN Card", "Age Proof", "Bank Account", "Photo"],
    applicationDeadline: "March 31, 2025",
    officialWebsite: "https://licindia.in",
    matchScore: 55,
    status: "active",
    tags: ["senior citizen", "pension", "elderly", "retirement"],
    badge: "Available",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    eligibilityCriteria: [
      { field: "age", operator: "gte", value: 60 }
    ]
  },
  {
    name: "Disability Scholarship - National Fellowship",
    category: "scholarship",
    description: "National Fellowship for Persons with Disabilities — financial assistance for higher education including PhD and M.Phil programs.",
    state: "All India",
    incomeLimit: 250000,
    minimumAge: 18,
    maximumAge: 35,
    gender: "All",
    occupation: "Student",
    education: "Post Graduate",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "₹31,000 - ₹35,000/month",
    estimatedBenefit: "JRF: ₹31,000/month | SRF: ₹35,000/month + HRA + contingency",
    requiredDocuments: ["Disability Certificate (40%+)", "Aadhaar Card", "Income Certificate", "Academic Certificates", "Bank Account"],
    applicationDeadline: "August 31, 2024",
    officialWebsite: "https://ugc.ac.in",
    matchScore: 58,
    status: "active",
    tags: ["disability", "scholarship", "higher education", "PhD"],
    badge: "Available",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    eligibilityCriteria: [
      { field: "disability", operator: "equals", value: true },
      { field: "occupation", operator: "includes", value: "Student" }
    ]
  },
  {
    name: "Atal Pension Yojana",
    category: "employment",
    description: "Guaranteed minimum pension scheme for workers in the unorganized sector. Pension of ₹1,000 to ₹5,000/month after age 60.",
    state: "All India",
    incomeLimit: null,
    minimumAge: 18,
    maximumAge: 40,
    gender: "All",
    occupation: "All",
    education: "None",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "₹1,000 - ₹5,000/month pension",
    estimatedBenefit: "Guaranteed pension after 60 + government co-contribution",
    requiredDocuments: ["Aadhaar Card", "Bank Account", "Mobile Number"],
    applicationDeadline: "Ongoing",
    officialWebsite: "https://npscra.nsdl.co.in",
    matchScore: 63,
    status: "active",
    tags: ["pension", "retirement", "unorganized sector", "APY"],
    badge: "Available",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    eligibilityCriteria: [
      { field: "age", operator: "gte", value: 18 },
      { field: "age", operator: "lte", value: 40 }
    ]
  },
  {
    name: "Jharkhand Chief Minister Employment Generation Programme",
    category: "employment",
    description: "State-level employment scheme providing 100 days of wage employment to rural households in Jharkhand beyond MGNREGS.",
    state: "Jharkhand",
    incomeLimit: null,
    minimumAge: 18,
    maximumAge: null,
    gender: "All",
    occupation: "All",
    education: "None",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "₹200 - ₹250/day wage",
    estimatedBenefit: "Guaranteed 100 days employment + wages",
    requiredDocuments: ["Aadhaar Card", "Job Card", "Bank Account", "Residence Proof (Jharkhand)"],
    applicationDeadline: "Ongoing",
    officialWebsite: "https://jharkhand.gov.in",
    matchScore: 87,
    status: "active",
    tags: ["employment", "Jharkhand", "rural", "wage", "state scheme"],
    badge: "High Match",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    eligibilityCriteria: [
      { field: "state", operator: "includes", value: "Jharkhand" }
    ]
  },
  {
    name: "PM Vishwakarma Yojana",
    category: "employment",
    description: "Support scheme for artisans and craftspeople. Provides skill training, toolkit support, digital payments adoption, and collateral-free loans.",
    state: "All India",
    incomeLimit: null,
    minimumAge: 18,
    maximumAge: null,
    gender: "All",
    occupation: "Artisan",
    education: "None",
    disabilityEligible: true,
    category_caste: "All",
    benefitAmount: "₹15,000 toolkit + ₹2 lakh loan",
    estimatedBenefit: "₹500/day training stipend + ₹15,000 toolkit + ₹1-2 lakh loan at 5%",
    requiredDocuments: ["Aadhaar Card", "Trade/Craft Certificate", "Bank Account", "Mobile Number"],
    applicationDeadline: "Ongoing",
    officialWebsite: "https://pmvishwakarma.gov.in",
    matchScore: 71,
    status: "active",
    tags: ["artisan", "craftsman", "skill", "toolkit", "loan"],
    badge: "Active",
    badgeBg: "bg-success/10 text-success border-success/20",
    eligibilityCriteria: []
  }
];

// Generator for additional 85 schemes
const generateExtraSchemes = () => {
  const CATEGORIES_LIST = ["agriculture", "healthcare", "housing", "education", "scholarship", "employment", "business", "digital", "women", "disability", "other"];
  const STATES_LIST = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
    "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "All India"
  ];
  const OCCUPATIONS_LIST = ["Farmer", "Student", "Unemployed", "Artisan", "Street Vendor", "Daily Wage Worker", "Homemaker", "Entrepreneur", "All"];
  const EDUCATIONS_LIST = ["None", "Primary", "Secondary", "Higher Secondary", "Graduate", "Post Graduate"];

  const extra = [];
  for (let i = 1; i <= 85; i++) {
    const category = CATEGORIES_LIST[i % CATEGORIES_LIST.length];
    const state = STATES_LIST[i % STATES_LIST.length];
    const occupation = OCCUPATIONS_LIST[i % OCCUPATIONS_LIST.length];
    const education = EDUCATIONS_LIST[i % EDUCATIONS_LIST.length];
    const minAge = 15 + (i % 25);
    const maxAge = minAge + 20 + (i % 30);
    const incomeLimit = 50000 + (i % 10) * 150000;
    
    extra.push({
      name: `${state} State ${category.charAt(0).toUpperCase() + category.slice(1)} Promotion Scheme #${1000 + i}`,
      category,
      description: `A developmental welfare initiative by the Government of ${state} to support eligible ${occupation.toLowerCase()}s with education level ${education.toLowerCase()} under the ${category} sector.`,
      state,
      incomeLimit: i % 5 === 0 ? null : incomeLimit,
      minimumAge: i % 4 === 0 ? null : minAge,
      maximumAge: i % 4 === 0 ? null : maxAge,
      gender: i % 6 === 0 ? "Female" : i % 7 === 0 ? "Male" : "All",
      occupation,
      education,
      disabilityEligible: i % 8 === 0,
      category_caste: i % 9 === 0 ? "SC" : i % 10 === 0 ? "ST" : i % 11 === 0 ? "OBC" : "All",
      benefitAmount: `₹${(10000 + (i % 50) * 2000).toLocaleString()}/year`,
      estimatedBenefit: `Direct financial benefit of ₹${(10000 + (i % 50) * 2000).toLocaleString()} per annum`,
      requiredDocuments: ["Aadhaar Card", "Income Certificate", "Residence Proof", "Bank Account Details"],
      applicationDeadline: `December 31, 2026`,
      officialWebsite: `https://www.${state.toLowerCase().replace(/\s+/g, "")}.gov.in/schemes`,
      matchScore: 60 + (i % 30),
      status: "active",
      tags: [category, state.toLowerCase(), occupation.toLowerCase(), "welfare", "government"],
      badge: "Available",
      badgeBg: "bg-accent/10 text-accent border-accent/20",
      eligibilityCriteria: [
        { field: "state", operator: "includes", value: state },
        ...(i % 5 !== 0 ? [{ field: "incomeRange", operator: "includes", value: ["$0 - $25,000", "$25,000 - $50,000"] }] : [])
      ]
    });
  }
  return extra;
};

const STARTER_NOTIFICATIONS = [
  {
    type: "success",
    iconType: "Bell",
    title: "Welcome to CivicSync!",
    desc: "Your civic intelligence dashboard is now active. Explore bills, schemes, and your personalized roadmap.",
    read: false,
    createdAt: new Date(Date.now() - 5000).toISOString()
  },
  {
    type: "info",
    iconType: "FileText",
    title: "Complete Your Civic Profile",
    desc: "Add your location, profession, and income range to unlock personalized scheme and benefit recommendations.",
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    type: "alert",
    iconType: "ShieldAlert",
    title: "Corruption Risk Detected in Area",
    desc: "Unusual bidding pattern found in Metro Project Phase 4. Estimated discrepancy: $1.2M. Forwarded to oversight committee.",
    read: false,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    type: "warning",
    iconType: "Calendar",
    title: "Upcoming Deadline — Housing Grant",
    desc: "Tax Filing Assistance for qualifying households expires soon. Submit your utility bill proof to avoid missing out.",
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const GPS_TASKS = [
  {
    title: "Upload Income Certificate",
    description: "Required to verify eligibility for PM Awas Yojana housing subsidies.",
    priority: "high",
    category: "document",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false
  },
  {
    title: "Complete Aadhaar e-KYC Verification",
    description: "Essential link to enable Direct Benefit Transfer (DBT) on all government portals.",
    priority: "high",
    category: "verification",
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false
  },
  {
    title: "Apply for Skill India Certification",
    description: "Register for PMKVY short-term training to enhance certification score.",
    priority: "medium",
    category: "application",
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false
  }
];

const GPS_RECOMMENDATIONS = [
  {
    title: "PM Kisan Samman Nidhi",
    description: "Get direct income support of ₹6,000 per year.",
    type: "scheme",
    benefitValue: "₹6,000/year",
    matchScore: 92,
    whyRecommended: "Matches your farming category and rural status.",
  },
  {
    title: "Ayushman Bharat PM-JAY",
    description: "Cashless health insurance coverage up to ₹5 Lakh.",
    type: "scheme",
    benefitValue: "₹5,00,000 Cover",
    matchScore: 88,
    whyRecommended: "Matches your annual household income range.",
  },
  {
    title: "Startup India Seed Fund",
    description: "Avail capital grant of up to ₹20 Lakhs for startup validation.",
    type: "loan",
    benefitValue: "₹20,00,000 Grant",
    matchScore: 78,
    whyRecommended: "Matches your profile as an aspiring Entrepreneur.",
  }
];

const GPS_CALENDAR_EVENTS = [
  {
    title: "Income Certificate Expiry",
    description: "Renew certificate at local Pragya Kendra.",
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    type: "renewal",
  },
  {
    title: "PMAY Urban Registration Deadline",
    description: "Final date to file online housing grants.",
    date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    type: "deadline",
  },
  {
    title: "Mudra Loan Interview Appointment",
    description: "Verification slot booked at State Bank of India branch.",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    type: "appointment",
  }
];

const GPS_ROADMAP = [
  {
    title: "Current Status: Profile Verified",
    date: "Step Completed",
    desc: "Citizen profile verified using digital credentials.",
    status: "completed",
    badge: "Verified",
    badgeBg: "bg-success/10 text-success border-success/20",
    icon: "CheckCircle2",
    color: "success"
  },
  {
    title: "Eligible Schemes Identification",
    date: "Determined",
    desc: "AI flagged 3 active trajectories: PM Awas, Mudra Loans.",
    status: "completed",
    badge: "Ready",
    badgeBg: "bg-accent/10 text-accent border-accent/20",
    icon: "Award",
    color: "accent"
  },
  {
    title: "Required Documents Verification",
    date: "Action Required",
    desc: "Missing: Valid Income Certificate. Please upload to clear the compliance gap.",
    status: "action_required",
    badge: "Gap Found",
    badgeBg: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: "AlertCircle",
    color: "red-400"
  },
  {
    title: "Application Forms Submission",
    date: "Upcoming Step",
    desc: "Unlock form templates once compliance gap is cleared.",
    status: "upcoming",
    badge: "Locked",
    badgeBg: "bg-[#2a2e3d] text-textSecondary border-border",
    icon: "Clock",
    color: "textSecondary"
  },
  {
    title: "Department Verification & Disbursal",
    date: "Future Milestone",
    desc: "Physical audit or virtual credential check prior to grant.",
    status: "pending",
    badge: "Locked",
    badgeBg: "bg-[#2a2e3d] text-textSecondary border-border",
    icon: "Lock",
    color: "textSecondary"
  }
];

// Master seeding function
export const seedFirestore = async (userId) => {
  try {
    console.log("Starting seeding process...");

    // 1. Seed Schemes (global)
    const schemesCol = collection(db, "schemes");
    const schemeSnap = await getDocs(schemesCol);
    if (schemeSnap.empty) {
      console.log("Seeding schemes...");
      const allSchemes = SCHEMES.concat(generateExtraSchemes());
      
      // Batch write to avoid request limits (max 500 per batch)
      let batch = writeBatch(db);
      let count = 0;
      
      for (const scheme of allSchemes) {
        const docRef = doc(schemesCol);
        batch.set(docRef, scheme);
        count++;
        
        if (count === 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }
      console.log("Schemes seeded successfully.");
    }

    // 2. Seed User Sub-collections if userId provided
    if (userId) {
      // Notifications
      const notifsCol = collection(db, `users/${userId}/notifications`);
      const notifsSnap = await getDocs(notifsCol);
      if (notifsSnap.empty) {
        console.log("Seeding user notifications...");
        for (const notif of STARTER_NOTIFICATIONS) {
          const docRef = doc(notifsCol);
          await setDoc(docRef, { ...notif, userId });
        }
      }

      // Tasks
      const tasksCol = collection(db, `users/${userId}/tasks`);
      const tasksSnap = await getDocs(tasksCol);
      if (tasksSnap.empty) {
        console.log("Seeding user tasks...");
        for (const task of GPS_TASKS) {
          const docRef = doc(tasksCol);
          await setDoc(docRef, { ...task, userId });
        }
      }

      // Recommendations
      const recsCol = collection(db, `users/${userId}/recommendations`);
      const recsSnap = await getDocs(recsCol);
      if (recsSnap.empty) {
        console.log("Seeding user recommendations...");
        for (const rec of GPS_RECOMMENDATIONS) {
          const docRef = doc(recsCol);
          await setDoc(docRef, { ...rec, userId });
        }
      }

      // Calendar Events
      const calCol = collection(db, `users/${userId}/calendarEvents`);
      const calSnap = await getDocs(calCol);
      if (calSnap.empty) {
        console.log("Seeding user calendar events...");
        for (const ev of GPS_CALENDAR_EVENTS) {
          const docRef = doc(calCol);
          await setDoc(docRef, { ...ev, userId });
        }
      }

      // Roadmap
      const roadmapDoc = doc(db, "roadmaps", userId);
      const roadmapSnap = await getDoc(roadmapDoc);
      if (!roadmapSnap.exists()) {
        console.log("Seeding user roadmap...");
        await setDoc(roadmapDoc, {
          citizenId: userId,
          items: GPS_ROADMAP
        });
      }
    }

    console.log("Seeding process completed successfully!");
  } catch (error) {
    console.error("Error seeding Firestore database:", error);
  }
};
