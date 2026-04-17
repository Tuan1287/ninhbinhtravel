// 🎯 CẤU HÌNH QUAN TRỌNG
const GEMINI_MODEL = 'gemini-2.5-flash'; // ✅ Model mới nhất - Stable
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// 📌 DANH SÁCH ĐỊA ĐIỂM ƯU TIÊN
const PREFERRED_PLACES = {
  restaurants: ["Cơm niêu Ninh Bình", "Nhà hàng Vũ Gia", "Bánh cuốn Bà Hoành", "Dê núi Trường Yên", "Quán Chay Ngọc Mai"],
  attractions: ["Tràng An", "Tam Cốc - Bích Động", "Hang Múa", "Chùa Bái Đính", "Vườn chim Thung Nham", "Vân Long"],
  stays: ["Tam Coc Garden", "Ninh Bình Legend Hotel", "Yên Ninh Boutique", "Homestay Mây View Ruộng", "Mường Thanh Grand"]
};

// 🧠 System prompt theo ngôn ngữ
const SYSTEM_PROMPT = {
  vi: `Bạn là trợ lý du lịch Ninh Bình thân thiện, nhiệt tình, am hiểu sâu sắc về Ninh Bình. 
🎯 Nhiệm vụ: Gợi ý lịch trình 2 ngày 1 đêm chi tiết, thực tế, khả thi.
📌 Ưu tiên TUYỆT ĐỐI: Chỉ dùng địa điểm từ list: ${JSON.stringify(PREFERRED_PLACES)}. Nếu user không chọn cụ thể, hãy tự ghép nối các điểm trên thành lộ trình hợp lý.
💬 Phong cách: Như người bạn địa phương, dùng emoji 🌿✨🍃, giọng tự nhiên gần gũi, tránh văn hành chính.
🌍 Ngôn ngữ: Trả lời bằng TIẾNG VIỆT. Cấu trúc rõ ràng: 🗓️ Lịch trình → 🍽️ Ăn uống → 🏨 Lưu trú → 🚗 Di chuyển → 💡 Mẹo nhỏ.`,
  en: `You are a friendly, enthusiastic Ninh Binh travel assistant with deep local knowledge.
🎯 Task: Suggest detailed, realistic, feasible 2-day 1-night itinerary.
📌 Priority: ONLY use places from: ${JSON.stringify(PREFERRED_PLACES)}. If user doesn't specify, creatively combine them into a logical schedule.
💬 Tone: Warm, conversational, like a local friend. Use emojis 🌿✨🍃, avoid formal language.
🌍 Language: Reply in ENGLISH. Structure clearly: 🗓️ Itinerary → 🍽️ Food → 🏨 Stay →  Transport → 💡 Tips.`
};

// 🌐 UI Texts
const UI_TEXT = {
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
    errModel: `⚠️ Model "${GEMINI_MODEL}" không khả dụng`,
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
    errModel: `⚠️ Model "${GEMINI_MODEL}" unavailable`,
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

// 🗃️ State
let state = {
  lang: localStorage.getItem('nb_lang') || 'vi',
  apiKey: localStorage.getItem('nb_api') || '',
  messages: [],
  isGenerating: false
};

// 🎯 Init khi DOM ready
document.addEventListener('DOMContentLoaded', init);

function init() {
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

  // Load saved data
  els.apiInput.value = state.apiKey;
  applyLanguage(els);
  updateWeather(els.weather);
  
  // Welcome message
  if (state.messages.length === 0) {
    addMessage('bot', UI_TEXT[state.lang].welcome, els.messages);
  }

  // 🔁 Language toggle - FIXED
  els.langToggle?.addEventListener('click', () => {
    state.lang = state.lang === 'vi' ? 'en' : 'vi';
    localStorage.setItem('nb_lang', state.lang);
    applyLanguage(els);
    console.log('🌐 Language switched to:', state.lang);
  });

  // 💾 Save API Key
  els.apiSave.addEventListener('click', () => {
    const key = els.apiInput.value.trim();
    if (!key) {
      els.apiStatus.textContent = UI_TEXT[state.lang].saveErr;
      return;
    }
    state.apiKey = key;
    localStorage.setItem('nb_api', key);
    els.apiStatus.textContent = UI_TEXT[state.lang].saveOk;
    setTimeout(() => els.apiStatus.textContent = '', 2500);
  });

  // 🗑️ Clear chat
  els.clearBtn.addEventListener('click', () => {
    state.messages = [];
    els.messages.innerHTML = '';
    addMessage('bot', UI_TEXT[state.lang].welcome, els.messages);
  });

  // 🎯 Chip buttons
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (!state.apiKey) {
        els.apiStatus.textContent = UI_TEXT[state.lang].needKey;
        return;
      }
      const key = chip.dataset.msg;
      const msg = UI_TEXT[state.lang].chipMsg[key];
      handleSend(msg, els);
    });
  });

  // 📤 Form submit
  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = els.input.value.trim();
    if (text) handleSend(text, els);
  });
}

// 🌐 Apply language to UI
function applyLanguage(els) {
  const t = UI_TEXT[state.lang];
  if (els.siteTitle) els.siteTitle.textContent = t.title;
  if (els.disclaimer) els.disclaimer.textContent = t.disclaimer;
  if (els.apiInput) els.apiInput.placeholder = t.apiPlaceholder;
  if (els.apiSave) els.apiSave.textContent = t.saveBtn;
  if (els.input) els.input.placeholder = t.inputPlaceholder;
  if (els.langToggle) els.langToggle.textContent = state.lang.toUpperCase();
  document.documentElement.lang = state.lang;
  
  // Update chip display text
  document.querySelectorAll('.chip').forEach(chip => {
    const key = chip.dataset.msg;
    if (t.chips[key]) chip.textContent = t.chips[key];
  });
  
  // Update welcome if first message
  const firstBot = els.messages.querySelector('.message.bot');
  if (firstBot && state.messages.length <= 1) {
    firstBot.textContent = t.welcome;
  }
}

// 💬 Add message to chat
function addMessage(role, text, container) {
  if (role === 'user') state.messages.push({ role, text });
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = text;
  div.style.opacity = '0';
  div.style.transform = 'translateY(10px)';
  div.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
  container.appendChild(div);
  requestAnimationFrame(() => {
    div.style.opacity = '1';
    div.style.transform = 'translateY(0)';
  });
  scrollToBottom(container.parentElement);
  return div;
}

function scrollToBottom(container) {
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

// 🚀 Handle send message
async function handleSend(text, els) {
  if (state.isGenerating || !state.apiKey) {
    if (!state.apiKey) els.apiStatus.textContent = UI_TEXT[state.lang].needKey;
    return;
  }
  
  state.isGenerating = true;
  addMessage('user', text, els.messages);
  els.input.value = '';
  els.input.disabled = true;
  els.sendBtn.disabled = true;
  els.loading.classList.remove('hidden');
  scrollToBottom(els.chatBox);

  try {
    const reply = await callGemini(text);
    addMessage('bot', reply, els.messages);
    state.messages.push({ role: 'bot', text: reply });
  } catch (err) {
    console.error('❌ Error:', err);
    let errMsg = UI_TEXT[state.lang].errApi;
    if (err.message === 'RATE_LIMIT') errMsg = UI_TEXT[state.lang].errRate;
    if (err.message === 'INVALID_MODEL') errMsg = UI_TEXT[state.lang].errModel;
    if (err.message === 'INVALID_API_KEY') errMsg = "❌ API Key không hợp lệ";
    addMessage('bot', errMsg, els.messages);
  } finally {
    state.isGenerating = false;
    els.loading.classList.add('hidden');
    els.input.disabled = false;
    els.sendBtn.disabled = false;
    els.input.focus();
  }
}

// 🤖 Call Gemini 2.5 Flash API
async function callGemini(userText) {
  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${state.apiKey}`;
  
  const history = state.messages.slice(-4).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));
  
  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT[state.lang] }] },
    { role: "model", parts: [{ text: state.lang === 'vi' ? "Dạ em hiểu rồi ạ! 🌸" : "Got it! 🌸" }] },
    ...history,
    { role: "user", parts: [{ text: userText }] }
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-goog-api-key': state.apiKey
    },
    body: JSON.stringify({ 
      contents,
      generationConfig: { 
        temperature: 0.7, 
        topK: 40, 
        topP: 0.95,
        maxOutputTokens: 8192
      }
    })
  });

  // Handle errors
  if (response.status === 400) {
    const err = await response.json();
    console.error('400 Error:', err);
    if (err.error?.message?.includes('models/')) throw new Error('INVALID_MODEL');
    throw new Error('INVALID_REQUEST');
  }
  if (response.status === 401 || response.status === 403) throw new Error('INVALID_API_KEY');
  if (response.status === 429) throw new Error('RATE_LIMIT');
  if (!response.ok) throw new Error('API_ERROR');

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Xin lỗi, mình chưa nghĩ ra câu trả lời 🙏";
}

// 🌤️ Weather (cache 24h)
async function updateWeather(el) {
  const cached = localStorage.getItem('nb_weather');
  if (cached) {
    const { data, time } = JSON.parse(cached);
    if (Date.now() - time < 86400000) return renderWeather(data, el);
  }
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=20.25&longitude=105.97&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia/Ho_Chi_Minh');
    const d = await res.json();
    const w = { temp: d.current.temperature_2m, code: d.current.weather_code, wind: d.current.wind_speed_10m };
    localStorage.setItem('nb_weather', JSON.stringify({  w, time: Date.now() }));
    renderWeather(w, el);
  } catch {
    renderWeather({ temp: '-', code: 0, wind: '-' }, el);
  }
}

function renderWeather(w, el) {
  const map = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',51:'🌦️',53:'🌧️',61:'🌧️',80:'⛈️',95:'🌩️'};
  el.textContent = `${map[w.code]||'🌡️'} ${w.temp}°C | Gió ${w.wind}km/h`;
}
