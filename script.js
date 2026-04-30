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
  if (!user || !user.username) return;

  // Isi Info User di Header
  document.getElementById('user-display-name').innerText = user.nama;
  document.getElementById('user-role').innerText = user.role;

  const menuContainer = document.getElementById('sidebar-menu');
  if (!menuContainer) return;
  menuContainer.innerHTML = '';

  // PROSES MENU: Kelompokkan berdasarkan Parent
  const menus = user.menus;
  
  // Ambil daftar Parent yang unik (yang tidak kosong)
  const categories = [...new Set(menus.map(m => m.parent).filter(p => p !== ""))];

  // 1. Render Menu Tanpa Parent (seperti Beranda/Dashboard)
  const topLevel = menus.filter(m => m.parent === "");
  topLevel.forEach(m => {
    menuContainer.appendChild(createMenuButton(m, false));
  });

  // 2. Render Menu Berdasarkan Group (Parent)
  categories.forEach(cat => {
    // Buat Header Kategori (Folder)
    const header = document.createElement('div');
    header.className = "text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-4 mt-6 mb-2";
    header.innerText = cat;
    menuContainer.appendChild(header);

    // Ambil semua menu yang masuk dalam parent ini
    const subMenus = menus.filter(m => m.parent === cat);
    subMenus.forEach(sm => {
      menuContainer.appendChild(createMenuButton(sm, true));
    });
  });
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
