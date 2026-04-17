// 📌 DANH SÁCH ĐỊA ĐIỂM ƯU TIÊN (Sửa tại đây)
const PREFERRED_PLACES = {
  restaurants: ["Cơm niêu Ninh Bình", "Nhà hàng Vũ Gia", "Bánh cuốn Bà Hoành", "Dê núi Trường Yên", "Quán Chay Ngọc Mai"],
  attractions: ["Tràng An", "Tam Cốc - Bích Động", "Hang Múa", "Chùa Bái Đính", "Vườn chim Thung Nham", "Vân Long"],
  stays: ["Tam Coc Garden", "Ninh Bình Legend Hotel", "Yên Ninh Boutique", "Homestay Mây View", "Mường Thanh Grand"]
};

// Prompt theo ngôn ngữ
const SYSTEM_PROMPT = {
  vi: `Bạn là trợ lý du lịch thân thiện, nhiệt tình, am hiểu Ninh Bình.
🎯 Nhiệm vụ: Gợi ý lịch trình 2 ngày 1 đêm chi tiết, thực tế.
📌 Ưu tiên TUYỆT ĐỐI: Chỉ dùng địa điểm từ list: ${JSON.stringify(PREFERRED_PLACES)}. Nếu user không chọn, hãy tự ghép nối hợp lý.
💬 Phong cách: Như người bạn địa phương, dùng emoji 🌿✨, tránh văn hành chính.
🌍 Ngôn ngữ: Trả lời bằng TIẾNG VIỆT. Cấu trúc: 🗓️ Lịch trình → 🍽️ Ăn uống → 🏨 Lưu trú → 🚗 Di chuyển → 💡 Mẹo nhỏ.`,
  en: `You are a friendly, enthusiastic Ninh Binh travel assistant.
🎯 Task: Suggest a detailed, realistic 2-day 1-night itinerary.
📌 Priority: ONLY use places from: ${JSON.stringify(PREFERRED_PLACES)}. Combine them logically if user doesn't specify.
💬 Tone: Warm, conversational, like a local friend. Use emojis 🌿✨, avoid formal language.
🌍 Language: Reply in ENGLISH. Structure: 🗓️ Itinerary → 🍽️ Food → 🏨 Stay → 🚗 Transport → 💡 Tips.`
};

// UI texts
const UI_TEXT = {
  vi: {
    title: "Ninh Bình Travel",
    disclaimer: "thông tin mang tính chất tham khảo",
    apiPlaceholder: "Nhập Gemini API Key...",
    saveBtn: "Lưu Key",
    inputPlaceholder: "Hỏi về lịch trình Ninh Bình...",
    welcome: "Chào bạn! 👋 Mình giúp bạn lên lịch 2N1Đ Ninh Bình siêu chill nè. Bạn đi gia đình, cặp đôi hay solo? 🌿",
    saveOk: "✅ Key đã lưu!",
    saveErr: "⚠️ Key trống hoặc không hợp lệ",
    needKey: "⚠️ Nhập API Key trước khi chat nhé",
    errApi: "❌ Lỗi kết nối AI. Kiểm tra Key hoặc thử lại.",
    errRate: "⏳ AI đang bận, đợi xíu nha...",
    chips: {
      couple: "👩‍❤️‍👨 Gợi ý chương trình 2N1Đ cho couple/gia đình",
      budget: "💰 Lịch trình ngân sách khoảng 2 triệu/người",
      escape: "⚡ Chương trình trốn phố 24h tại Ninh Bình",
      motorbike: "🏍️ Lịch trình xe máy tự túc 2 ngày 1 đêm"
    }
  },
  en: {
    title: "Ninh Bình Travel",
    disclaimer: "information for reference only",
    apiPlaceholder: "Enter your Gemini API Key...",
    saveBtn: "Save Key",
    inputPlaceholder: "Ask about Ninh Binh itinerary...",
    welcome: "Hi there! 👋 I can help plan your chill 2D1N Ninh Binh trip. Family, couple, or solo? 🌿",
    saveOk: "✅ Key saved!",
    saveErr: "⚠️ Invalid or empty Key",
    needKey: "⚠️ Please enter API Key first",
    errApi: "❌ AI connection failed. Check Key or retry.",
    errRate: "⏳ AI is busy, please wait...",
    chips: {
      couple: "👩‍❤️‍👨 2D1N itinerary for couple/family",
      budget: "💰 Budget ~2 million VND/person",
      escape: "⚡ 24h escape trip to Ninh Binh",
      motorbike: "🏍️ Self-drive motorbike 2D1N plan"
    }
  }
};

// State
const state = {
  lang: localStorage.getItem('nb_lang') || 'vi',
  apiKey: localStorage.getItem('nb_api') || '',
  messages: [],
  isGenerating: false
};

// DOM
const els = {
  siteTitle: document.getElementById('site-title'),
  weather: document.getElementById('weather-badge'),
  langToggle: document.getElementById('lang-toggle'),
  disclaimer: document.getElementById('disclaimer'),
  apiInput: document.getElementById('api-key'),
  apiSave: document.getElementById('api-save'),
  apiStatus: document.getElementById('api-status'),
  messages: document.getElementById('messages'),
  chatBox: document.getElementById('chat-container'),
  loading: document.getElementById('loading'),
  form: document.getElementById('input-form'),
  input: document.getElementById('user-input'),
  sendBtn: document.getElementById('send-btn'),
  clearBtn: document.getElementById('clear-chat')
};

// 🌤️ Weather (cache 24h)
async function updateWeather() {
  const cached = localStorage.getItem('nb_weather');
  if (cached) {
    const { data, time } = JSON.parse(cached);
    if (Date.now() - time < 86400000) return renderWeather(data);
  }
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=20.25&longitude=105.97&current=temperature_2m,weather_code&timezone=Asia/Ho_Chi_Minh');
    const d = await res.json();
    const w = { temp: d.current.temperature_2m, code: d.current.weather_code };
    localStorage.setItem('nb_weather', JSON.stringify({ data: w, time: Date.now() }));
    renderWeather(w);
  } catch { renderWeather({ temp: '-', code: 0 }); }
}
function renderWeather(w) {
  const map = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',51:'🌦️',53:'🌧️',61:'🌧️',80:'⛈️',95:'🌩️'};
  els.weather.textContent = `${map[w.code]||'🌡️'} ${w.temp}°C`;
}

// 🌐 Language Switcher - ĐÃ SỬA
function applyLanguage() {
  const t = UI_TEXT[state.lang];
  els.siteTitle.textContent = t.title;
  els.disclaimer.textContent = t.disclaimer;
  els.apiInput.placeholder = t.apiPlaceholder;
  els.apiSave.textContent = t.saveBtn;
  els.input.placeholder = t.inputPlaceholder;
  els.langToggle.textContent = state.lang.toUpperCase();
  document.documentElement.lang = state.lang;
  
  // Update chip messages
  document.querySelectorAll('.chip').forEach(chip => {
    const key = chip.dataset.msg;
