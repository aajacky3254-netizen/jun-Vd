// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 共用的 Firebase 設定檔 (建議未來可以抽離成獨立的 config.js)
const firebaseConfig = {
    apiKey: "AIzaSyAnhhaiWXn5KFtU1YdB0oR_S9E0qhAlJuI",
    authDomain: "jun-bus-dispatch.firebaseapp.com",
    projectId: "jun-bus-dispatch",
    storageBucket: "jun-bus-dispatch.firebasestorage.app",
    messagingSenderId: "621725744717",
    appId: "1:621725744717:web:64e663648d8c76b9bd6604"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export function checkAuthAndGetRole(allowedRoles = []) {
    return new Promise((resolve, reject) => {
        // 使用 Firebase 官方的狀態監聽，取代 localStorage
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe(); // 檢查一次後就解除監聽，避免重複觸發
            
            if (!user) {
                // 如果 Firebase 說沒有登入，就踢回登入頁
                window.location.href = 'login.html';
                return reject("未登入");
            }

            try {
                // 從信箱反推員工編號 (例如 001@fengdong.com -> 001)
                const empId = user.email.split('@')[0];
                
                // 去資料庫抓取他真正的權限，這部分駭客無法從前端竄改
                const docSnap = await getDoc(doc(db, "Drivers", empId));
                
                if (!docSnap.exists()) {
                    await signOut(auth); // 若資料庫查無此人，強制登出
                    window.location.href = 'login.html';
                    return reject("員工資料異常");
                }

                const userData = docSnap.data();
                const userRole = userData.role || "駕駛長";

                // 權限審查
                if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
                    alert(`權限不足！您的職稱為「${userRole}」，無法存取此頁面。`);
                    window.location.href = 'index.html'; 
                    return reject("權限不足");
                }

                // 回傳安全的 User 物件供頁面渲染
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

// 安全登出功能
export function logout() {
    if(confirm("確定要登出系統嗎？")) {
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error("登出失敗:", error);
        });
    }
}
