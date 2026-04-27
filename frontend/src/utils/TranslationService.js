const localTranslations = {
  "te": {
    "Hello": "నమస్కారం (Namaskaram)",
    "Welcome": "స్వాగతం (Swagatham)",
    "Shop": "దుకాణం (Dukanam)",
    "Business": "వ్యాపారం (Vyaparam)",
    "Customer": "కస్టమర్ (Customer)",
    "Price": "ధర (Dhara)",
    "Quantity": "పరిమాణం (Parimanam)",
    "Rice": "బియ్యం (Biyyam)",
    "Milk": "పాలు (Palu)",
    "Wheat": "గోధుమలు (Godhumalu)",
    "Sugar": "చక్కెర (Chakkera)",
    "Soap": "సబ్బు (Soap)",
    "Oil": "నూనె (Noone)",
  },
  "hi": {
    "Hello": "नमस्ते (Namaste)",
    "Welcome": "स्वागत है (Swagat)",
    "Shop": "दुकान (Dukan)",
    "Business": "व्यापार (Vyapar)",
    "Customer": "ग्राहक (Grahak)",
    "Price": "मूल्य (Mulya)",
    "Quantity": "मात्रा (Matra)",
    "Rice": "चावल (Chawal)",
    "Milk": "दूध (Doodh)",
    "Wheat": "गेहूं (Gehun)",
  },
  "ta": {
    "Hello": "வணக்கம் (Vanakkam)",
    "Welcome": "வரவேற்பு (Varaverpu)",
    "Shop": "கடை (Kadai)",
    "Customer": "வாடிக்கையாளர் (Vāṭikkaiyāḷar)",
  }
};

export const translateText = async (text, targetLang = 'te') => {
  if (!text || targetLang === 'en') return text;
  
  const lookup = text.trim();
  
  // 1. Check local mapping (case-insensitive)
  if (localTranslations[targetLang]) {
    const match = Object.keys(localTranslations[targetLang]).find(
      k => k.toLowerCase() === lookup.toLowerCase()
    );
    if (match) return localTranslations[targetLang][match];
  }

  // 2. Simulated AI Call
  console.log(`Translating "${lookup}" to ${targetLang}`);
  
  // To prove it's working, if not in dictionary, we "simulate" an AI result
  const markers = { te: 'తెలుగు', hi: 'हिंदी', ta: 'தமிழ்', kn: 'ಕನ್ನಡ' };
  const marker = markers[targetLang] || targetLang.toUpperCase();
  
  return `${lookup} [${marker}]`; 
};

// Deprecated: for backward compatibility
export const translateToTelugu = (text) => translateText(text, 'te');
