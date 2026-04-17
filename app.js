// 📌 app.js - BẢN ĐÃ FIX
const PREFERRED_PLACES = {
  restaurants: ["Cơm niêu Ninh Bình", "Nhà hàng Vũ Gia", "Bánh cuốn Bà Hoành", "Dê núi Trường Yên"],
  attractions: ["Tràng An", "Tam Cốc", "Hang Múa", "Chùa Bái Đính", "Vân Long"],
  stays: ["Tam Coc Garden", "Ninh Bình Legend Hotel", "Yên Ninh Boutique"]
};

const SYSTEM_PROMPT = {
  vi: `Bạn là trợ lý du lịch Ninh Bình thân thiện. Gợi ý lịch trình 2 ngày 1 đêm. Ưu tiên dùng địa điểm: ${JSON.stringify(PREFERRED_PLACES)}. Trả lời bằng tiếng Việt, dùng emoji, giọng tự nhiên.`,
  en: `You are a friendly Ninh Binh travel assistant. Suggest 2-day 1-night itinerary. Priority places: ${JSON.stringify(PREFERRED_PLACES)}. Reply in English, use emojis, conversational tone.`
};

const UI_TEXT = {
  vi: {
    title: "Ninh Bình Travel",
    disclaimer: "thông tin mang tính chất tham khảo",
    apiPlaceholder: "Nhập Gemini API Key...",
    saveBtn: "Lưu Key",
    inputPlaceholder: "Hỏi về Ninh Bình...",
    welcome: "Chào bạn! 👋 Mình giúp bạn lên lịch 2N1Đ Ninh Bình siêu chill. Bạn muốn đi kiểu nào? 🌿",
    saveOk: "✅ Key đã lưu!",
    saveErr: "⚠️ Key không hợp lệ",
    needKey: "⚠️ Nhập API Key trước",
    errApi: "❌ Lỗi API. Kiểm tra Key.",
    errRate: "⏳ Đợi xíu nhé...",
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
    inputPlaceholder: "Ask about Ninh Binh...",
    welcome: "Hi! 👋 I can help plan your Ninh Binh trip. What style? 🌿",
    saveOk: "✅ Key saved!",
    saveErr: "⚠️ Invalid Key",
    needKey: "⚠️ Enter API Key first",
    errApi: "❌ API Error. Check Key.",
    errRate: "⏳ Please wait...",
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

let state = {
  lang: localStorage.getItem('nb_lang') || 'vi',
  apiKey: localStorage.getItem('nb_api') || '',
  messages: [],
  isGenerating: false
};

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  init();
});

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
  
  // Apply language
  applyLanguage(els);
  
  // Weather
  updateWeather(els.weather);
  
  // Welcome message
  if (state.messages.length === 0) {
    addMessage('bot', UI_TEXT[state.lang].welcome, els.messages);
  }

  // Language toggle - FIX: Attach event properly
  if (els.langToggle) {
    els.langToggle.addEventListener('click', () => {
      state.lang = state.lang === 'vi' ? 'en' : 'vi';
      localStorage.setItem('nb_lang', state.lang);
      applyLanguage(els);
      console.log('Language changed to:', state.lang);
    });
  } else {
    console.error('lang-toggle button not found!');
  }

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
    addMessage('bot', UI_TEXT[state.lang].welcome, els.messages);
  });

  // Chips - FIX: Use chipMsg for actual message
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (!state.apiKey) {
        els.apiStatus.textContent = UI_TEXT[state.lang].needKey;
        return;
      }
      const key = chip.dataset.msg;
      const messageText = UI_TEXT[state.lang].chipMsg[key];
      handleSend(messageText, els);
    });
  });

  // Form submit
  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = els.input.value.trim();
    if (text) handleSend(text, els);
  });
}

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
    if (t.chips[key]) {
      chip.textContent = t.chips[key];
    }
  });
  
  // Update welcome if it's the first message
  const firstBotMsg = els.messages.querySelector('.message.bot');
  if (firstBotMsg && state.messages.length <= 1) {
    firstBotMsg.textContent = t.welcome;
  }
  
  console.log('Language applied:', state.lang);
}

function addMessage(role, text, container) {
  if (role === 'user') state.messages.push({ role, text });
  
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = text;
  container.appendChild(div);
  scrollToBottom(container.parentElement);
  return div;
}

function scrollToBottom(container) {
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

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
    const fullText = await callGemini(text);
    const botMsg = addMessage('bot', fullText, els.messages);
    state.messages.push({ role: 'bot', text: fullText });
  } catch (err) {
    console.error('API Error:', err);
    const errMsg = err.message === 'RATE_LIMIT' ? UI_TEXT[state.lang].errRate : UI_TEXT[state.lang].errApi;
    addMessage('bot', errMsg, els.messages);
  } finally {
    state.isGenerating = false;
    els.loading.classList.add('hidden');
    els.input.disabled = false;
    els.sendBtn.disabled = false;
    els.input.focus();
  }
}

async function callGemini(userText) {
  // FIX: Use correct endpoint without alt=sse
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.apiKey}`;
  
  const history = state.messages.slice(-4).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));
  
  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT[state.lang] }] },
    { role: "model", parts: [{ text: state.lang === 'vi' ? "Dạ em hiểu rồi! 🌸" : "Got it! 🌸" }] },
    ...history,
    { role: "user", parts: [{ text: userText }] }
  ];

  console.log('Request URL:', url);
  console.log('Request body:', JSON.stringify(contents, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-goog-api-key': state.apiKey
    },
    body: JSON.stringify({ contents })
  });

  console.log('Response status:', response.status);

  if (response.status === 400) {
    const error = await response.json();
    console.error('400 Error details:', error);
    throw new Error('INVALID_REQUEST');
  }
  
  if (response.status === 401 || response.status === 403) {
    throw new Error('INVALID_API_KEY');
  }
  
  if (response.status === 429) {
    throw new Error('RATE_LIMIT');
  }
  
  if (!response.ok) {
    throw new Error('API_ERROR');
  }

  const data = await response.json();
  console.log('Response data:', data);
  
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry!";
}

async function updateWeather(weatherEl) {
  const cached = localStorage.getItem('nb_weather');
  if (cached) {
    const { data, time } = JSON.parse(cached);
    if (Date.now() - time < 86400000) {
      renderWeather(data, weatherEl);
      return;
    }
  }
  
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=20.25&longitude=105.97&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia/Ho_Chi_Minh');
    const d = await res.json();
    const w = { temp: d.current.temperature_2m, code: d.current.weather_code, wind: d.current.wind_speed_10m };
    localStorage.setItem('nb_weather', JSON.stringify({  w, time: Date.now() }));
    renderWeather(w, weatherEl);
  } catch {
    renderWeather({ temp: '-', code: 0, wind: '-' }, weatherEl);
  }
}

function renderWeather(w, el) {
  const map = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',51:'🌦️',53:'🌧️',61:'🌧️',80:'⛈️',95:'🌩️'};
  const desc = map[w.code] || '🌡️';
  el.textContent = `${desc} ${w.temp}°C | Gió ${w.wind}km/h`;
}
