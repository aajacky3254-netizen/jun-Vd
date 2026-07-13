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

    const menuItems = [
        { id: 'schedule', name: '🗓️ 週班表', href: 'schedule.html', roles: ['總公司', '站長', '調度員'] },
        { id: 'dispatch', name: '🚦 每日發車', href: 'dispatch.html', roles: ['總公司', '站長', '調度員'] },
        { id: 'drivers', name: '👨‍✈️ 人事管理', href: 'drivers.html', roles: ['總公司', '站長'] },
        { id: 'leaves', name: '📅 差假簽核', href: 'leaves.html', roles: ['總公司', '站長', '調度員', '駕駛長'] },
        { id: 'vehicles', name: '🚍 車輛資訊', href: 'vehicles.html', roles: ['總公司', '站長', '調度員', '維修保養班', '駕駛長'] },
        { id: 'repairs', name: '🛠️ 報修系統', href: 'repairs.html', roles: ['總公司', '站長', '調度員', '維修保養班', '駕駛長'] },
        { id: 'routes', name: '🗺️ 路線管理', href: 'routes.html', roles: ['總公司', '站長'] },
        { id: 'driver_portal', name: '🔍駕駛員系統', href: 'driver_portal.html', roles: ['總公司', '站長', '調度員', '駕駛長'] }
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
 * 真實登出功能 (安全清除憑證)
 */
export function logout() {
    signOut(auth).then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error("登出失敗:", error);
        alert("登出失敗，請檢查網路連線。");
    });
}
// 系統以為「文件 ID」就是「用戶的 uid」
const userDoc = await getDoc(doc(db, "drivers", firebaseUser.uid));
/**
 * 🔒 核心安全機制：驗證 Firebase 登入狀態並核對 Firestore 權限
 */
export function checkAuthAndGetRole(allowedRoles = []) {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // 🔥 核心修正：將 email (例如 admin@fengdong.com) 拆解回員工編號 (admin)
                    const empId = user.email ? user.email.split('@')[0] : user.uid;
                    const docRef = doc(db, "Drivers", empId);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        const driverData = docSnap.data();
                        
                        if (driverData.status !== 'active') {
                            await signOut(auth);
                            alert("您的帳號目前為非在職狀態，無法登入系統。");
                            window.location.href = 'login.html';
                            reject("非在職狀態");
                            return;
                        }

                        if (allowedRoles.length === 0 || allowedRoles.includes(driverData.role)) {
                            resolve({ 
                                uid: user.uid, 
                                name: driverData.name, 
                                role: driverData.role,
                                empRole: driverData.empRole,
                                station: driverData.station
                            });
                        } else {
                            alert(`權限不足！此頁面僅限【${allowedRoles.join(', ')}】存取。`);
                            window.location.href = 'index.html'; 
                            reject("權限不足");
                        }
                    } else {
                        await signOut(auth);
                        alert("系統中找不到您的員工資料，請聯繫管理員。");
                        window.location.href = 'login.html';
                        reject("找不到員工資料");
                    }
                } catch (error) {
                    console.error("讀取權限失敗:", error);
                    reject("系統錯誤，無法驗證權限");
                }
            } else {
                reject("未登入");
                if (!window.location.pathname.endsWith('login.html')) {
                    window.location.href = 'login.html';
                }
            }
        });
    });
}
