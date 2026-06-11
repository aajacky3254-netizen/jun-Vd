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
 * 驗證登入狀態並取得使用者權限
 * @param {Array} allowedRoles - 允許存取此頁面的角色陣列，留空代表登入即可
 */
export function checkAuthAndGetRole(allowedRoles = []) {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            unsubscribe(); // 檢查完就解除監聽，避免重複觸發
            
            if (firebaseUser) {
                try {
                    // 💡 退回標準做法：使用 Firebase 驗證的 UID，去 'users' 集合找權限
                    const userRef = doc(db, "users", firebaseUser.uid);
                    const userSnap = await getDoc(userRef);
                    
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        const user = {
                            uid: firebaseUser.uid,
                            name: userData.name || "未知員工",
                            role: userData.role || "未授權"
                        };

                        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                            alert('權限不足，無法訪問此模組！');
                            window.location.href = 'index.html';
                            reject(new Error('權限不足'));
                        } else {
                            resolve(user); 
                        }
                    } else {
                        // 提示文字也改回 users 集合
                        alert("登入失敗：在資料庫 (users) 中找不到符合您 UID 的權限資料！請確認是否建檔錯誤。");
                        console.error("在資料庫中找不到該員工資料");
                        logout();
                        reject(new Error('資料缺失'));
                    }
                } catch (error) {
                    alert("讀取權限失敗（可能是 Firebase Rules 沒開）：" + error.message);
                    console.error("獲取權限時發生錯誤:", error);
                    logout(); 
                    reject(error);
                }
            } else {
                window.location.href = 'login.html';
                reject(new Error('未登入'));
            }
        });
    });
}
