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

/* 4.6.2 - Advanced Dashboard & Navigation Logic */

// 1. Fungsi Logout dengan Pembersihan Sesi
window.handleLogout = function() {
  Swal.fire({
    title: 'TERMINATE_SESSION?',
    text: "Sesi akses akan ditutup secara permanen.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#000',
    cancelButtonColor: '#27272a',
    confirmButtonText: 'LOGOUT',
    customClass: { popup: 'rounded-none' }
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload(); // Paksa kembali ke Login
    }
  });
};

/* 4.9.2 - Smart Navigation Guard */
window.navigateTo = async function(pageId) {
  const contentArea = document.getElementById('content-area');
  const titleArea = document.getElementById('current-page-title');
  
  if (!pageId || pageId.trim() === "") return;

  try {
    const response = await fetch(`./pages/${pageId}.html`);
    
    if (!response.ok) {
      // JIKA FILE TIDAK ADA DI GITHUB: Render "MODUL_OFFLINE" UI
      if (contentArea) {
        contentArea.innerHTML = `
          <div class="flex flex-col items-center justify-center h-full border border-zinc-100 p-20 text-center">
            <h2 class="text-xs font-black uppercase tracking-[0.5em] text-zinc-900 mb-4 italic">Module_Not_Found</h2>
            <div class="h-[1px] w-12 bg-zinc-900 mb-8"></div>
            <p class="text-[10px] font-mono text-zinc-300 uppercase leading-loose max-w-xs">
              Sistem tidak menemukan file [${pageId}.html] di dalam direktori repository.
            </p>
          </div>
        `;
        titleArea.innerText = "System_Error";
        return;
      }
      throw new Error("PAGE_MISSING");
    }

    const html = await response.text();
    // Jika ganti layout besar (Login/Dashboard)
    if (pageId === 'Login' || pageId === 'Dashboard_Layout') {
      document.getElementById('app-container').innerHTML = html;
      if (pageId === 'Dashboard_Layout') setTimeout(window.initializeDashboard, 100);
    } else {
      contentArea.innerHTML = html;
      titleArea.innerText = pageId.replace(/_/g, ' ');
    }

  } catch (e) {
    console.error("Nav Error:", e);
    // Hanya lempar ke login jika core system yang error
    if (pageId !== 'Login' && !contentArea) window.navigateTo('Login');
  }
};

/* 4.8.2 - Sharp Hierarchical Sidebar Renderer */
window.initializeDashboard = function() {
  const user = window.userData;
  const menuContainer = document.getElementById('exec-sidebar-nav');
  if(!user || !menuContainer) return;

  // 1. Update Profile Info
  document.getElementById('exec-name').innerText = user.nama;
  document.getElementById('exec-role').innerText = user.role;
  menuContainer.innerHTML = '';

  // 2. Filter Menu: Pisahkan Root (Parent Kosong)
  const rootMenus = user.menus.filter(m => !m.parent || m.parent === "");

  rootMenus.forEach((item, idx) => {
    // Cari anak-anaknya (items yang kolom Parent-nya adalah nama item ini)
    const children = user.menus.filter(m => m.parent === item.name);

    if (item.pageId && item.pageId.trim() !== "") {
      // KASUS A: Standalone Button (Tanpa Folder)
      menuContainer.appendChild(renderStandaloneButton(item));
    } else if (children.length > 0) {
      // KASUS B: Accordion Folder (Jika Page ID Kosong & Punya Anak)
      const gId = `group-${idx}`;
      menuContainer.appendChild(renderAccordionFolder(item, children, gId));
    }
  });

  if(!window.sessionGuardianActive) startSessionGuardian();
};

/* Komponen A: Tombol Tunggal (Sharp Style) */
function renderStandaloneButton(item) {
  const btn = document.createElement('button');
  btn.className = "w-full flex items-center gap-4 px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] hover:bg-zinc-900 hover:text-white transition-all border-b border-zinc-900";
  btn.innerHTML = `
    <span class="text-xs grayscale group-hover:grayscale-0">${item.icon || '■'}</span>
    <span class="truncate">${item.name}</span>
  `;
  btn.onclick = () => window.navigateTo(item.pageId);
  return btn;
}

/* Komponen B: Folder Accordion (Sharp Style) */
function renderAccordionFolder(parent, children, gId) {
  const container = document.createElement('div');
  container.className = "border-b border-zinc-900";
  
  container.innerHTML = `
    <button onclick="document.getElementById('${gId}').classList.toggle('hidden'); this.querySelector('svg').classList.toggle('rotate-180')" 
      class="w-full px-8 py-4 flex items-center justify-between bg-zinc-900/30 hover:bg-zinc-900 transition-all group">
      <div class="flex items-center gap-4">
        <span class="text-xs">${parent.icon || '📁'}</span>
        <span class="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] group-hover:text-zinc-400">${parent.name}</span>
      </div>
      <svg class="w-3 h-3 text-zinc-800 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M19 9l-7 7-7-7" stroke-width="3"/>
      </svg>
    </button>
    <div id="${gId}" class="hidden bg-black/20">
      ${children.map(m => `
        <button onclick="navigateTo('${m.pageId}')" 
          class="w-full flex items-center gap-4 px-12 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] hover:text-white hover:bg-zinc-900 border-l-2 border-transparent hover:border-amber-500 transition-all">
          <span class="text-xs grayscale">${m.icon || '○'}</span>
          <span class="truncate">${m.name}</span>
        </button>
      `).join('')}
    </div>
  `;
  return container;
}

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

/* 4.5.2 - Mobile Toggle & Accordion Logic */
window.toggleMobileSidebar = function() {
  const sidebar = document.getElementById('main-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('-translate-x-full');
  overlay.classList.toggle('hidden');
};

window.toggleGroup = function(groupId) {
  const content = document.getElementById(groupId);
  const icon = document.getElementById('icon-' + groupId);
  content.classList.toggle('hidden');
  if(icon) icon.classList.toggle('rotate-180');
};
