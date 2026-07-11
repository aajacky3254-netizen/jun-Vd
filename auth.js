// auth.js
import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * 動態渲染導覽列 (全站統一標籤)
 */
export function renderNavbar(user, activePageId) {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    // 確保每一頁的標籤與權限皆統一由這裡控制
    const menuItems = [
        { id: 'schedule', name: '🗓️ 週班表', href: 'schedule.html', roles: ['總公司', '站長', '調度員'] },
        { id: 'dispatch', name: '🚦 每日發車', href: 'dispatch.html', roles: ['總公司', '站長', '調度員'] },
        { id: 'drivers', name: '👨‍✈️ 人事管理', href: 'drivers.html', roles: ['總公司', '站長'] },
        { id: 'leaves', name: '📅 差假簽核', href: 'leaves.html', roles: ['總公司', '站長', '調度員', '駕駛長'] },
        { id: 'vehicles', name: '🚍 車輛資訊', href: 'vehicles.html', roles: ['總公司', '站長', '調度員', '維修保養班', '駕駛長'] },
        { id: 'repairs', name: '🛠️ 報修系統', href: 'repairs.html', roles: ['總公司', '站長', '調度員', '維修保養班', '駕駛長'] },
        { id: 'routes', name: '🗺️ 路線管理', href: 'routes.html', roles: ['總公司', '站長'] },
        { id: 'query', name: '🔍公開班表查詢', href: 'query.html', roles: ['總公司', '站長', '調度員', '維修保養班', '駕駛長'] }
    ];

    let html = `
        <a href="index.html" class="navbar-brand flex items-center">
            <img src="https://raw.githubusercontent.com/aajacky3254-netizen/jun-Vd/main/%E8%B1%90%E6%9D%B1%E5%AE%A2%E9%81%8B%20LOGO.png" alt="LOGO" class="h-8 mr-3 object-contain">
            豐東交通客運
        </a>
    `;

    menuItems.forEach(item => {
        if (item.roles.includes(user.role)) {
            const isActive = activePageId === item.id ? 'active' : '';
            html += `<a href="${item.href}" class="nav-link ${isActive}">${item.name}</a>`;
        }
    });

    html += `
        <div class="ml-auto flex items-center gap-4 text-white text-sm font-bold pr-4">
            <span class="bg-slate-700 px-3 py-1 rounded-full shadow-inner border border-slate-600">👤 ${escapeHTML(user.name)} (${escapeHTML(user.role)})</span>
            <button id="btnLogout" class="bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition">登出</button>
        </div>
    `;

    nav.innerHTML = html;
    
    function escapeHTML(str) {
        return str ? String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])) : '';
    }

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    }
}

/**
 * 登出功能
 */
export function logout() {
    signOut(auth).then(() => {
        window.location.href = 'login.html'; // 登出後導回登入頁
    }).catch((error) => {
        console.error("登出失敗:", error);
    });
}

/**
 * 暫時修改登出功能
 */
export function logout() {
    alert("目前為免登入測試模式，無需登出。");
    // window.location.href = 'index.html';
}

/**
 * 暫時移除登入：假造一個最高權限的使用者物件
 */
export function checkAuthAndGetRole(allowedRoles = []) {
    return new Promise((resolve, reject) => {
        // 直接回傳一個虛擬的最高權限帳號，不呼叫 Firebase 驗證
        const mockUser = {
            uid: "bypass-test-uid-001",
            name: "開發測試員",
            role: "總公司" // 設定為最高權限，確保所有模組皆可見
        };
        
        console.warn("⚠️ 目前為免登入測試模式");
        resolve(mockUser); 
    });
}
