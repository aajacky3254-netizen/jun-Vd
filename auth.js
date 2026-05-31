// auth.js - 企業內部權限控管模組
export function checkAuthAndGetRole(allowedRoles = []) {
    return new Promise((resolve, reject) => {
        const userStr = sessionStorage.getItem('busSystemUser');
        
        if (!userStr) {
            // 沒登入，強制踢回登入頁面
            window.location.href = 'login.html';
            return reject("未登入");
        }

        const user = JSON.parse(userStr);

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            alert(`權限不足！您的職稱為「${user.role}」，無法存取此頁面。`);
            // 權限不足時，踢回總大門 (首頁)
            window.location.href = 'index.html'; 
            return reject("權限不足");
        }

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
