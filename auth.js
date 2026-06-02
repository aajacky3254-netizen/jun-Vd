// auth.js
import { db, auth } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * 驗證登入狀態與檢查角色權限
 * @param {Array} allowedRoles 允許存取該頁面的角色陣列
 */
export function checkAuthAndGetRole(allowedRoles = []) {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe(); 
            
            if (!user) {
                window.location.href = 'login.html';
                return reject("未登入");
            }

            try {
                // 將信箱前綴轉大寫作為員工編號
                const empId = user.email.split('@')[0].toUpperCase();
                
                // 去 Firestore 的 Drivers 集合尋找該員工
                const docSnap = await getDoc(doc(db, "Drivers", empId));
                
                if (!docSnap.exists()) {
                    alert(`登入異常：在人事資料庫中找不到員工編號 ${empId}，請聯絡站長建立資料。`);
                    await signOut(auth); 
                    window.location.href = 'login.html';
                    return reject("員工資料異常");
                }

                const userData = docSnap.data();
                const userRole = userData.role || "駕駛長";

                // 權限檢查 (如果 allowedRoles 有設定，且登入者的角色不在裡面，就擋下)
                if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
                    alert(`權限不足！您的職稱為「${userRole}」，無法存取此頁面。`);
                    window.location.href = 'index.html'; 
                    return reject("權限不足");
                }

                const safeUser = { empId: empId, name: userData.name, role: userRole };
                window.currentUser = safeUser; 
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
 * 動態渲染導覽列 (整合 8 大系統導覽與公開查詢通道)
 */
export function renderNavbar(user, activePageId) {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    // 依據您的要求，完美精準對齊表頭文字與圖示
    const menuItems = [
        { id: 'schedule', name: '🗓️ 週班表', href: 'schedule.html', roles: ['總公司', '站長', '調度員'] },
        { id: 'dispatch', name: '🚦 每日發車', href: 'dispatch.html', roles: ['總公司', '站長', '調度員'] },
        { id: 'drivers', name: '👨‍✈️ 人事管理', href: 'drivers.html', roles: ['總公司', '站長'] },
        { id: 'leaves', name: '📅 差假簽核', href: 'leaves.html', roles: ['總公司', '站長', '調度員'] },
        { id: 'vehicles', name: '🚍 車輛資訊', href: 'vehicles.html', roles: ['總公司', '站長', '調度員', '維修保養班', '駕駛長'] },
        { id: 'repairs', name: '🛠️ 報修系統', href: 'repairs.html', roles: ['總公司', '站長', '調度員', '維修保養班', '駕駛長'] },
        { id: 'routes', name: '🗺️ 路線管理', href: 'routes.html', roles: ['總公司', '站長'] },
        { id: 'query', name: '🔍公開班表查詢', href: 'query.html', roles: ['總公司', '站長', '調度員', '維修保養班', '駕駛長'] },
        { id: 'personal', name: '📱 個人作業台', href: 'personal.html', roles: ['駕駛長'] }
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
            <span class="bg-slate-700 px-3 py-1 rounded-full shadow-inner border border-slate-600">👤 ${user.name} (${user.role})</span>
            <button id="btnLogout" class="bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition">登出</button>
        </div>
    `;

    nav.innerHTML = html;
    
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    }
}
