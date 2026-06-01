// auth.js
export function checkAuthAndGetRole(allowedRoles = []) {
    return new Promise((resolve, reject) => {
        const userStr = localStorage.getItem('busSystemUser'); 
        
        if (!userStr) {
            window.location.href = 'login.html';
            return reject("未登入");
        }

        try {
            const user = JSON.parse(userStr);

            // 確保資料格式正確，避免 role 不存在導致的錯誤
            if (!user || !user.role) {
                localStorage.removeItem('busSystemUser');
                window.location.href = 'login.html';
                return reject("登入資料異常，請重新登入");
            }

            if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                alert(`權限不足！您的職稱為「${user.role}」，無法存取此頁面。`);
                window.location.href = 'index.html'; 
                return reject("權限不足");
            }

            window.currentUser = user;
            resolve(user);

        } catch (error) {
            // 防禦性設計：如果 userStr 格式損毀 (非 JSON 格式)，就清除並重導
            console.error("Session 資料解析失敗:", error);
            localStorage.removeItem('busSystemUser');
            window.location.href = 'login.html';
            return reject("登入資料損毀");
        }
    });
}

export function logout() {
    if(confirm("確定要登出系統嗎？")) {
        localStorage.removeItem('busSystemUser');
        window.location.href = 'login.html';
    }
}
