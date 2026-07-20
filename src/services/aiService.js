import api from "../api/axiosInstance";

// ─────────────────────────────────────────────────────────────────────────────
// AI Service
// Placeholder implementations — ready to connect to Node.js + Express backend.
// ─────────────────────────────────────────────────────────────────────────────

const TRANSLATIONS = {
  "en-US": {
    greeting: "Hello! I'm CivicSync AI. How can I help you today? You can ask me about regional bills, local subsidies, or how new zoning laws affect your profile.",
    carbon: "I've analyzed the Carbon Tax bill. Small businesses with annual revenues below $1M or CO2e neutrality are exempt from the levy until 2028 under Clause 14.2.",
    solar: "Based on your profile, you're eligible for the Solar Rebate under Section 42-B. Would you like me to start the application process?",
    zoning: "The new Zoning Law (Bill #4290) has a 94% match with your profile. It primarily relaxes commercial spacing guidelines for tech businesses in the Central District.",
    corruption: "I have initiated a Fraud Watch scan. An anomaly in local procurement bidding was detected and has been securely forwarded to the local citizen oversight committee.",
    infrastructure: "The new Infrastructure Act allocates 34% of funds to digital connectivity and broadband rollout in rural districts, which may benefit you based on your registered location.",
    fallback: "The new zoning and legislative codes match your profile interest by 94%. We recommend reviewing Section 12 for environmental compliance guidelines."
  },
  "es-ES": {
    greeting: "¡Hola! Soy CivicSync AI. ¿Cómo puedo ayudarte hoy? Puedes preguntarme sobre proyectos de ley regionales, subsidios locales o cómo las nuevas leyes de zonificación afectan tu perfil.",
    carbon: "He analizado el proyecto de ley del Impuesto al Carbono. Las pequeñas empresas con ingresos anuales inferiores a $1M o neutralidad de CO2e están exentas del gravamen hasta 2028 según la Cláusula 14.2.",
    solar: "Según tu perfil, eres elegible para el Reembolso Solar bajo la Sección 42-B. ¿Te gustaría que inicie el proceso de solicitud?",
    zoning: "La nueva Ley de Zonificación (Proyecto de ley #4290) tiene una coincidencia del 94% con tu perfil. Relaja principalmente las pautas de espacio comercial para empresas de tecnología en el Distrito Central.",
    corruption: "He iniciado un escaneo de Vigilancia contra el Fraude. Se detectó una anomalía en las ofertas de adquisiciones locales y se ha enviado de forma segura al comité de supervisión ciudadana local.",
    infrastructure: "La nueva Ley de Infraestructura asigna el 34% de los fondos a la conectividad digital y el despliegue de banda ancha en distritos rurales, lo que puede beneficiarte según tu ubicación registrada.",
    fallback: "Los nuevos códigos de zonificación y legislativos coinciden con tu interés de perfil en un 94%. Recomendamos revisar la Sección 12 para pautas de cumplimiento ambiental."
  },
  "fr-FR": {
    greeting: "Bonjour ! Je suis CivicSync AI. Comment puis-je vous aider aujourd'hui ? Vous pouvez me poser des questions sur les projets de loi régionaux, les subventions locales ou l'impact des nouvelles lois de zonage sur votre profil.",
    carbon: "J'ai analysé le projet de loi sur la taxe carbone. Les petites entreprises dont le chiffre d'affaires annuel est inférieur à 1 million de dollars ou neutres en CO2e sont exemptées de taxe jusqu'en 2028 en vertu de la clause 14.2.",
    solar: "Sur la base de votre profil, vous êtes éligible au remboursement solaire en vertu de la section 42-B. Souhaitez-vous que je commence le processus de demande ?",
    zoning: "La nouvelle loi sur le zonage (projet de loi #4290) correspond à 94% à votre profil. Elle assouplit principalement les directives d'espacement commercial pour les entreprises technologiques du district central.",
    corruption: "J'ai initié un scan de surveillance des fraudes. Une anomalie dans les appels d'offres locaux a été détectée et transmise en toute sécurité au comité de surveillance citoyen local.",
    infrastructure: "La nouvelle loi sur les infrastructures alloue 34% des fonds à la connectivité numérique et au déploiement du haut débit dans les districts ruraux, ce qui peut vous être bénéfique en fonction de votre emplacement enregistré.",
    fallback: "Les nouveaux codes de zonage et législatifs correspondent à 94% à votre profil. Nous vous recommandons de consulter la section 12 pour les directives de conformité environnementale."
  },
  "de-DE": {
    greeting: "Hallo! Ich bin CivicSync AI. Wie kann ich Ihnen heute helfen? Sie können mich zu regionalen Gesetzesentwürfen, lokalen Subventionen oder den Auswirkungen der neuen Zonenaufteilungsgesetze auf Ihr Profil fragen.",
    carbon: "Ich habe den Gesetzesentwurf zur CO2-Steuer analysiert. Kleine Unternehmen mit einem Jahresumsatz unter 1 Mio. $ oder CO2-Neutralität sind gemäß Klausel 14.2 bis 2028 von der Abgabe befreit.",
    solar: "Basierend auf Ihrem Profil haben Sie Anspruch auf die Solar-Rückerstattung gemäß Abschnitt 42-B. Möchten Sie, dass ich den Bewerbungsprozess starte?",
    zoning: "Das neue Zonenaufteilungsgesetz (Gesetzentwurf #4290) stimmt zu 94% mit Ihrem Profil überein. Es lockert vor allem die Richtlinien für gewerbliche Abstände für Technologieunternehmen im Zentralbezirk.",
    corruption: "Ich habe einen Betrugswächter-Scan gestartet. Eine Anomalie bei der lokalen Beschaffungsausschreibung wurde festgestellt und sicher an den lokalen Bürgeraufsichtsausschuss weitergeleitet.",
    infrastructure: "Das neue Infrastrukturgesetz weist 34% der Mittel der digitalen Konnektivität und dem Breitbandausbau in ländlichen Bezirken zu, was Ihnen aufgrund Ihres registrierten Standorts zugutekommen kann.",
    fallback: "Die neuen Zonen- und Gesetzgebungsrichtlinien stimmen zu 94% mit Ihrem Profil überein. Wir empfehlen, Abschnitt 12 für Umwelt-Compliance-Richtlinien zu lesen."
  },
  "hi-IN": {
    greeting: "नमस्ते! मैं सिविकसिंक एआई (CivicSync AI) हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ? आप मुझसे क्षेत्रीय विधेयकों, स्थानीय सब्सिडी, या नए ज़ोनिंग कानून आपके प्रोफाइल को कैसे प्रभावित करते हैं, इसके बारे में पूछ सकते हैं।",
    carbon: "मैंने कार्बन टैक्स विधेयक का विश्लेषण किया है। क्लॉज 14.2 के तहत $1 मिलियन से कम वार्षिक राजस्व या कार्बन तटस्थता वाले छोटे व्यवसायों को 2028 तक टैक्स लेवी से छूट दी गई है।",
    solar: "आपके प्रोफाइल के आधार पर, आप धारा 42-बी के तहत सोलर छूट (Solar Rebate) के लिए पात्र हैं। क्या आप चाहते हैं कि मैं आवेदन प्रक्रिया शुरू करूँ?",
    zoning: "नया ज़ोनिंग कानून (विधेयक #4290) आपके प्रोफाइल से 94% मेल खाता है। यह मुख्य रूप से सेंट्रल डिस्ट्रिक्ट में तकनीकी व्यवसायों के लिए व्यावसायिक दूरी के नियमों में ढील देता है।",
    corruption: "मैंने धोखाधड़ी निगरानी (Fraud Watch) स्कैन शुरू कर दिया है। स्थानीय खरीद बोली में एक विसंगति का पता चला है और इसे सुरक्षित रूप से स्थानीय नागरिक निरीक्षण समिति को भेज दिया गया है।",
    infrastructure: "नया बुनियादी ढांचा अधिनियम (Infrastructure Act) ग्रामीण जिलों में डिजिटल कनेक्टिविटी और ब्रॉडबैंड रोलआउट के लिए 34% धन आवंटित करता है, जो आपके पंजीकृत स्थान के आधार पर आपको लाभ पहुंचा सकता है।",
    fallback: "नए ज़ोनिंग और विधायी कोड आपकी प्रोफ़ाइल रुचि से 94% मेल खाते हैं। हम पर्यावरण अनुपालन दिशानिर्देशों के लिए धारा 12 की समीक्षा करने की सलाह देते हैं।"
  },
  "zh-CN": {
    greeting: "您好！我是 CivicSync AI。今天我能为您提供什么帮助？您可以向我咨询地方账单、本地补贴，或者新的分区法如何影响您的个人资料。",
    carbon: "我分析了碳税法案。根据第 14.2 条，年收入低于 100 万美元或实现碳中和的小型企业在 2028 年之前免征该税。",
    solar: "根据您的个人资料，您符合第 42-B 条下的太阳能返现条件。您需要我为您启动申请流程吗？",
    zoning: "新的分区法（法案 #4290）与您的资料匹配度达 94%。它主要放宽了中心区科技企业的商业间距准则。",
    corruption: "我已启动欺诈监测扫描。系统检测到本地采购竞标存在异常，并已安全转发给当地公民监督委员会。",
    infrastructure: "新的基础设施法案将 34% 的资金分配给农村地区的数字连接和宽带部署，根据您的注册地址，这可能会使您受益。",
    fallback: "新的分区和立法规范与您的个人资料匹配度达 94%。我们建议阅读第 12 节以了解环境合规指南。"
  },
  "ar-SA": {
    greeting: "مرحباً! أنا CivicSync AI. كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن الفواتير الإقليمية، أو الإعانات المحلية، أو كيفية تأثير قوانين تقسيم المناطق الجديدة على ملفك الشخصي.",
    carbon: "لقد قمت بتحليل مشروع قانون ضريبة الكربون. تُعفى الشركات الصغيرة التي تقل إيراداتها السنوية عن مليون دولار أو تحقق حياد الكربون من الضريبة حتى عام 2028 بموجب البند 14.2.",
    solar: "بناءً على ملفك الشخصي، أنت مؤهل للحصول على الخصم الشمسي بموجب القسم 42-B. هل ترغب في أن أبدأ عملية تقديم الطلب؟",
    zoning: "يتطابق قانون تقسيم المناطق الجديد (مشروع قانون #4290) مع ملفك الشخصي بنسبة 94%. فهو يخفف بشكل أساسي من إرشادات التباعد التجاري لشركات التكنولوجيا في المنطقة المركزية.",
    corruption: "لقد بدأت فحص مراقبة الاحتيال. تم اكتشاف خلل في عروض المشتريات المحلية وتم توجيهه بأمان إلى لجنة الإشراف المواطنة المحلية.",
    infrastructure: "يخصص قانون البنية التحتية الجديد 34% من الأموال للاتصال الرقمي ونشر النطاق العريض في المناطق الريفية، مما قد يفيدك بناءً على موقعك المسجل.",
    fallback: "تتطابق قوانين تقسيم المناطق والتشريعات الجديدة مع اهتمامات ملفك الشخصي بنسبة 94%. نوصي بمراجعة القسم 12 للحصول على إرشادات الامتثال البيئي."
  }
};

/**
 * Summarize a bill by ID using AI.
 */
export const summarizeBill = async (billId, options = { mode: "standard" }) => {
  await new Promise((resolve) => setTimeout(resolve, 1800));
  console.log("[aiService.summarizeBill] billId:", billId, "mode:", options.mode);
  return {
    summary: options.mode === "eli15"
      ? "Basically, the government wants to give you money for having a business near trees. Easy win!"
      : "This bill simplifies small business taxes by 12% if you operate in 'Green Zones.' You are currently 4km away from the nearest zone.",
    keyPoints: [
      "Tax reduction of 12% for qualifying businesses",
      "Effective from Q1 2025",
      "Requires annual environmental compliance report",
    ],
    impactScore: 84,
    userImpact: "High — Based on your profession and location, you qualify for up to $2,500 in deductions.",
  };
};

/**
 * Send a question to CivicSync AI chat.
 * Supports localized mock answers using the option { lang }.
 */
export const chatQuery = async (message, options = {}) => {
  const lang = options.lang || "en-US";
  
  try {
    const response = await api.post("/chat", {
      message,
      language: lang,
    });
    
    return {
      response: response.data.response,
      sources: [],
    };
  } catch (err) {
    console.warn("[aiService.chatQuery] Backend call failed. Falling back to mock responses.", err);
    
    const dict = TRANSLATIONS[lang] || TRANSLATIONS["en-US"];
    const query = message.toLowerCase().trim();

    let response = "";
    let sources = [];

    if (query.match(/\b(hi|hello|hey|greetings|hii+|namaste|manaste|pranam|hola|bonjour|hallo)\b/)) {
      response = dict.greeting;
      sources = [lang === "hi-IN" ? "सिविकसिंक एआई गाइड" : "CivicSync AI Guide"];
    } else if (query.includes("carbon") || query.includes("tax")) {
      response = dict.carbon;
      sources = ["Carbon Tax Act 2024 — Clause 14.2"];
    } else if (query.includes("solar") || query.includes("rebate") || query.includes("scheme") || query.includes("eligible")) {
      response = dict.solar;
      sources = ["Renewable Energy Rebates — Section 42-B"];
    } else if (query.includes("zoning") || query.includes("district") || query.includes("law")) {
      response = dict.zoning;
      sources = ["Zoning Law Amendment Bill #4290"];
    } else if (query.includes("corruption") || query.includes("fraud") || query.includes("watch")) {
      response = dict.corruption;
      sources = ["CivicSync Fraud Watch Registry"];
    } else if (query.includes("infrastructure") || query.includes("road") || query.includes("rural")) {
      response = dict.infrastructure;
      sources = ["National Infrastructure Act 2024 — Annex B"];
    } else {
      response = dict.fallback;
      sources = ["Bill #4290 — Section 14.2", "Infrastructure Act 2024 — Annex B"];
    }

    return {
      response,
      sources,
    };
  }
};

/**
 * Get public sentiment analysis for a bill.
 */
export const getSentimentData = async (billId) => {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    positive: 72,
    negative: 18,
    neutral: 10,
    total: 4200,
    comments: 4200,
    shares: 1800,
    objections: 124,
    trend: [40, 25, 45, 30, 60, 40, 80, 50, 70, 90, 65, 85, 40, 50, 20, 60],
  };
};

/**
 * Analyze a citizen's profile impact from a specific bill.
 */
export const analyzeProfileImpact = async (params) => {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return {
    opportunities: [
      { title: "Tax Saving Opportunity", desc: "New Section 42-B allows deducting up to $2,500 for home office equipment.", type: "tax" },
      { title: "Professional Eligibility", desc: "You qualify for the 'Tech Hub Grant' under the Digital Infrastructure Bill 2024.", type: "grant" },
    ],
    risks: [],
    personalizedImpact: "Estimated annual benefit: $3,750",
  };
};

/**
 * Simulate the macroeconomic impact of policy parameters.
 */
export const simulateImpact = async (params) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log("[aiService.simulateImpact] params:", params);
  const gdpGrowth = +(((params.greenSubsidy / 100) * 2.4 + (params.infrastructureBudget / 100) * 1.8 - (params.corporateTax / 100) * 0.6)).toFixed(1);
  const employment = Math.round((params.infrastructureBudget / 100) * 520 + (params.greenSubsidy / 100) * 180);
  const co2Reduction = +(params.greenSubsidy / 100 * 48.5).toFixed(1);
  const taxRevenue = +((params.corporateTax / 100) * 18.4 + (params.digitalLevy / 100) * 3.2).toFixed(1);
  return {
    metrics: { gdpGrowth, employment, co2Reduction, taxRevenue },
  };
};

/**
 * Fetch chat history from the backend.
 * @returns {Promise<Array<{ id, type, text, timestamp }>>}
 */
export const getChatHistory = async () => {
  try {
    const { data } = await api.get("/chat/history");
    return data.history || [];
  } catch (error) {
    console.error("[aiService.getChatHistory] Error fetching chat history:", error);
    return [];
  }
};

/**
 * Clear chat history from the backend database.
 */
export const clearChatHistory = async () => {
  try {
    const { data } = await api.delete("/chat/history");
    return data;
  } catch (error) {
    console.error("[aiService.clearChatHistory] Error clearing chat history:", error);
    throw error;
  }
};
