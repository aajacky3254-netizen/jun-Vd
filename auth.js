// auth.js - 企業內部權限控管模組
export function checkAuthAndGetRole(allowedRoles = []) {
    return new Promise((resolve, reject) => {
        // 1. 檢查瀏覽器記憶體中是否有登入紀錄
        const userStr = sessionStorage.getItem('busSystemUser');
        
        if (!userStr) {
            // 沒登入，強制踢回登入頁面
            window.location.href = 'login.html';
            return reject("未登入");
        }

        // 2. 解析使用者資料
        const user = JSON.parse(userStr);

        // 3. 檢查職稱權限 (如果 allowedRoles 有設定，且使用者的職稱不在裡面，就阻擋)
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            alert(`權限不足！您的職稱為「${user.role}」，無法存取此頁面。`);
            // 踢回他們有權限的頁面 (例如司機踢回查看班表頁)
            window.location.href = 'index.html'; 
            return reject("權限不足");
        }

        // 4. 通過驗證，將使用者資料掛載到全域，方便網頁顯示名稱
        window.currentUser = user;
        resolve(user);
    });
}

// 登出功能
export function logout() {
    if(confirm("確定要登出系統嗎？")) {
        sessionStorage.removeItem('busSystemUser');
        window.location.href = 'login.html';
    }
}