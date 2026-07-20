"""
Chat Service — mirrors Node's chatService.js.
Rule-based multilingual civic AI response engine.
"""

TRANSLATIONS = {
    "en-US": {
        "greeting": "Hello! I'm CivicSync AI. How can I help you today? You can ask me about regional bills, local subsidies, or how new zoning laws affect your profile.",
        "carbon": "I've analyzed the Carbon Tax bill. Small businesses with annual revenues below $1M or CO2e neutrality are exempt from the levy until 2028 under Clause 14.2.",
        "solar": "Based on your profile, you're eligible for the Solar Rebate under Section 42-B. Would you like me to start the application process?",
        "zoning": "The new Zoning Law (Bill #4290) has a 94% match with your profile. It primarily relaxes commercial spacing guidelines for tech businesses in the Central District.",
        "corruption": "I have initiated a Fraud Watch scan. An anomaly in local procurement bidding was detected and has been securely forwarded to the local citizen oversight committee.",
        "infrastructure": "The new Infrastructure Act allocates 34% of funds to digital connectivity and broadband rollout in rural districts, which may benefit you based on your registered location.",
        "healthcare": "The Healthcare Reform Bill expands coverage to freelancers and gig workers under Section 8. If you work independently, you may qualify for subsidized premiums starting Q2 2025.",
        "education": "Under the Digital Literacy Act, eligible citizens can claim up to $500 for approved online courses. Check your profile eligibility under the Skill Development Portal.",
        "housing": "The Housing Assistance Grant (2024) provides up to $3,000 for qualified renters in urban districts. Proof of income and a utility bill are required to apply.",
        "fallback": "The new zoning and legislative codes match your profile interest by 94%. We recommend reviewing Section 12 for environmental compliance guidelines.",
    },
    "hi-IN": {
        "greeting": "नमस्ते! मैं सिविकसिंक एआई (CivicSync AI) हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?",
        "carbon": "मैंने कार्बन टैक्स विधेयक का विश्लेषण किया है। क्लॉज 14.2 के तहत $1 मिलियन से कम वार्षिक राजस्व वाले छोटे व्यवसायों को 2028 तक टैक्स लेवी से छूट दी गई है।",
        "solar": "आपके प्रोफाइल के आधार पर, आप धारा 42-बी के तहत सोलर छूट के लिए पात्र हैं।",
        "zoning": "नया ज़ोनिंग कानून (विधेयक #4290) आपके प्रोफाइल से 94% मेल खाता है।",
        "corruption": "मैंने धोखाधड़ी निगरानी स्कैन शुरू कर दिया है।",
        "infrastructure": "नया बुनियादी ढांचा अधिनियम ग्रामीण जिलों में डिजिटल कनेक्टिविटी के लिए 34% धन आवंटित करता है।",
        "healthcare": "स्वास्थ्य सेवा सुधार विधेयक फ्रीलांसरों के लिए कवरेज का विस्तार करता है।",
        "education": "डिजिटल साक्षरता अधिनियम के तहत पात्र नागरिक ₹40,000 तक का दावा कर सकते हैं।",
        "housing": "आवास सहायता अनुदान (2024) शहरी जिलों में योग्य किरायेदारों को $3,000 तक प्रदान करता है।",
        "fallback": "नए ज़ोनिंग और विधायी कोड आपकी प्रोफ़ाइल रुचि से 94% मेल खाते हैं।",
    },
    "es-ES": {
        "greeting": "¡Hola! Soy CivicSync AI. ¿Cómo puedo ayudarte hoy?",
        "carbon": "He analizado el proyecto de ley del Impuesto al Carbono. Las pequeñas empresas están exentas hasta 2028.",
        "solar": "Según tu perfil, eres elegible para el Reembolso Solar bajo la Sección 42-B.",
        "zoning": "La nueva Ley de Zonificación tiene una coincidencia del 94% con tu perfil.",
        "corruption": "He iniciado un escaneo de Vigilancia contra el Fraude.",
        "infrastructure": "La nueva Ley de Infraestructura asigna el 34% de los fondos a la conectividad digital.",
        "healthcare": "La Reforma de Salud amplía la cobertura para trabajadores independientes.",
        "education": "Los ciudadanos elegibles pueden reclamar hasta $500 para cursos en línea.",
        "housing": "La Subvención de Asistencia para Vivienda proporciona hasta $3,000.",
        "fallback": "Los nuevos códigos coinciden con tu interés de perfil en un 94%.",
    },
    "fr-FR": {
        "greeting": "Bonjour ! Je suis CivicSync AI. Comment puis-je vous aider aujourd'hui ?",
        "carbon": "Les petites entreprises sont exemptées jusqu'en 2028 en vertu de la clause 14.2.",
        "solar": "Vous êtes éligible au remboursement solaire en vertu de la section 42-B.",
        "zoning": "La nouvelle loi sur le zonage correspond à 94% à votre profil.",
        "corruption": "J'ai initié un scan de surveillance des fraudes.",
        "infrastructure": "La nouvelle loi sur les infrastructures alloue 34% des fonds à la connectivité numérique.",
        "healthcare": "La réforme de la santé étend la couverture aux travailleurs indépendants.",
        "education": "Les citoyens éligibles peuvent réclamer jusqu'à 500 $ pour des cours en ligne.",
        "housing": "La subvention d'aide au logement fournit jusqu'à 3 000 $.",
        "fallback": "Les nouveaux codes correspondent à 94% à votre profil.",
    },
}

SOURCES = {
    "greeting": ["CivicSync AI Guide"],
    "carbon": ["Carbon Tax Act 2024 — Clause 14.2"],
    "solar": ["Renewable Energy Rebates — Section 42-B"],
    "zoning": ["Zoning Law Amendment Bill #4290"],
    "corruption": ["CivicSync Fraud Watch Registry"],
    "infrastructure": ["National Infrastructure Act 2024 — Annex B"],
    "healthcare": ["Healthcare Reform Bill 2024 — Section 8"],
    "education": ["Digital Literacy Act 2024 — Skill Development Portal"],
    "housing": ["Housing Assistance Grant 2024 — Application Form"],
    "fallback": ["Bill #4290 — Section 14.2", "Infrastructure Act 2024 — Annex B"],
}


def process_chat(message: str, language: str = "en-US") -> dict:
    """Process a chat message and return a localized AI response."""
    import re as _re
    dict_ = TRANSLATIONS.get(language) or TRANSLATIONS["en-US"]
    query = message.lower().strip()

    key = "fallback"
    if _re.search(r'\b(hi|hello|hey|greetings|hii+|namaste|manaste|pranam|hola|bonjour|hallo)\b', query):
        key = "greeting"
    elif "carbon" in query or "tax" in query:
        key = "carbon"
    elif "solar" in query or "rebate" in query or "scheme" in query or "eligible" in query:
        key = "solar"
    elif "zoning" in query or "district" in query or "law" in query:
        key = "zoning"
    elif "corruption" in query or "fraud" in query or "watch" in query:
        key = "corruption"
    elif "infrastructure" in query or "road" in query or "rural" in query:
        key = "infrastructure"
    elif any(w in query for w in ["health", "medical", "hospital", "insurance"]):
        key = "healthcare"
    elif any(w in query for w in ["education", "school", "skill", "course", "study"]):
        key = "education"
    elif any(w in query for w in ["housing", "rent", "house", "accommodation"]):
        key = "housing"

    return {
        "response": dict_.get(key) or dict_["fallback"],
        "sources": SOURCES.get(key, SOURCES["fallback"]),
    }
