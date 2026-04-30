window.userData = { username: null, nama: null, role: null, menus: [] };

const API_URL = "https://script.google.com/macros/s/AKfycbwPHhi3EshYOuHkPl2-gSd7v4zIMa6Jm4Ja1B2fcPHq6TuuG1TkrWo3kFbllJ6xw5yHyQ/exec"; // !!! WAJIB ISI !!!

const getActiveUser = () => localStorage.getItem('activeUser');

// FUNGSI NAVIGASI
function navigateTo(pageId, lane = "") {
  const container = document.getElementById('app-container');
  const user = getActiveUser();

  if (user) {
    fetch(`${API_URL}?action=syncUserActivity&username=${user}&pageId=${pageId}&lane=${lane}`);
  }

  fetch(`./pages/${pageId}.html`)
    .then(res => { if(!res.ok) throw new Error(); return res.text(); })
    .then(html => {
      if (pageId === 'Login' || pageId === 'Dashboard_Layout') {
        container.innerHTML = html;
        executeScripts(container);
        if (pageId === 'Dashboard_Layout') setTimeout(initializeDashboard, 200);
      } else {
        const area = document.getElementById('content-area');
        if (area) { 
            area.innerHTML = html; 
            if(window.innerWidth < 768) toggleMobileMenu(); // Tutup menu jika di HP
            document.getElementById('mobile-page-title').innerText = pageId;
            setTimeout(() => executeScripts(area), 100); 
        }
      }
    })
    .catch(() => navigateTo('Login'));
}

function initializeDashboard() {
  const user = window.userData;
  if (!user || !user.menus) return;

  const menuContainer = document.getElementById('sidebar-menu');
  if (!menuContainer) return;
  menuContainer.innerHTML = '';

  const menus = user.menus;

  // 1. Identifikasi Root Items (Items yang Parent-nya kosong "")
  const rootItems = menus.filter(m => m.parent === "");

  rootItems.forEach(item => {
    // Cek apakah item ini punya anak?
    const children = menus.filter(m => m.parent === item.name);

    if (children.length > 0) {
      // JIKA PUNYA ANAK: Render sebagai Accordion (Collapse/Expand)
      menuContainer.appendChild(createCollapsibleMenu(item, children));
    } else {
      // JIKA TIDAK PUNYA ANAK: Render sebagai Tombol Biasa
      menuContainer.appendChild(createSimpleMenu(item));
    }
  });
}

// Tombol Menu Biasa (Tanpa Submenu)
function createSimpleMenu(item) {
  const btn = document.createElement('button');
  btn.className = "w-full flex items-center justify-between px-4 py-3 text-[11px] font-black text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all group uppercase tracking-widest";
  
  btn.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-base">${item.icon || '•'}</span>
      <span>${item.name}</span>
    </div>
  `;
  
  btn.onclick = () => {
    setActiveMenu(btn);
    navigateTo(item.pageId);
  };
  return btn;
}

// Tombol Menu Accordion (Dengan Submenu)
function createCollapsibleMenu(parentItem, children) {
  const container = document.createElement('div');
  container.className = "w-full mb-1";

  // Header Parent
  const header = document.createElement('button');
  header.className = "w-full flex items-center justify-between px-4 py-3 text-[11px] font-black text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all group uppercase tracking-widest";
  
  header.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-base">${parentItem.icon || '📁'}</span>
      <span>${parentItem.name}</span>
    </div>
    <svg class="chevron-icon w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path>
    </svg>
  `;

  // Container Submenu
  const subContainer = document.createElement('div');
  subContainer.className = "menu-group-content";

  children.forEach(child => {
    const subBtn = document.createElement('button');
    subBtn.className = "w-full text-left px-4 py-2.5 text-[10px] font-bold text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all uppercase tracking-widest submenu-item";
    subBtn.innerText = child.name;
    subBtn.onclick = () => {
      setActiveMenu(subBtn);
      navigateTo(child.pageId);
    };
    subContainer.appendChild(subBtn);
  });

  // Logika Klik untuk Expand/Collapse
  header.onclick = () => {
    const isOpen = subContainer.classList.contains('open');
    
    // Tutup semua menu lain yang sedang terbuka (Optional: Accordion Mode)
    document.querySelectorAll('.menu-group-content').forEach(el => el.classList.remove('open'));
    document.querySelectorAll('.chevron-icon').forEach(el => el.classList.remove('chevron-rotate'));

    if (!isOpen) {
      subContainer.classList.add('open');
      header.querySelector('.chevron-icon').classList.add('chevron-rotate');
    }
  };

  container.appendChild(header);
  container.appendChild(subContainer);
  return container;
}

// Helper untuk menandai menu yang sedang aktif
function setActiveMenu(element) {
  document.querySelectorAll('#sidebar-menu button').forEach(b => {
    b.classList.remove('text-amber-500', 'bg-zinc-800', 'border-l-4', 'border-amber-600');
  });
  element.classList.add('text-amber-500', 'bg-zinc-800');
}

// Fungsi Helper untuk Membuat Tombol Menu
function createMenuButton(m, isSubmenu) {
  const btn = document.createElement('button');
  // Styling: Jika submenu, beri margin kiri agar menjorok
  const paddingClass = isSubmenu ? "pl-8 pr-4" : "px-4";
  
  btn.className = `w-full flex items-center gap-3 ${paddingClass} py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all group`;
  
  // Gunakan Icon dari Sheet (Emoji) atau dot jika kosong
  const icon = m.icon ? m.icon : "•";
  
  btn.innerHTML = `
    <span class="text-lg group-hover:scale-110 transition-transform">${icon}</span>
    <span class="truncate">${m.name}</span>
  `;
  
  btn.onclick = () => {
    // Hapus status aktif dari tombol lain
    document.querySelectorAll('#sidebar-menu button').forEach(b => b.classList.remove('bg-zinc-800', 'text-white', 'border-r-2', 'border-amber-600'));
    // Tambah status aktif ke tombol ini
    btn.classList.add('bg-zinc-800', 'text-white', 'border-r-2', 'border-amber-600');
    
    navigateTo(m.pageId);
  };
  
  return btn;
}

// FUNGSI MOBILE MENU
function toggleMobileMenu() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if(sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

function executeScripts(container) {
  const scripts = container.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    const newScript = document.createElement('script');
    newScript.text = scripts[i].text;
    document.body.appendChild(newScript).parentNode.removeChild(newScript);
  }
}

function handleLogin(username, password) {
  const btn = document.getElementById('login-btn');
  btn.disabled = true; btn.innerText = "VERIFYING...";

  fetch(`${API_URL}?action=checkLogin&username=${username}&password=${password}`)
    .then(res => res.json())
    .then(res => {
      if (res.status === "success") {
        localStorage.setItem("activeUser", res.username);
        window.userData = res; // Simpan ke memori
        navigateTo('Dashboard_Layout');
      } else {
        btn.disabled = false; btn.innerText = "OTORISASI MASUK →";
        Swal.fire('Gagal!', res.message, 'error');
      }
    });
}

function handleLogout() {
  localStorage.clear();
  window.location.reload();
}

document.addEventListener('DOMContentLoaded', () => { navigateTo('Login'); });
