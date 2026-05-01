/* =========================================
   1. SISTEM KEAMANAN (BroadcastChannel)
========================================= */
const tabChannel = new BroadcastChannel('wms_security_channel');
const TAB_ID = Math.random().toString(36).substring(7);

function enforceSingleTab() {
  if (!window.BroadcastChannel) return;
  const isVerified = sessionStorage.getItem('tab_verified');
  if (!isVerified) {
    let tabConflict = false;
    const radar = (e) => { if (e.data.type === 'ALREADY_ACTIVE') tabConflict = true; };
    tabChannel.addEventListener('message', radar);
    tabChannel.postMessage({ type: 'NEW_TAB_OPENED', id: TAB_ID });
    setTimeout(() => {
      tabChannel.removeEventListener('message', radar);
      if (tabConflict) { document.body.innerHTML = "SECURITY_VIOLATION: Multiple tabs blocked."; throw new Error("BLOCKED"); }
      else { sessionStorage.setItem('tab_verified', 'true'); }
    }, 500);
  }
}
tabChannel.onmessage = (e) => { if (e.data.type === 'NEW_TAB_OPENED' && e.data.id !== TAB_ID) tabChannel.postMessage({ type: 'ALREADY_ACTIVE', id: TAB_ID }); };
enforceSingleTab();

/* =========================================
   2. KONFIGURASI & API CORE
========================================= */
const API_CONFIG = {
  PROD_URL: "https://script.google.com/macros/s/AKfycbxJwZogtiLb2PJPgx7K5XVtpeZzhidtnmfFl8tg45uJVpbMn6lIK74_-CXr4Stqyd-LAQ/exec"
};
window.userData = { username: null, nama: null, role: null, menus: [] };

window.smartFetch = async function(params) {
  let url = API_CONFIG.PROD_URL + "?";
  for (let key in params) { url += key + "=" + encodeURIComponent(params[key]) + "&"; }
  try {
    const response = await fetch(url, { method: 'GET', mode: 'no-cors' });
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    return new Promise((resolve) => {
      xhr.onload = () => resolve(JSON.parse(xhr.responseText));
      xhr.send();
    });
  } catch(e) { throw e; }
};

/* =========================================
   3. NAVIGASI & DASHBOARD
========================================= */
window.navigateTo = async function(pageId) {
  const container = document.getElementById('app-container');
  try {
    const res = await fetch(`./pages/${pageId}.html?t=${Date.now()}`);
    if(!res.ok) throw new Error("404");
    container.innerHTML = await res.text();
    
    // Execute scripts
    container.querySelectorAll('script').forEach(s => {
      const n = document.createElement('script');
      n.text = s.text;
      document.body.appendChild(n);
    });

    if (pageId === 'Dashboard_Layout') setTimeout(window.initializeDashboard, 100);
  } catch (e) {
    if (pageId !== 'Login') window.navigateTo('Login');
  }
};

window.initializeDashboard = function() {
  const user = window.userData;
  const nav = document.getElementById('exec-sidebar-nav');
  if(!user || !nav) return;

  document.getElementById('exec-name').innerText = user.nama;
  document.getElementById('exec-role').innerText = user.role;
  nav.innerHTML = '';

  const groups = {};
  user.menus.forEach(m => {
    const p = m.parent || "CORE_ACCESS";
    if (!groups[p]) groups[p] = [];
    groups[p].push(m);
  });

  Object.keys(groups).forEach((gName, idx) => {
    const gId = 'grp-' + idx;
    const sec = document.createElement('div');
    sec.className = "border-b border-zinc-900";
    sec.innerHTML = `
      <button onclick="document.getElementById('${gId}').classList.toggle('hidden')" class="w-full px-8 py-4 flex items-center justify-between bg-zinc-900/10 hover:bg-zinc-900 uppercase text-[9px] font-black text-zinc-500 tracking-[0.3em]">
        ${gName} <span>▼</span>
      </button>
      <div id="${gId}" class="hidden flex flex-col bg-black/10"></div>
    `;
    nav.appendChild(sec);
    groups[gName].forEach(m => {
      const b = document.createElement('button');
      b.className = "w-full flex items-center gap-4 px-10 py-3 text-[10px] font-bold text-zinc-500 uppercase hover:text-white hover:bg-zinc-900 transition-all border-l-2 border-transparent hover:border-amber-500";
      b.innerHTML = `<span>${m.icon || '○'}</span><span>${m.name}</span>`;
      b.onclick = () => window.navigateTo(m.pageId);
      sec.querySelector(`#${gId}`).appendChild(b);
    });
  });
};

/* =========================================
   4. AUTH & INIT
========================================= */
window.handleLogin = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  btn.disabled = true; btn.innerText = "AUTHENTICATING...";
  try {
    const res = await window.smartFetch({ action: "checkLogin", username: e.target.username.value, password: e.target.password.value });
    if (res.status === "success") {
      window.userData = res;
      window.navigateTo('Dashboard_Layout');
    } else { throw new Error(res.message); }
  } catch(e) { Swal.fire('Login Gagal', e.message, 'error'); btn.disabled = false; btn.innerText = "AUTHORIZE ACCESS →"; }
};

window.handleLogout = () => { localStorage.clear(); window.location.reload(); };

document.addEventListener('DOMContentLoaded', () => window.navigateTo('Login'));
