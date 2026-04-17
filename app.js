// 📌 CẤU HÌNH DANH SÁCH ƯU TIÊN (Sửa tại đây)
const PREFERRED_PLACES = {
  restaurants: ["Cơm niêu Ninh Bình", "Nhà hàng Vũ Gia", "Bánh cuốn Bà Hoành", "Dê núi Trường Yên", "Quán ăn Chay Ngọc Mai"],
  attractions: ["Tràng An", "Tam Cốc - Bích Động", "Hang Múa", "Chùa Bái Đính", "Vườn chim Thung Nham", "Vân Long", "Thung Nham"],
  stays: ["Tam Coc Garden", "Ninh Bình Legend Hotel", "Yên Ninh Boutique Hotel", "Homestay Mây View Ruộng", "Mường Thanh Grand"]
};

// Trạng thái & DOM
const state = {
  lang: localStorage.getItem('nb_lang') || 'vi',
  apiKey: localStorage.getItem('nb_api') || '',
  messages: [],
  isGenerating: false,
  currentBotMsg: null // Lưu element để streaming
};

const systemPrompt = {
  vi: `Bạn là trợ lý du lịch thân thiện, nhiệt huyết, am hiểu sâu sắc về Ninh Bình. 
🎯 Nhiệm vụ: Gợi ý lịch trình 2 ngày 1 đêm chi tiết, thực tế. 
📌 Ưu tiên tuyệt đối: Chỉ gợi ý các địa điểm từ danh sách này: ${JSON.stringify(PREFERRED_PLACES)}. Nếu người dùng không yêu cầu cụ thể, hãy linh hoạt ghép nối các điểm trên thành lộ trình hợp lý. 
💬 Phong cách: Thân thiện như người bạn địa phương, dùng từ ngữ gần gũi, thêm emoji phù hợp, tránh văn hành chính. 
🌍 Ngôn ngữ: Trả lời bằng tiếng Việt. Cấu trúc rõ ràng: Điểm đến -> Ăn uống -> Lưu trú -> Di chuyển -> Mẹo nhỏ.`,
  en: `You are a friendly, enthusiastic travel assistant specializing in Ninh Bình.
🎯 Task: Suggest a detailed, realistic 2-day 1-night itinerary.
📌 Priority: ONLY suggest places from this list: ${JSON.stringify(PREFERRED_PLACES)}. If the user doesn't pick specific ones, creatively combine them into a logical schedule.
💬 Tone: Warm, conversational, like a local friend. Use natural phrasing, appropriate emojis, avoid formal language.
🌍 Language: Reply in English. Structure clearly: Places -> Food -> Stay -> Transport -> Tips.`
};

const els = {
  title: document.querySelector('h1'),
  weather: document.getElementById('weather-badge'),
  langToggle: document.getElementById('lang-toggle') || document.createElement('button'), // Fallback
  apiInput: document.getElementById('api-key'),
  apiSave: document.getElementById('api-save'),
  apiStatus: document.getElementById('api-status'),
  chatBox: document.getElementById('chat-container'),
  messages: document.getElementById('messages'),
  loading: document.getElementById('loading'),
  suggestions: document.getElementById('suggestions'),
  form: document.getElementById('input-form'),
  input: document.getElementById('user-input'),
  sendBtn: document.getElementById('send-btn'),
  clearBtn: document.getElementById('clear-chat')
};

const ui = {
  vi: {
    welcome: "Chào bạn! 👋 Mình có thể giúp bạn lên lịch 2N1Đ tại Ninh Bình siêu chill. Bạn muốn đi kiểu gia đình, cặp đôi, hay solo? 🌿",
    saveSuccess: "✅ Key đã lưu thành công",
    errKey: "⚠️ Vui lòng nhập API Key trước khi chat",
    errApi: "❌ Lỗi kết nối AI. Kiểm tra Key hoặc thử lại sau.",
    errRate: "⏳ AI đang xử lý nhiều, bạn đợi xíu nhé..."
  },
  en: {
    welcome: "Hello! 👋 I can help you plan a super chill 2D1N trip in Ninh Bình. Family, couple, or solo vibe? 🌿",
    saveSuccess: "✅ Key saved successfully",
    errKey: "⚠️ Please enter an API Key first",
    errApi: "❌ AI connection failed. Check your Key or retry.",
    errRate: "⏳ AI is busy, please wait a moment..."
  }
};

// 🌤️ Thời tiết (Cache 24h)
async function updateWeather() {
  const cached = localStorage.getItem('nb_weather');
  if (cached) {
    const { data, time } = JSON.parse(cached);
    if (Date.now() - time < 86400000) return renderWeather(data);
  }
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=20.25&longitude=105.97&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia/Ho_Chi_Minh');
    const d = await res.json();
    const w = { temp: d.current.temperature_2m, code: d.current.weather_code, wind: d.current.wind_speed_10m };
    localStorage.setItem('nb_weather', JSON.stringify({ data: w, time: Date.now() }));
    renderWeather(w);
  } catch { renderWeather({ temp: '-', code: 0, wind: '-' }); }
}
function renderWeather(w) {
  const map = {0:'☀️ Nắng', 1:'🌤️ Ít mây', 2:'⛅ Mây rải rác', 3:'☁️ Nhiều mây', 45:'🌫️ Sương mù', 48:'🌫️ Sương mù đóng băng', 51:'🌦️ Mưa nhỏ', 53:'🌧️ Mưa nhẹ', 61:'🌧️ Mưa rào', 80:'⛈️ Mưa rào mạnh', 95:'🌩️ Dông bão'};
  const desc = map[w.code] || '🌡️';
  els.weather.textContent = `${desc} ${w.temp}°C | Gió ${w.wind}km/h`;
}

// 💬 Giao diện & Sự kiện
function init() {
  els.apiInput.value = state.apiKey;
  updateUI();
  addMessage('bot', ui[state.lang].welcome, true);
  updateWeather();
  
  // Chips
  document.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.apiKey) { els.apiStatus.textContent = ui[state.lang].errKey; return; }
      sendMessage(btn.dataset.msg);
      btn.parentElement.style.opacity = '0.5';
      btn.style.pointerEvents = 'none';
    });
  });

  els.clearBtn.addEventListener('click', () => {
    state.messages = [];
    els.messages.innerHTML = '';
    addMessage('bot', ui[state.lang].welcome, true);
    els.suggestions.style.opacity = '1';
    document.querySelectorAll('.chip').forEach(c => { c.style.pointerEvents = 'auto'; });
  });

  els.apiSave.addEventListener('click', () => {
    const k = els.apiInput.value.trim();
    if (!k) return els.apiStatus.textContent = ui[state.lang].errKey;
    state.apiKey = k; localStorage.setItem('nb_api', k);
    els.apiStatus.textContent = ui[state.lang].saveSuccess;
    setTimeout(() => els.apiStatus.textContent = '', 2000);
  });
}

function updateUI() {
  document.documentElement.lang = state.lang;
}

function addMessage(role, text, skipState = false) {
  if (!skipState) state.messages.push({ role, text });
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = text;
  els.messages.appendChild(div);
  scrollToBottom();
  return div;
}

function sendMessage(text) {
  if (state.isGenerating || !state.apiKey) return;
  state.isGenerating = true;
  addMessage('user', text);
  els.input.value = '';
  els.input.disabled = true;
  els.sendBtn.disabled = true;
  els.loading.classList.remove('hidden');
  scrollToBottom();

  streamGemini(text)
    .catch(err => {
      addMessage('bot', err.message === 'RATE' ? ui[state.lang].errRate : ui[state.lang].errApi);
    })
    .finally(() => {
      state.isGenerating = false;
      els.loading.classList.add('hidden');
      els.input.disabled = false;
      els.sendBtn.disabled = false;
      els.input.focus();
    });
}

els.form.addEventListener('submit', e => {
  e.preventDefault();
  const t = els.input.value.trim();
  if (t) sendMessage(t);
});

// 🌊 Streaming API
async function streamGemini(userText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${state.apiKey}&alt=sse`;
  const history = state.messages.slice(-3);
  const contents = [
    { role: "user", parts: [{ text: systemPrompt[state.lang] }] },
    { role: "model", parts: [{ text: state.lang === 'vi' ? "Dạ em hiểu rồi ạ. Em sẽ lên lịch trình ưu tiên các địa điểm trên, giọng điệu thân thiện nhé! 🌸" : "Understood! I'll plan the itinerary prioritizing those spots, with a friendly tone! 🌸" }] },
    ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
  ];

  const res = await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ contents }) });
  if (res.status === 429) throw new Error('RATE');
  if (!res.ok) throw new Error('API');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '', buffer = '';
  state.currentBotMsg = addMessage('bot', ''); // Tạo placeholder

  while (true) {
    const { value, done } = await reader.read();
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
        if (chunk) {
          fullText += chunk;
          state.currentBotMsg.textContent = fullText;
          state.currentBotMsg.innerHTML = fullText.replace(/\n/g, '<br>') + '<span class="cursor"></span>';
          scrollToBottom();
        }
      } catch {}
    }
  }
  
  state.currentBotMsg.innerHTML = fullText.replace(/\n/g, '<br>').replace(/  +/g, ' ');
  state.messages.push({ role: 'bot', text: fullText });
}

function scrollToBottom() {
  requestAnimationFrame(() => els.chatBox.scrollTop = els.chatBox.scrollHeight);
}

init();
