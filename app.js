// 🎯 ỨNG DỤNG NINH BÌNH TRAVEL
// Logic chính + Typing Effect + Layout + Clean Text

// DOM Elements
const elements = {
  siteTitle: document.getElementById('site-title'),
  weather: document.getElementById('weather-badge'),
  langToggle: document.getElementById('lang-toggle'),
  disclaimer: document.getElementById('disclaimer'),
  apiInput: document.getElementById('api-key'),
  apiSave: document.getElementById('api-save'),
  apiStatus: document.getElementById('api-status'),
  messages: document.getElementById('messages'),
  suggestions: document.getElementById('suggestions'),
  chatBox: document.getElementById('chat-container'),
  loading: document.getElementById('loading'),
  form: document.getElementById('input-form'),
  input: document.getElementById('user-input'),
  sendBtn: document.getElementById('send-btn'),
  clearBtn: document.getElementById('clear-chat')
};

// 🎯 Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  elements.apiInput.value = CONFIG.getState('apiKey');
  applyLanguage();
  updateWeather();
  
  if (CONFIG.getState('messages').length === 0) {
    addMessage('bot', getText('welcome'));
  }
  
  setupEventListeners();
}

function setupEventListeners() {
  elements.langToggle?.addEventListener('click', () => {
    const newLang = CONFIG.getState('lang') === 'vi' ? 'en' : 'vi';
    CONFIG.setState('lang', newLang);
    applyLanguage();
  });
  
  elements.apiSave.addEventListener('click', saveApiKey);
  elements.clearBtn.addEventListener('click', clearChat);
  
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => handleChipClick(chip.dataset.msg));
  });
  
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = elements.input.value.trim();
    if (text) handleSend(text);
  });
}

// 🌐 Apply language
function applyLanguage() {
  const lang = CONFIG.getState('lang');
  elements.siteTitle.textContent = getText('title');
  elements.disclaimer.textContent = getText('disclaimer');
  elements.apiInput.placeholder = getText('apiPlaceholder');
  elements.apiSave.textContent = getText('saveBtn');
  elements.input.placeholder = getText('inputPlaceholder');
  elements.langToggle.textContent = lang.toUpperCase();
  document.documentElement.lang = lang;
  
  document.querySelectorAll('.chip').forEach(chip => {
    const key = chip.dataset.msg;
    const chipText = getText('chips', key);
    if (chipText) chip.textContent = chipText;
  });
  
  const firstBot = elements.messages.querySelector('.message.bot');
  if (firstBot && CONFIG.getState('messages').length <= 1) {
    firstBot.textContent = getText('welcome');
  }
}

// 💾 Save API Key
function saveApiKey() {
  const key = elements.apiInput.value.trim();
  if (!key) {
    elements.apiStatus.textContent = getText('saveErr');
    return;
  }
  CONFIG.setState('apiKey', key);
  elements.apiStatus.textContent = getText('saveOk');
  setTimeout(() => elements.apiStatus.textContent = '', 2500);
}

// 💬 Chat functions
function addMessage(role, text, isTyping = false) {
  if (role === 'user') CONFIG.getState('messages').push({ role, text });
  
  const div = document.createElement('div');
  div.className = `message ${role}`;
  if (isTyping) div.innerHTML = '<span class="typing-cursor"></span>';
  else div.textContent = text;
  
  elements.messages.appendChild(div);
  scrollToBottom();
  return div;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
  });
}

// 🧹 Clean & Format AI Response (Xóa dấu *, giữ xuống dòng)
function formatAIResponse(rawText) {
  if (!rawText) return '';
  // Chuyển **bold** thành <strong>, xóa * lẻ, giữ \n
  let cleaned = rawText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  cleaned = cleaned.replace(/\*/g, '');
  cleaned = cleaned.replace(/\n/g, '<br>');
  return cleaned.trim();
}

// ⌨️ Typing Effect (Giả lập gõ chữ mượt mà)
async function typeMessage(element, plainText, finalHTML, speed = 12) {
  return new Promise(resolve => {
    let i = 0;
    function type() {
      if (i < plainText.length) {
        element.innerHTML = plainText.substring(0, i + 1) + '<span class="typing-cursor"></span>';
        i++;
        scrollToBottom();
        setTimeout(type, speed);
      } else {
        element.innerHTML = finalHTML; // Áp dụng format HTML khi gõ xong
        element.querySelector('.typing-cursor')?.remove();
        resolve();
      }
    }
    type();
  });
}

// 📤 Handle send
async function handleSend(text) {
  if (CONFIG.getState('isGenerating') || !CONFIG.getState('apiKey')) {
    if (!CONFIG.getState('apiKey')) elements.apiStatus.textContent = getText('needKey');
    return;
  }
  
  // Ẩn gợi ý sau lần chat đầu tiên
  if (CONFIG.getState('messages').length === 0 && elements.suggestions) {
    elements.suggestions.classList.add('hidden');
  }
  
  CONFIG.setState('isGenerating', true);
  addMessage('user', text);
  elements.input.value = '';
  elements.input.disabled = true;
  elements.sendBtn.disabled = true;
  elements.loading.classList.remove('hidden');
  scrollToBottom();
  
  try {
    const rawReply = await callGemini(text);
    const formattedHTML = formatAIResponse(rawReply);
    const plainText = formattedHTML.replace(/<[^>]*>/g, ''); // Lấy text thuần để gõ
    
    const botMsg = addMessage('bot', '', true); // Tạo placeholder có con trỏ
    await typeMessage(botMsg, plainText, formattedHTML);
    
    CONFIG.getState('messages').push({ role: 'bot', text: rawReply });
  } catch (err) {
    console.error('❌ Error:', err);
    let errMsg = getText('errApi');
    if (err.message === 'RATE_LIMIT') errMsg = getText('errRate');
    if (err.message === 'INVALID_MODEL') errMsg = getText('errModel');
    if (err.message === 'INVALID_API_KEY') errMsg = getText('errInvalidKey');
    addMessage('bot', errMsg);
  } finally {
    CONFIG.setState('isGenerating', false);
    elements.loading.classList.add('hidden');
    elements.input.disabled = false;
    elements.sendBtn.disabled = false;
    elements.input.focus();
  }
}

// 🤖 Call Gemini API
async function callGemini(userText) {
  const { GEMINI_MODEL, GEMINI_API_BASE } = CONFIG;
  const apiKey = CONFIG.getState('apiKey');
  const lang = CONFIG.getState('lang');
  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  
  const history = CONFIG.getState('messages').slice(-4).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));
  
  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPTS[lang] }] },
    { role: "model", parts: [{ text: lang === 'vi' ? "Dạ em hiểu rồi ạ! 🌸" : "Got it! 🌸" }] },
    ...history,
    { role: "user", parts: [{ text: userText }] }
  ];
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, topK: 40, topP: 0.95 } })
  });
  
  if (response.status === 400) {
    const err = await response.json();
    if (err.error?.message?.includes('models/')) throw new Error('INVALID_MODEL');
    throw new Error('INVALID_REQUEST');
  }
  if (response.status === 401 || response.status === 403) throw new Error('INVALID_API_KEY');
  if (response.status === 429) throw new Error('RATE_LIMIT');
  if (!response.ok) throw new Error('API_ERROR');
  
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || getText('noResponse');
}

// 🌤️ Weather
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
    localStorage.setItem('nb_weather', JSON.stringify({  w, time: Date.now() }));
    renderWeather(w);
  } catch { renderWeather({ temp: '-', code: 0, wind: '-' }); }
}

function renderWeather(w) {
  const map = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',51:'🌦️',53:'🌧️',61:'🌧️',80:'⛈️',95:'🌩️'};
  elements.weather.textContent = `${map[w.code]||'🌡️'} ${w.temp}°C | Gió ${w.wind}km/h`;
}

// 🗑️ Clear chat
function clearChat() {
  CONFIG.getState('messages').length = 0;
  elements.messages.innerHTML = '';
  elements.suggestions?.classList.remove('hidden'); // Hiện lại gợi ý khi xóa chat
  addMessage('bot', getText('welcome'));
}
