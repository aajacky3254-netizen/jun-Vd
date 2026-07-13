// auth.js
import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
export async function checkAuthAndGetRole(allowedRoles) {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    let driverData = null;

                    // 1. 先試著用原本的 UID 去找資料
                    const userDocSnap = await getDoc(doc(db, "drivers", firebaseUser.uid));
                    
                    if (userDocSnap.exists()) {
                        driverData = userDocSnap.data();
                    } else {
                        // 2. 如果 UID 找不到，改用登入的 Email 去人事資料表(drivers)裡面撈 
                        if (firebaseUser.email) {
                            const q = query(collection(db, "drivers"), where("email", "==", firebaseUser.email));
                            const querySnapshot = await getDocs(q);
                            if (!querySnapshot.empty) {
                                driverData = querySnapshot.docs[0].data();
                            }
                        }
                    }

                    // 3. 判斷是否有成功抓到人事資料
                    if (driverData) {
                        // 打包完整用戶資訊
                        const fullUserData = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            empId: driverData.empId || firebaseUser.uid, // 確保一定有員工編號
                            name: driverData.name || '未設定姓名',
                            role: driverData.role || '駕駛長'
                        };

                        // 4. 檢查網頁權限
                        if (allowedRoles && !allowedRoles.includes(fullUserData.role)) {
                            alert(`權限不足！此頁面僅限 ${allowedRoles.join(', ')} 存取。`);
                            window.location.href = 'index.html'; // 擋下並導回首頁
                            reject("權限不足");
                        } else {
                            resolve(fullUserData); // 成功，解鎖網頁！
                        }
                    } else {
                        // 真的找不到資料：阻擋登入並提示
                        alert("登入失敗：人事系統中找不到您的資料 (請確認註冊 Email 是否與人事建檔一致)。");
                        await signOut(auth); // 強制登出
                        window.location.href = 'login.html';
                        reject("找不到人事資料");
                    }
                } catch (error) {
                    console.error("驗證過程發生錯誤:", error); // F12 會顯示詳細錯誤
                    reject(error);
                }
            } else {
                // 沒登入就想進來，踢回登入頁
                window.location.href = 'login.html';
                reject("未登入");
            }
        });
    });
}
