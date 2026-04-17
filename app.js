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
    if (t.chips[key]) chip.textContent = t.chips[key];
  });
  
  // Update welcome message if it's the first bot message
  const firstMsg = els.messages.querySelector('.message.bot');
  if (firstMsg && state.messages.length <= 1) {
    firstMsg.textContent = t.welcome;
  }
}

// 💬 Chat Functions
function addMessage(role, text, isStreaming = false) {
  if (role === 'user') state.messages.push({ role, text });
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = text;
  if (isStreaming) div.innerHTML = text + '<span class="typing-cursor"></span>';
  els.messages.appendChild(div);
  scrollToBottom();
  return div;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    els.chatBox.scrollTop = els.chatBox.scrollHeight;
  });
}

// 🔄 Gọi Gemini API (Non-streaming + Simulated typing)
async function callGemini(userText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`;
  
  const history = state.messages.slice(-4).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));
  
  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT[state.lang] }] },
    { role: "model", parts: [{ text: state.lang === 'vi' ? "Dạ em hiểu rồi ạ! 🌸" : "Got it! 🌸" }] },
    ...history
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents })
  });

  if (response.status === 429) throw new Error('RATE_LIMIT');
  if (!response.ok) throw new Error('API_ERROR');

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
}

// 🎭 Simulate streaming effect (typing animation)
async function simulateTyping(element, fullText, speed = 12) {
  return new Promise(resolve => {
    let i = 0;
    element.innerHTML = '';
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    element.appendChild(cursor);
    
    function type() {
      if (i < fullText.length) {
        // Insert text before cursor
        cursor.before(document.createTextNode(fullText[i]));
        i++;
        scrollToBottom();
        setTimeout(type, speed);
      } else {
        cursor.remove(); // Remove cursor when done
        resolve();
      }
    }
    type();
  });
}

// 📤 Handle Send
async function handleSend(text) {
  if (state.isGenerating || !state.apiKey) {
    if (!state.apiKey) els.apiStatus.textContent = UI_TEXT[state.lang].needKey;
    return;
  }
  
  state.isGenerating = true;
  addMessage('user', text);
  els.input.value = '';
  els.input.disabled = true;
  els.sendBtn.disabled = true;
  els.loading.classList.remove('hidden');
  scrollToBottom();

  try {
    const botMsgEl = addMessage('bot', '', true); // Create placeholder with cursor
    const fullText = await callGemini(text);
    await simulateTyping(botMsgEl, fullText);
    state.messages.push({ role: 'bot', text: fullText });
  } catch (err) {
    const errMsg = err.message === 'RATE_LIMIT' ? UI_TEXT[state.lang].errRate : UI_TEXT[state.lang].errApi;
    addMessage('bot', errMsg);
  } finally {
    state.isGenerating = false;
    els.loading.classList.add('hidden');
    els.input.disabled = false;
    els.sendBtn.disabled = false;
    els.input.focus();
  }
}

// 🎯 Init
function init() {
  // Load saved state
  els.apiInput.value = state.apiKey;
  applyLanguage();
  updateWeather();
  
  // Welcome message
  if (state.messages.length === 0) {
    addMessage('bot', UI_TEXT[state.lang].welcome);
  }

  // Language toggle - ĐÃ SỬA
  els.langToggle.addEventListener('click', () => {
    state.lang = state.lang === 'vi' ? 'en' : 'vi';
    localStorage.setItem('nb_lang', state.lang);
    applyLanguage();
  });

  // API Save
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

  // Clear chat
  els.clearBtn.addEventListener('click', () => {
    state.messages = [];
    els.messages.innerHTML = '';
    addMessage('bot', UI_TEXT[state.lang].welcome);
  });

  // Chip buttons
  const chipMap = {
    couple: "👩‍❤️‍👨 Gợi ý chương trình 2N1Đ cho couple/gia đình",
    budget: "💰 Lịch trình ngân sách khoảng 2 triệu/người", 
    escape: "⚡ Chương trình trốn phố 24h tại Ninh Bình",
    motorbike: "🏍️ Lịch trình xe máy tự túc 2 ngày 1 đêm"
  };
  
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (!state.apiKey) {
        els.apiStatus.textContent = UI_TEXT[state.lang].needKey;
        return;
      }
      const key = chip.dataset.msg;
      const msg = state.lang === 'vi' ? chipMap[key] : UI_TEXT.en.chips[key];
      handleSend(msg);
    });
  });

  // Form submit
  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = els.input.value.trim();
    if (text) handleSend(text);
  });
}

// Start
init();
