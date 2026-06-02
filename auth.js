// auth.js
// 1. 從你原本就寫好的初始化檔案中匯入 db 與 auth
import { db, auth } from './firebase-init.js';

// 2. 引入需要的 Firebase 原生功能方法
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * 驗證登入狀態與檢查角色權限
 * @param {Array} allowedRoles 允許存取該頁面的角色陣列
 */
export function checkAuthAndGetRole(allowedRoles = []) {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe(); // 取得一次狀態後立即取消監聽，避免重複觸發
            
            if (!user) {
                window.location.href = 'login.html';
                return reject("未登入");
            }

            try {
                // 💡 將 Firebase 的小寫信箱強制轉回大寫，才能對應資料庫的員工工號（如 A001）
                const empId = user.email.split('@')[0].toUpperCase();
                
                // 讀取人事資料庫中的角色資料
                const docSnap = await getDoc(doc(db, "Drivers", empId));
                
                if (!docSnap.exists()) {
                    alert(`登入異常：在人事資料庫中找不到員工編號 ${empId}`);
                    await signOut(auth); 
                    window.location.href = 'login.html';
                    return reject("員工資料異常");
                }

                const userData = docSnap.data();
                const userRole = userData.role || "駕駛長";

                // 權限檢查
                if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
                    alert(`權限不足！您的職稱為「${userRole}」，無法存取此頁面。`);
                    window.location.href = 'index.html'; 
                    return reject("權限不足");
                }

                const safeUser = { empId: empId, name: userData.name, role: userRole };
                window.currentUser = safeUser; // 掛載到全域方便頁面調用
                resolve(safeUser);

            } catch (error) {
                console.error("權限讀取失敗:", error);
                reject("系統錯誤");
            }
        });
    });
}

/**
 * 登出系統
 */
export function logout() {
    if(confirm("確定要登出系統嗎？")) {
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error("登出失敗:", error);
        });
    }
}

/**
 * 動態渲染導覽列
 * @param {Object} user 登入的使用者物件
 * @param {String} activePageId 當前頁面的 ID
 */
export function renderNavbar(user, activePageId) {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    const menuItems = [
        { id: 'schedule', name: '🗓️ 週班表', href: 'schedule.html', roles: ['SuperAdmin', 'StationManager', '調度員'] },
        { id: 'dispatch', name: '🚦 每日發車', href: 'dispatch.html', roles: ['SuperAdmin', 'StationManager', '調度員'] },
        { id: 'drivers', name: '👨‍✈️ 人事管理', href: 'drivers.html', roles: ['SuperAdmin', 'StationManager'] },
        { id: 'leaves', name: '📅 差假簽核', href: 'leaves.html', roles: ['SuperAdmin', 'StationManager', '調度員'] },
        { id: 'vehicles', name: '🚍 車輛資訊', href: 'vehicles.html', roles: ['SuperAdmin', 'StationManager', '調度員'] },
        { id: 'repairs', name: '🛠️ 報修系統', href: 'repairs.html', roles: ['SuperAdmin', 'StationManager', '調度員', '維修人員'] },
        { id: 'routes', name: '🗺️ 路線管理', href: 'routes.html', roles: ['SuperAdmin', 'StationManager'] }
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
            <span>👤 ${user.name} (${user.role})</span>
            <button id="btnLogout" class="bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition">登出</button>
        </div>
    `;

    nav.innerHTML = html;
    
    // 確保按鈕渲染完成後再行監聽
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    }
}