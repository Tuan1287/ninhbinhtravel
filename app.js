// Cấu hình & trạng thái
const state = {
  lang: localStorage.getItem('nb_lang') || 'vi',
  apiKey: localStorage.getItem('nb_api') || '',
  messages: [],
  isGenerating: false
};

const systemPrompt = {
  vi: "Bạn là trợ lý du lịch AI chuyên về Ninh Bình. Luôn gợi ý lịch trình 2 ngày 1 đêm khi được hỏi. Trả lời ngắn gọn, thực tế, có cấu trúc: điểm đến, ăn uống, di chuyển, lưu ý. Chỉ trả lời bằng tiếng Việt.",
  en: "You are an AI travel assistant specializing in Ninh Bình, Vietnam. Always suggest a 2-day 1-night itinerary when asked. Keep answers concise, practical, structured: places, food, transport, tips. Reply only in English."
};

// DOM Elements
const els = {
  title: document.getElementById('site-title'),
  langBtn: document.getElementById('lang-toggle'),
  apiInput: document.getElementById('api-key'),
  apiSave: document.getElementById('api-save'),
  apiStatus: document.getElementById('api-status'),
  chatBox: document.getElementById('chat-container'),
  messages: document.getElementById('messages'),
  loading: document.getElementById('loading'),
  form: document.getElementById('input-form'),
  input: document.getElementById('user-input'),
  sendBtn: document.getElementById('send-btn')
};

// Từ điển UI
const ui = {
  vi: {
    title: "Ninh Bình Travel",
    apiPlaceholder: "Nhập Gemini API Key của bạn...",
    save: "Lưu",
    sendPlaceholder: "Hỏi về lịch trình 2 ngày 1 đêm tại Ninh Bình...",
    saveSuccess: "✅ API Key đã lưu",
    saveError: "❌ Key không hợp lệ hoặc rỗng",
    needKey: "⚠️ Vui lòng nhập API Key trước khi chat",
    errApi: "❌ Lỗi kết nối API. Kiểm tra Key hoặc thử lại sau.",
    errRate: "⚠️ Quá giới hạn gọi API. Chờ một chút..."
  },
  en: {
    title: "Ninh Bình Travel",
    apiPlaceholder: "Enter your Gemini API Key...",
    save: "Save",
    sendPlaceholder: "Ask about your 2-day 1-night trip to Ninh Bình...",
    saveSuccess: "✅ API Key saved",
    saveError: "❌ Invalid or empty Key",
    needKey: "⚠️ Please enter an API Key before chatting",
    errApi: "❌ API error. Check your Key or try later.",
    errRate: "⚠️ Rate limit exceeded. Please wait..."
  }
};

// Khởi tạo
function init() {
  els.apiInput.value = state.apiKey;
  els.langBtn.textContent = state.lang.toUpperCase();
  updateUI();
  els.messages.innerHTML = '';
  
  // Welcome message
  addMessage('bot', state.lang === 'vi' 
    ? "Chào bạn! Tôi có thể giúp bạn lên lịch trình 2 ngày 1 đêm tại Ninh Bình. Bạn muốn bắt đầu ở khu vực nào (Tràng An, Tam Cốc, Bái Đính, Vân Long...)? 🌿"
    : "Hello! I can help you plan a 2-day 1-night trip to Ninh Bình. Where would you like to start (Tràng An, Tam Cốc, Bai Dinh, Van Long...)? 🌿"
  );
}

function updateUI() {
  const t = ui[state.lang];
  els.title.textContent = t.title;
  els.apiInput.placeholder = t.apiPlaceholder;
  els.apiSave.textContent = t.save;
  els.input.placeholder = t.sendPlaceholder;
  document.documentElement.lang = state.lang;
}

// Chuyển ngôn ngữ
els.langBtn.addEventListener('click', () => {
  state.lang = state.lang === 'vi' ? 'en' : 'vi';
  localStorage.setItem('nb_lang', state.lang);
  els.langBtn.textContent = state.lang.toUpperCase();
  updateUI();
});

// Lưu API Key
els.apiSave.addEventListener('click', () => {
  const key = els.apiInput.value.trim();
  if (!key) {
    els.apiStatus.textContent = ui[state.lang].saveError;
    return;
  }
  state.apiKey = key;
  localStorage.setItem('nb_api', key);
  els.apiStatus.textContent = ui[state.lang].saveSuccess;
  setTimeout(() => els.apiStatus.textContent = '', 2000);
});

// Gửi tin nhắn
els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = els.input.value.trim();
  if (!text || state.isGenerating) return;
  if (!state.apiKey) {
    els.apiStatus.textContent = ui[state.lang].needKey;
    return;
  }

  addMessage('user', text);
  els.input.value = '';
  els.input.disabled = true;
  els.sendBtn.disabled = true;
  state.isGenerating = true;
  els.loading.classList.remove('hidden');
  scrollToBottom();

  try {
    const reply = await callGemini(text);
    addMessage('bot', reply);
  } catch (err) {
    addMessage('bot', err.message === 'RATE_LIMIT' ? ui[state.lang].errRate : ui[state.lang].errApi);
  } finally {
    state.isGenerating = false;
    els.loading.classList.add('hidden');
    els.input.disabled = false;
    els.sendBtn.disabled = false;
    els.input.focus();
  }
});

function addMessage(role, text) {
  state.messages.push({ role, text });
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = text; // Chống XSS tự động
  els.messages.appendChild(div);
  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(() => els.chatBox.scrollTop = els.chatBox.scrollHeight);
}

// Gọi Gemini API
async function callGemini(userText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`;
  
  // Chuẩn bị context (giữ 4 tin nhắn gần nhất để tránh tràn token)
  const history = state.messages.slice(-4);
  const contents = [
    { role: "user", parts: [{ text: systemPrompt[state.lang] }] },
    { role: "model", parts: [{ text: state.lang === 'vi' ? "Đã rõ. Tôi sẽ hỗ trợ bạn lập lịch trình 2N1Đ tại Ninh Bình." : "Understood. I'll help you plan a 2D1N trip to Ninh Bình." }] },
    ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents })
  });

  if (response.status === 429) throw new Error('RATE_LIMIT');
  if (!response.ok) throw new Error('API_ERROR');

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

// Khởi chạy
init();
