// 📌 DANH SÁCH ƯU TIÊN (Sửa tại đây)
const PREFERRED_PLACES = {
  restaurants: ["Cơm niêu Ninh Bình", "Nhà hàng Vũ Gia", "Bánh cuốn Bà Hoành", "Dê núi Trường Yên", "Quán ăn Chay Ngọc Mai"],
  attractions: ["Tràng An", "Tam Cốc - Bích Động", "Hang Múa", "Chùa Bái Đính", "Vườn chim Thung Nham", "Vân Long"],
  stays: ["Tam Coc Garden", "Ninh Bình Legend Hotel", "Yên Ninh Boutique Hotel", "Homestay Mây View Ruộng"]
};

// Trạng thái
const state = {
  lang: localStorage.getItem('nb_lang') || 'vi',
  apiKey: localStorage.getItem('nb_api') || '',
  messages: [],
  isGenerating: false
};

const systemPrompt = {
  vi: `Bạn là trợ lý du lịch thân thiện, am hiểu Ninh Bình. 
🎯 Nhiệm vụ: Gợi ý lịch trình 2 ngày 1 đêm chi tiết. 
📌 Ưu tiên tuyệt đối: Chỉ dùng địa điểm từ list: ${JSON.stringify(PREFERRED_PLACES)}. Nếu user không chọn, hãy tự ghép nối hợp lý. 
💬 Phong cách: Thân thiện như người bạn địa phương, dùng emoji, tránh văn hành chính. 
🌍 Ngôn ngữ: Trả lời bằng tiếng Việt. Cấu trúc: Điểm đến -> Ăn -> Nghỉ -> Di chuyển -> Mẹo.`,
  en: `You are a friendly Ninh Binh travel assistant.
🎯 Task: Suggest detailed 2-day 1-night itinerary.
📌 Priority: ONLY use places from: ${JSON.stringify(PREFERRED_PLACES)}. Combine them logically if user doesn't specify.
💬 Tone: Warm, conversational, use emojis.
🌍 Language: Reply in English. Structure: Places -> Food -> Stay -> Transport -> Tips.`
};

// DOM
const els = {
  weather: document.getElementById('weather-badge'),
  langToggle: document.getElementById('lang-toggle'),
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

const ui = {
  vi: {
    welcome: "Chào bạn! 👋 Mình giúp bạn lên lịch 2N1Đ Ninh Bình siêu chill nè. Bạn đi gia đình, cặp đôi hay solo? 🌿",
    saveOk: "✅ Key đã lưu!", saveErr: "⚠️ Key trống hoặc không hợp lệ",
    needKey: "⚠️ Nhập API Key trước khi chat nhé",
    errApi: "❌ Lỗi kết nối AI. Kiểm tra Key hoặc thử lại.",
    errRate: "⏳ AI đang bận, đợi xíu nha..."
  },
  en: {
    welcome: "Hi there! 👋 I can help plan your chill 2D1N Ninh Binh trip. Family, couple, or solo? 🌿",
    saveOk: "✅ Key saved!", saveErr: "⚠️ Invalid or empty Key",
    needKey: "⚠️ Please enter API Key first",
    errApi: "❌ AI connection failed. Check Key or retry.",
    errRate: "⏳ AI is busy, please wait..."
  }
};

// 🌤️ Weather
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

// 💬 Core Functions
function init() {
  els.apiInput.value = state.apiKey;
  els.langToggle.textContent = state.lang.toUpperCase();
  addMessage('bot', ui[state.lang].welcome);
  updateWeather();

  // Language Toggle
  els.langToggle.addEventListener('click', () => {
    state.lang = state.lang === 'vi' ? 'en' : 'vi';
    localStorage.setItem('nb_lang', state.lang);
    els.langToggle.textContent = state.lang.toUpperCase();
    // Re-render welcome if chat is empty
    if (state.messages.length === 0) {
      els.messages.innerHTML = '';
      addMessage('bot', ui[state.lang].welcome);
    }
  });

  // Chips
  document.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.apiKey) { els.apiStatus.textContent = ui[state.lang].needKey; return; }
      handleSend(btn.dataset.msg);
    });
  });

  els.clearBtn.addEventListener('click', () => {
    state.messages = [];
    els.messages.innerHTML = '';
    addMessage('bot', ui[state.lang].welcome);
  });

  els.apiSave.addEventListener('click', () => {
    const k = els.apiInput.value.trim();
    if (!k) return els.apiStatus.textContent = ui[state.lang].saveErr;
    state.apiKey = k; localStorage.setItem('nb_api', k);
    els.apiStatus.textContent = ui[state.lang].saveOk;
    setTimeout(() => els.apiStatus.textContent = '', 2000);
  });

  els.form.addEventListener('submit', e => {
    e.preventDefault();
    const t = els.input.value.trim();
    if (t) handleSend(t);
  });
}

function addMessage(role, text) {
  if (role === 'user') state.messages.push({ role, text });
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = text;
  els.messages.appendChild(div);
  scrollToBottom();
  return div;
}

function scrollToBottom() {
  requestAnimationFrame(() => els.chatBox.scrollTop = els.chatBox.scrollHeight);
}

async function handleSend(text) {
  if (state.isGenerating || !state.apiKey) {
    if (!state.apiKey) els.apiStatus.textContent = ui[state.lang].needKey;
    return;
  }
  state.isGenerating = true;
  addMessage('user', text);
  els.input.value = '';
  els.input.disabled = true; els.sendBtn.disabled = true;
  els.loading.classList.remove('hidden'); scrollToBottom();

  try {
    await callGeminiWithFallback(text);
  } catch (err) {
    addMessage('bot', err.message === 'RATE' ? ui[state.lang].errRate : ui[state.lang].errApi);
  } finally {
    state.isGenerating = false;
    els.loading.classList.add('hidden');
    els.input.disabled = false; els.sendBtn.disabled = false;
    els.input.focus();
  }
}

// 🔄 API Call with Fallback
async function callGeminiWithFallback(userText) {
  const history = state.messages.slice(-4);
  const contents = [
    { role: "user", parts: [{ text: systemPrompt[state.lang] }] },
    { role: "model", parts: [{ text: state.lang === 'vi' ? "Dạ em hiểu rồi ạ! 🌸" : "Got it! 🌸" }] },
    ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
  ];
  
  const botMsgEl = addMessage('bot', '');
  let fullText = '';

  // Try Streaming First
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${state.apiKey}`;
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });
    
    if (res.status === 404) throw new Error('NO_STREAM'); // Force fallback
    if (res.status === 429) throw new Error('RATE');
    if (!res.ok) throw new Error('API_ERR');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === '{}') continue;
        try {
          const json = JSON.parse(raw);
          const chunk = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunk) { fullText += chunk; botMsgEl.textContent = fullText; scrollToBottom(); }
        } catch {}
      }
    }
  } catch (err) {
    // Fallback to regular generateContent + simulate typing
    if (err.message === 'RATE') throw err;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`;
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });
    if (!res.ok) throw new Error('API_ERR');
    
    const data = await res.json();
    fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
    
    // Simulate streaming effect for better UX
    await simulateStreaming(botMsgEl, fullText);
  }
  
  state.messages.push({ role: 'bot', text: fullText });
}

// 🎭 Simulate typing effect
function simulateStreaming(el, text) {
  return new Promise(resolve => {
    let i = 0;
    const speed = 10; // ms per char
    function type() {
      if (i < text.length) {
        el.textContent = text.substring(0, i + 1);
        i++;
        scrollToBottom();
        setTimeout(type, speed);
      } else {
        resolve();
      }
    }
    type();
  });
}

init();
