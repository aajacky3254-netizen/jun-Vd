// auth.js
import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

export function logout() {
    signOut(auth).then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error("登出失敗:", error);
        alert("登出失敗，請檢查網路連線。");
    });
}

// 🔒 核心安全機制：使用 UID 直接開鎖
export async function checkAuthAndGetRole(allowedRoles) {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // 直接用登入的 UID 當作鑰匙，去 drivers 找對應的文件
                    const userDocRef = doc(db, "drivers", firebaseUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    if (userDocSnap.exists()) {
                        // 鎖打開了！成功拿到資料
                        const driverData = userDocSnap.data();
                        
                        const fullUserData = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            empId: driverData.driverId || driverData.empId || firebaseUser.uid, // 抓取您設定的 driverId
                            name: driverData.name || '未設定姓名',
                            role: driverData.role || '駕駛長'
                        };

                        if (allowedRoles && !allowedRoles.includes(fullUserData.role)) {
                            alert(`權限不足！此頁面僅限 ${allowedRoles.join(', ')} 存取。`);
                            window.location.href = 'index.html'; 
                            reject("權限不足");
                        } else {
                            resolve(fullUserData); 
                        }
                    } else {
                        // 找不到對應 UID 的文件
                        console.error("找不到人事資料。您的 UID:", firebaseUser.uid);
                        alert("登入失敗：系統中找不到您的資料。請確認您的「人事資料文件 ID」是否與「登入 UID」完全一致。");
                        await signOut(auth); 
                        window.location.href = 'login.html';
                        reject("找不到人事資料");
                    }
                } catch (error) {
                    console.error("驗證過程發生錯誤:", error); 
                    reject(error);
                }
            } else {
                window.location.href = 'login.html';
                reject("未登入");
            }
        });
    });
}
