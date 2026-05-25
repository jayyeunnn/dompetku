/**
 * Utility to parse Indonesian spoken sentences into transaction data.
 * Built for DompetKu - Personal Finance Tracker.
 */

/**
 * Parses numbers spoken in Indonesian (both written in words or digits) into numeric values.
 * E.g., "lima puluh ribu" -> 50000, "1.5 juta" -> 1500000, "25.000" -> 25000.
 */
export function parseIndonesianNumbers(text) {
  if (!text) return 0;
  
  // Clean text and remove "rupiah", then handle thousands separators vs decimals
  let cleanText = text.toLowerCase()
    .replace(/rupiah/gi, '')
    .replace(/[,.]/g, (match, offset, str) => {
      // If dot/comma is followed by exactly 3 digits and then non-digit or end of string,
      // it's likely a thousands separator (e.g., 50.000 or 150,000)
      const after = str.slice(offset + 1);
      if (/^\d{3}(?:\D|$)/.test(after)) {
        return ''; // remove thousands separator
      }
      return '.'; // keep decimal separator (e.g. 1.5 juta)
    })
    .trim();

  // 1. Handle digits optionally followed by multiplier words (e.g. "50 ribu", "1.5 juta")
  const digitPattern = /(\d+(?:\.\d+)?)\s*(ribu|juta|ratus|puluh)?/g;
  const digitMatches = [...cleanText.matchAll(digitPattern)];
  
  if (digitMatches.length > 0) {
    const firstMatch = digitMatches[0];
    let val = parseFloat(firstMatch[1]);
    const multiplier = firstMatch[2];
    
    if (multiplier === 'ribu') val *= 1000;
    else if (multiplier === 'juta') val *= 1000000;
    else if (multiplier === 'ratus') val *= 100;
    else if (multiplier === 'puluh') val *= 10;
    
    return val;
  }

  // 2. Parse verbal number words (e.g. "dua puluh lima ribu")
  const wordValues = {
    'nol': 0, 'satu': 1, 'se': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
    'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
    'sebelas': 11, 'seratus': 100, 'seribu': 1000, 'sejuta': 1000000
  };

  const words = cleanText.split(/\s+/);
  let total = 0;
  let group = 0;
  let temp = 0;
  let hasNumberWords = false;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    
    if (w === 'juta') {
      hasNumberWords = true;
      if (temp !== 0) {
        group += temp;
        temp = 0;
      }
      if (group === 0) group = 1;
      total += group * 1000000;
      group = 0;
    } else if (w === 'ribu') {
      hasNumberWords = true;
      if (temp !== 0) {
        group += temp;
        temp = 0;
      }
      if (group === 0) group = 1;
      total += group * 1000;
      group = 0;
    } else if (w === 'ratus') {
      hasNumberWords = true;
      if (temp === 0) temp = 1;
      group += temp * 100;
      temp = 0;
    } else if (w === 'puluh') {
      hasNumberWords = true;
      if (temp === 0) temp = 1;
      group += temp * 10;
      temp = 0;
    } else if (w === 'belas') {
      hasNumberWords = true;
      if (temp === 0) temp = 1;
      group += temp + 10;
      temp = 0;
    } else if (w === 'setengah') {
      hasNumberWords = true;
      temp = 0.5;
    } else if (wordValues[w] !== undefined) {
      hasNumberWords = true;
      const val = wordValues[w];
      if (w === 'sebelas') {
        temp = 11;
      } else if (w === 'sepuluh') {
        group += 10;
      } else if (w === 'seratus') {
        group += 100;
      } else if (w === 'seribu') {
        total += 1000;
      } else if (w === 'sejuta') {
        total += 1000000;
      } else {
        temp = val;
      }
    }
  }
  
  if (temp !== 0) {
    group += temp;
  }
  total += group;

  return hasNumberWords ? total : 0;
}

/**
 * Detects wallet ID from text matching user wallets list.
 */
export function detectWallet(text, wallets, isDestination = false) {
  if (!wallets || wallets.length === 0) return null;
  const lowercaseText = text.toLowerCase();
  
  if (isDestination) {
    // Look for phrases like "ke [wallet]" or "tujuan [wallet]"
    const destinationKeywords = [
      /ke\s+(\w+(?:\s+\w+)?)/g,
      /tujuan\s+(\w+(?:\s+\w+)?)/g
    ];
    for (const regex of destinationKeywords) {
      const matches = [...lowercaseText.matchAll(regex)];
      for (const match of matches) {
        const potentialWalletName = match[1];
        const matched = wallets.find(w => {
          const wName = w.name.toLowerCase();
          return wName.includes(potentialWalletName) || 
                 potentialWalletName.includes(wName) ||
                 (wName === 'blu by bca' && potentialWalletName.includes('bca'));
        });
        if (matched) return matched.id;
      }
    }
  } else {
    // Look for source wallet, e.g. "dari [wallet]", "pakai [wallet]", "menggunakan [wallet]"
    const sourceKeywords = [
      /dari\s+(\w+(?:\s+\w+)?)/g,
      /pakai\s+(\w+(?:\s+\w+)?)/g,
      /menggunakan\s+(\w+(?:\s+\w+)?)/g
    ];
    for (const regex of sourceKeywords) {
      const matches = [...lowercaseText.matchAll(regex)];
      for (const match of matches) {
        const potentialWalletName = match[1];
        const matched = wallets.find(w => {
          const wName = w.name.toLowerCase();
          return wName.includes(potentialWalletName) || 
                 potentialWalletName.includes(wName) ||
                 (wName === 'blu by bca' && potentialWalletName.includes('bca'));
        });
        if (matched) return matched.id;
      }
    }
  }

  // Fallback: search for any occurrence of wallet name or its alias in the text
  const sortedWallets = [...wallets].sort((a, b) => b.name.length - a.name.length);
  for (const w of sortedWallets) {
    const wName = w.name.toLowerCase();
    const aliases = [wName];
    
    if (wName === 'blu by bca') {
      aliases.push('bca', 'rekening bca', 'blu bca');
    } else if (wName === 'gopay') {
      aliases.push('go pay', 'go-pay');
    } else if (wName === 'cash') {
      aliases.push('tunai', 'dompet cash', 'kantong cash');
    }
    
    for (const alias of aliases) {
      if (lowercaseText.includes(alias)) {
        return w.id;
      }
    }
  }
  
  return null;
}

/**
 * Detects category ID from text matching category keywords.
 */
export function detectCategory(text, categories) {
  if (!categories || categories.length === 0) return null;
  const lowercaseText = text.toLowerCase();
  
  const keywordMap = {
    'expense-food': ['makan', 'minum', 'makanan', 'minuman', 'bakso', 'kopi', 'nasi', 'sarapan', 'siang', 'malam', 'cemilan', 'snack', 'restoran', 'warung', 'café', 'cafe', 'teh', 'jus'],
    'expense-transport': ['transport', 'transportasi', 'ojek', 'gojek', 'grab', 'maxim', 'bensin', 'pertamax', 'pertalite', 'tol', 'parkir', 'mobil', 'motor', 'bus', 'kereta', 'tiket', 'grabcar', 'grabbike', 'goride', 'gocar'],
    'expense-household': ['rumah', 'tangga', 'listrik', 'air', 'pdam', 'pln', 'token', 'sabun', 'shampoo', 'detergen', 'belanja bulanan', 'supermarket', 'indomaret', 'alfamart', 'sembako', 'beras', 'minyak'],
    'expense-peripheral': ['mouse', 'keyboard', 'headphone', 'headset', 'peripheral', 'mousepad', 'kabel', 'charger'],
    'expense-hardware': ['hardware', 'komponen', 'pc', 'komputer', 'vga', 'ram', 'ssd', 'prosesor', 'processor', 'motherboard', 'mainboard', 'casing', 'psu', 'monitor'],
    'expense-games': ['game', 'games', 'belanja game', 'steam', 'epic', 'playstation', 'ps5', 'xbox', 'nintendo', 'topup game', 'top up', 'diamond', 'mobile legends', 'pubg', 'genshin'],
    'expense-subscription': ['langganan', 'subscribe', 'subscription', 'netflix', 'spotify', 'youtube', 'disney', 'prime', 'hosting', 'domain', 'cloud'],
    'expense-photography': ['foto', 'kamera', 'lensa', 'photography', 'videography', 'video', 'tripod', 'sdcard', 'memori'],
    'expense-health': ['sehat', 'sakit', 'obat', 'dokter', 'klinik', 'apotek', 'puskesmas', 'rs', 'rumah sakit', 'vitamin', 'gym', 'olahraga', 'sepatu lari', 'futsal', 'badminton'],
    'expense-fashion': ['baju', 'celana', 'pakaian', 'kaos', 'jaket', 'hoodie', 'sepatu', 'tas', 'sandal', 'fashion', 'penampilan', 'potong rambut', 'barbershop', 'skincare'],
    'income-salary': ['gaji', 'salary', 'pekerjaan', 'kantor', 'bulanan', 'upah'],
    'income-freelance': ['freelance', 'proyek', 'project', 'sampingan', 'jasa coding', 'desain', 'klien', 'client'],
    'income-side': ['hadiah', 'gift', 'thr', 'bonus', 'angpao', 'sodaqoh', 'sedekah', 'dikasih', 'menang', 'untung']
  };

  // 1. Direct name match
  for (const cat of categories) {
    if (lowercaseText.includes(cat.name.toLowerCase())) {
      return cat.id;
    }
  }

  // 2. Keyword match
  for (const [catId, keywords] of Object.entries(keywordMap)) {
    for (const keyword of keywords) {
      if (lowercaseText.includes(keyword)) {
        const exists = categories.some(cat => cat.id === catId);
        if (exists) return catId;
      }
    }
  }

  return null;
}

/**
 * Cleans the spoken transcript to extract a clean description.
 */
export function detectDescription(text) {
  if (!text) return '';
  
  const descKeywords = [
    /catatannya\s+(.+)/i,
    /catatan\s+(.+)/i,
    /keterangannya\s+(.+)/i,
    /keterangan\s+(.+)/i,
    /untuk\s+(.+)/i,
    /buat\s+(.+)/i,
    /deskripsi\s+(.+)/i
  ];
  
  for (const regex of descKeywords) {
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Natural fallback: remove common grammar and return the rest
  let desc = text
    .replace(/^(pengeluaran|pemasukan|transfer|kirim|pindah)\s+/i, '')
    .replace(/(dari|ke|pakai|menggunakan|ke arah)\s+\w+(\s+\w+)?/gi, '') // remove wallets
    .replace(/(\d+(?:\.\d+)?)\s*(ribu|juta|ratus|rupiah)?/gi, '') // remove numbers/amounts
    .replace(/(nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|seratus|seribu|sejuta|belas|puluh|ratus|ribu|juta|setengah|rupiah)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  if (desc.length > 0) {
    return desc.charAt(0).toUpperCase() + desc.slice(1);
  }
  
  return text; // fallback to full transcript
}

/**
 * Detects if the user spoke "kemarin" (yesterday) to record on H-1.
 */
export function detectDate(text) {
  const lowercaseText = text.toLowerCase();
  
  if (lowercaseText.includes('kemarin')) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  
  // Default: Today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Main parser entry point.
 */
export function parseVoiceTransaction(transcript, wallets = [], categories = []) {
  if (!transcript) return null;
  
  const text = transcript.trim();
  const lowercaseText = text.toLowerCase();
  
  // 1. Detect Tipe Transaksi
  let type = 'expense';
  if (lowercaseText.includes('transfer') || lowercaseText.includes('kirim') || lowercaseText.includes('pindah')) {
    type = 'transfer';
  } else if (lowercaseText.includes('pemasukan') || lowercaseText.includes('masuk') || lowercaseText.includes('gaji') || lowercaseText.includes('dapat') || lowercaseText.includes('bonus') || lowercaseText.includes('terima')) {
    type = 'income';
  }
  
  // 2. Parse Amount
  const amount = parseIndonesianNumbers(text);
  
  // 3. Detect Wallet(s)
  let walletId = '';
  let destWalletId = '';
  
  if (type === 'transfer') {
    walletId = detectWallet(text, wallets, false);
    destWalletId = detectWallet(text, wallets, true);
    
    // Fallback: If both map to the same wallet or dest wallet is missing
    if (walletId && !destWalletId) {
      const otherWallet = wallets.find(w => w.id !== walletId && lowercaseText.includes(w.name.toLowerCase()));
      if (otherWallet) destWalletId = otherWallet.id;
    }
  } else {
    walletId = detectWallet(text, wallets, false);
  }
  
  // 4. Detect Category
  let categoryId = '';
  if (type !== 'transfer') {
    categoryId = detectCategory(text, categories);
  }
  
  // 5. Detect Description
  const description = detectDescription(text);
  
  // 6. Detect Date
  const date = detectDate(text);
  
  return {
    type,
    amount,
    walletId,
    destWalletId,
    categoryId,
    description,
    date,
    rawTranscript: text
  };
}
