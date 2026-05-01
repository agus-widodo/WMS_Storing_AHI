/* 1.1.1 - Configuration & Environment Setup */
const API_CONFIG = {
  // Masukkan URL Apps Script Anda di sini
  DEV_URL: "https://script.google.com/macros/s/AKfycbxnpvo68iaT0IZwBiuCvPOf_Cx8wqHx8t_SRUGlrU3N/dev", 
  PROD_URL: "https://script.google.com/macros/s/AKfycbyiOtJwKoIoC8Z7a9c_qVwv6_b5Yz4uTe3OzJEYe6K7ZMfxB7Zuy0PX2fZaqO9a_aiU_w/exec",
  IS_LOCAL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
};

window.userData = { username: null, nama: null, role: null, menus: [] };

/* 1.1.2 - Core Logic: Fetch, Navigate, Auth */

// A. Mesin Pengambil Data (JSONP Bypass)
window.smartFetch = async function(params) {
  const baseUrl = API_CONFIG.IS_LOCAL ? API_CONFIG.DEV_URL : API_CONFIG.PROD_URL;
  const callbackName = `cb_${Math.random().toString(36).substring(7)}`;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = callbackName;
    window[callbackName] = (data) => {
      resolve(data);
      document.getElementById(callbackName)?.remove();
      delete window[callbackName];
    };
    const queryString = new URLSearchParams({ ...params, callback: callbackName }).toString();
    script.src = `${baseUrl}?${queryString}`;
    script.onerror = () => reject("Network Error");
    document.body.appendChild(script);
  });
};

// B. Mesin Navigasi Halaman
window.navigateTo = async function(pageId) {
  const container = document.getElementById('app-container');
  try {
    const response = await fetch(`./pages/${pageId}.html`);
    if (!response.ok) throw new Error("File not found");
    const html = await response.text();
    container.innerHTML = html;
    
    // Aktifkan Script internal di dalam HTML yang dimuat
    const scripts = container.querySelectorAll('script');
    scripts.forEach(s => {
      const n = document.createElement('script');
      n.text = s.text;
      document.body.appendChild(n).parentNode.removeChild(n);
    });

    // Jalankan inisialisasi khusus jika masuk ke Dashboard
    if (pageId === 'Dashboard_Layout') setTimeout(window.initializeDashboard, 100);
  } catch (e) {
    console.error("Nav Error:", e);
    if (pageId !== 'Login') window.navigateTo('Login');
  }
};

// C. Logika Dashboard Shell
window.initializeDashboard = function() {
  const user = window.userData;
  if (!user.username) return window.navigateTo('Login');

  if(document.getElementById('user-name-display')) document.getElementById('user-name-display').innerText = user.nama;
  if(document.getElementById('user-role-display')) document.getElementById('user-role-display').innerText = user.role;

  // Render Sidebar Menu
  const menuContainer = document.getElementById('sidebar-menu');
  if (menuContainer && user.menus) {
    menuContainer.innerHTML = user.menus.map(m => `
      <button onclick="navigateTo('${m.pageId}')" class="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg hover:bg-zinc-900 hover:text-white transition-all group">
        <div class="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-amber-500"></div>
        <span class="uppercase tracking-widest">${m.name}</span>
      </button>
    `).join('');
  }
};

/* 1.1.3 - App Entry Point */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Render Connection Badge
  const badge = document.createElement('div');
  badge.className = "fixed bottom-4 right-4 flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full z-[9999] text-[10px] font-mono text-zinc-400 uppercase";
  badge.innerHTML = `<div class="w-1.5 h-1.5 rounded-full ${API_CONFIG.IS_LOCAL ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}"></div>${API_CONFIG.IS_LOCAL ? 'Dev Mode' : 'Prod Mode (Live)'}`;
  document.body.appendChild(badge);

  // 2. Jalankan Navigasi Pertama (Ke Login)
  window.navigateTo('Login');
});

/* 4.2.2 - Advanced Sidebar Renderer with Grouping */
window.initializeDashboard = function() {
  const user = window.userData;
  if (!user || !user.username) return window.navigateTo('Login');

  document.getElementById('exec-name').innerText = user.nama;
  document.getElementById('exec-role').innerText = user.role;

  const menuContainer = document.getElementById('exec-sidebar-nav');
  menuContainer.innerHTML = '';

  // 1. Grouping Logic: Pisahkan menu berdasarkan Parent
  const groups = {};
  user.menus.forEach(m => {
    const p = m.parent || "MAIN_ACCESS";
    if (!groups[p]) groups[p] = [];
    groups[p].push(m);
  });

  // 2. Render Loop
  Object.keys(groups).forEach(groupName => {
    const section = document.createElement('div');
    section.className = "border-b border-zinc-900";
    
    // Header Group (FOLDER)
    section.innerHTML = `
      <div class="px-6 py-3 bg-zinc-900/30 flex items-center justify-between group cursor-default">
        <span class="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">${groupName}</span>
      </div>
      <div id="group-${groupName.replace(/\s+/g, '')}" class="flex flex-col">
        ${groups[groupName].map(m => `
          <button onclick="navigateTo('${m.pageId}')" 
            class="w-full flex items-center gap-4 px-8 py-3.5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] hover:bg-zinc-900 hover:text-white transition-all border-l-2 border-transparent hover:border-amber-500">
            <span class="text-xs">${m.icon || '○'}</span>
            <span class="truncate">${m.name}</span>
          </button>
        `).join('')}
      </div>
    `;
    menuContainer.appendChild(section);
  });

  // Jalankan Sesi Guardian (Cek tiap 30 detik)
  if(!window.sessionGuardianActive) startSessionGuardian();
};

