// 🎯 CẤU HÌNH ỨNG DỤNG
const CONFIG = {
  // Gemini API
  GEMINI_MODEL: 'gemini-2.5-flash',
  GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',
  
  // Danh sách địa điểm ưu tiên
  PREFERRED_PLACES: {
    restaurants: [
      "Cơm niêu Ninh Bình",
      "Nhà hàng Vũ Gia",
      "Bánh cuốn Bà Hoành",
      "Dê núi Trường Yên",
      "Quán Chay Ngọc Mai"
    ],
    attractions: [
      "Tràng An",
      "Tam Cốc - Bích Động",
      "Hang Múa",
      "Chùa Bái Đính",
      "Vườn chim Thung Nham",
      "Vân Long"
    ],
    stays: [
      "Tam Coc Garden",
      "Ninh Bình Legend Hotel",
      "Yên Ninh Boutique",
      "Homestay Mây View Ruộng",
      "Mường Thanh Grand"
    ]
  },
  
  // State management
  state: {
    lang: localStorage.getItem('nb_lang') || 'vi',
    apiKey: localStorage.getItem('nb_api') || '',
    messages: [],
    isGenerating: false
  },
  
  // Helper: Get/Save state
  getState: (key) => CONFIG.state[key],
  setState: (key, value) => {
    CONFIG.state[key] = value;
    if (key === 'lang') localStorage.setItem('nb_lang', value);
    if (key === 'apiKey') localStorage.setItem('nb_api', value);
  }
};

// Export cho các file khác dùng (nếu cần)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
