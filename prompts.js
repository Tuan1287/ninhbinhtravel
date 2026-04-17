// 🧠 SYSTEM PROMPTS
const SYSTEM_PROMPTS = {
  vi: `Bạn là trợ lý du lịch Ninh Bình thân thiện, nhiệt tình, am hiểu sâu sắc về Ninh Bình. 
🎯 Nhiệm vụ: Gợi ý lịch trình 2 ngày 1 đêm chi tiết, thực tế, khả thi.
📌 Ưu tiên TUYỆT ĐỐI: Chỉ dùng địa điểm từ list: ${JSON.stringify(CONFIG.PREFERRED_PLACES)}. Nếu user không chọn cụ thể, hãy tự ghép nối các điểm trên thành lộ trình hợp lý.
💬 Phong cách: Như người bạn địa phương, dùng emoji 🌿✨🍃, giọng tự nhiên gần gũi, tránh văn hành chính.
🌍 Ngôn ngữ: Trả lời bằng TIẾNG VIỆT. Cấu trúc rõ ràng: 🗓️ Lịch trình → 🍽️ Ăn uống → 🏨 Lưu trú → 🚗 Di chuyển → 💡 Mẹo nhỏ.`,
  
  en: `You are a friendly, enthusiastic Ninh Binh travel assistant with deep local knowledge.
🎯 Task: Suggest detailed, realistic, feasible 2-day 1-night itinerary.
📌 Priority: ONLY use places from: ${JSON.stringify(CONFIG.PREFERRED_PLACES)}. If user doesn't specify, creatively combine them into a logical schedule.
💬 Tone: Warm, conversational, like a local friend. Use emojis 🌿✨, avoid formal language.
🌍 Language: Reply in ENGLISH. Structure clearly: 🗓️ Itinerary → 🍽️ Food → 🏨 Stay →  Transport → 💡 Tips.`
};

// 🌐 UI TEXTS (Đa ngôn ngữ)
const UI_TEXTS = {
  vi: {
    title: "Ninh Bình Travel",
    disclaimer: "thông tin mang tính chất tham khảo",
    apiPlaceholder: "Nhập Gemini API Key...",
    saveBtn: "Lưu Key",
    inputPlaceholder: "Hỏi về lịch trình Ninh Bình...",
    welcome: "Chào bạn! 👋 Mình giúp bạn lên lịch 2N1Đ Ninh Bình siêu chill. Bạn muốn đi kiểu gia đình, cặp đôi, hay solo? 🌿",
    saveOk: "✅ Key đã lưu!",
    saveErr: "⚠️ Key trống hoặc không hợp lệ",
    needKey: "⚠️ Nhập API Key trước khi chat nhé",
    errApi: "❌ Lỗi kết nối AI. Kiểm tra Key hoặc thử lại.",
    errRate: "⏳ AI đang bận, đợi xíu nha...",
    errModel: `⚠️ Model "${CONFIG.GEMINI_MODEL}" không khả dụng`,
    errInvalidKey: "❌ API Key không hợp lệ",
    noResponse: "Xin lỗi, mình chưa nghĩ ra câu trả lời 🙏",
    chips: {
      couple: "👩‍❤️‍👨 Couple/Gia đình 2N1Đ",
      budget: "💰 Ngân sách ~2 triệu",
      escape: "⚡ Trốn phố 24h",
      motorbike: "🏍️ Xe máy tự túc"
    },
    chipMsg: {
      couple: "Gợi ý lịch trình 2 ngày 1 đêm cho couple/gia đình tại Ninh Bình",
      budget: "Lịch trình Ninh Bình 2 ngày 1 đêm ngân sách khoảng 2 triệu đồng",
      escape: "Chương trình trốn phố 24h tại Ninh Bình",
      motorbike: "Lịch trình xe máy tự túc 2 ngày 1 đêm Ninh Bình"
    }
  },
  en: {
    title: "Ninh Binh Travel",
    disclaimer: "information for reference",
    apiPlaceholder: "Enter Gemini API Key...",
    saveBtn: "Save Key",
    inputPlaceholder: "Ask about Ninh Binh itinerary...",
    welcome: "Hi there! 👋 I can help plan your chill 2D1N Ninh Binh trip. Family, couple, or solo? 🌿",
    saveOk: "✅ Key saved!",
    saveErr: "⚠️ Invalid or empty Key",
    needKey: "⚠️ Please enter API Key first",
    errApi: "❌ AI connection failed. Check Key or retry.",
    errRate: "⏳ AI is busy, please wait...",
    errModel: `⚠️ Model "${CONFIG.GEMINI_MODEL}" unavailable`,
    errInvalidKey: "❌ Invalid API Key",
    noResponse: "Sorry, I couldn't generate a response 🙏",
    chips: {
      couple: "👩‍❤️👨 Couple/Family 2D1N",
      budget: "💰 Budget ~2M VND",
      escape: "⚡ 24h Escape Trip",
      motorbike: "🏍️ Motorbike Self-drive"
    },
    chipMsg: {
      couple: "Suggest 2-day 1-night itinerary for couple/family in Ninh Binh",
      budget: "Ninh Binh 2-day 1-night itinerary with budget around 2 million VND",
      escape: "24-hour escape trip to Ninh Binh",
      motorbike: "Self-drive motorbike 2-day 1-night Ninh Binh itinerary"
    }
  }
};

// Helper function để lấy text theo ngôn ngữ
const getText = (key, subKey = null) => {
  const lang = CONFIG.getState('lang');
  const texts = UI_TEXTS[lang];
  return subKey ? texts[key]?.[subKey] : texts[key];
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SYSTEM_PROMPTS, UI_TEXTS, getText };
}
