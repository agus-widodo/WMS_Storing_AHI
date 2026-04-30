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

// ISI DATA DASHBOARD (DI SINI MASALAH INFO TIDAK MUNCUL)
function initializeDashboard() {
  const user = window.userData;
  if (!user.username) {
     // Jika data hilang (refresh), coba ambil dari storage (opsional) atau tendang ke login
     return navigateTo('Login');
  }

  // Isi Nama di Desktop & Mobile
  if(document.getElementById('user-display-name')) document.getElementById('user-display-name').innerText = user.nama;
  if(document.getElementById('user-display-name-mobile')) document.getElementById('user-display-name-mobile').innerText = user.nama;
  if(document.getElementById('user-role')) document.getElementById('user-role').innerText = user.role;

  // Render Menu
  const menuContainer = document.getElementById('sidebar-menu');
  if (menuContainer && user.menus) {
    menuContainer.innerHTML = '';
    user.menus.forEach(m => {
      const btn = document.createElement('button');
      btn.className = "w-full flex items-center gap-3 px-4 py-4 md:py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all";
      btn.innerHTML = `<div class="w-1.5 h-1.5 rounded-full bg-amber-600"></div><span>${m.name}</span>`;
      btn.onclick = () => navigateTo(m.pageId, m.lane || "");
      menuContainer.appendChild(btn);
    });
  }
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
