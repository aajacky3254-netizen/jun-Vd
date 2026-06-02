// auth.js
import { db, auth } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function checkAuthAndGetRole(allowedRoles = []) {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe(); 
            
            if (!user) {
                window.location.href = 'login.html';
                return reject("未登入");
            }

            try {
                if (!user.email) {
                    alert("登入異常：此帳號缺少電子郵件資訊。");
                    window.location.href = 'login.html';
                    return reject("無有效信箱");
                }

                // 將信箱前綴轉大寫作為員工編號，並強制去除前後空白
                const empId = user.email.split('@')[0].toUpperCase().trim();
                
                let safeUser = null;
                const cachedUser = sessionStorage.getItem(`fd_user_${empId}`);
                
                if (cachedUser) {
                    safeUser = JSON.parse(cachedUser);
                } else {
                    let docSnap = await getDoc(doc(db, "Drivers", empId));
                    
                    // 💡 修正 2：ADMIN 專屬緊急通道，如果沒資料就自動建立
                    if (!docSnap.exists()) {
                        if (empId === 'ADMIN') {
                            console.log("偵測到管理員首次登入，自動建立權限資料...");
                            await setDoc(doc(db, "Drivers", "ADMIN"), {
                                name: "系統管理員",
                                role: "總公司", // 給予最高權限
                                empRole: "行政職員",
                                station: "總公司",
                                status: "active"
                            });
                            // 建立完後重新讀取一次
                            docSnap = await getDoc(doc(db, "Drivers", empId));
                        } else {
                            alert(`登入異常：在人事資料庫中找不到員工編號 ${empId}，請聯絡站長建立資料。`);
                            await signOut(auth); 
                            window.location.href = 'login.html';
                            return reject("員工資料異常");
                        }
                    }

                    const userData = docSnap.data();
                    const userRole = userData.role || "駕駛長";

                    safeUser = { 
                        empId: empId, 
                        name: userData.name || "未命名員工", 
                        role: userRole 
                    };

                    sessionStorage.setItem(`fd_user_${empId}`, JSON.stringify(safeUser));
                }

                if (allowedRoles.length > 0 && !allowedRoles.includes(safeUser.role)) {
                    alert(`權限不足！您的職稱為「${safeUser.role}」，無法存取此頁面。`);
                    window.location.href = safeUser.role === '駕駛長' ? 'personal.html' : 'index.html'; 
                    return reject("權限不足");
                }

                window.currentUser = safeUser; 
                resolve(safeUser);

            } catch (error) {
                console.error("權限讀取失敗:", error);
                alert("系統安全模組錯誤，請刷新重試。");
                reject("系統錯誤");
            }
        });
    });
}

/**
 * 登出系統 (同步清理快取，確保資安)
 */
export function logout() {
    if(confirm("確定要登出系統嗎？")) {
        // 💡 優化：登出時徹底清空瀏覽器暫存，防範下一位換班司機或調度員資料洩漏
        sessionStorage.clear();
        
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

    // 完美對齊您要求的表頭文字與圖示順序
    const menuItems = [
        { id: 'schedule', name: '🗓️ 週班表', href: 'schedule.html', roles: ['總公司', '站長', '調度員'] },
        { id: 'dispatch', name: '🚦 每日發車', href: 'dispatch.html', roles: ['總公司', '站長', '調度員'] },
        { id: 'drivers', name: '👨‍✈️ 人事管理', href: 'drivers.html', roles: ['總公司', '站長'] },
        { id: 'leaves', name: '📅 差假簽核', href: 'leaves.html', roles: ['總公司', '站長', '調度員'] },
        { id: 'vehicles', name: '🚍 車輛資訊', href: 'vehicles.html', roles: ['總公司', '站長', '調度員', '維修保養班', '駕駛長'] },
        { id: 'repairs', name: '🛠️ 報修系統', href: 'repairs.html', roles: ['總公司', '站長', '調度員', '維修保養班', '駕駛長'] },
        { id: 'routes', name: '🗺️ 路線管理', href: 'routes.html', roles: ['總公司', '站長'] },
        { id: 'query', name: '🔍公開班表查詢', href: 'query.html', roles: ['總公司', '站長', '調度員', '維修保養班', '駕駛長'] }
    ];

    let html = `
        <a href="index.html" class="navbar-brand flex items-center">
        // 將原本很長的 GitHub URL 替換為相對路徑
<img src="./豐東客運 LOGO.png" alt="LOGO" class="h-8 mr-3 object-contain">
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
    
    // 💡 優化：防呆 XSS 安全漏洞
    function escapeHTML(str) {
        return str ? String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])) : '';
    }

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    }
}
