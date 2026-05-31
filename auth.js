// auth.js - 企業內部權限控管模組
export function checkAuthAndGetRole(allowedRoles = []) {
    return new Promise((resolve, reject) => {
        const userStr = sessionStorage.getItem('busSystemUser');
        if (!userStr) { window.location.href = 'login.html'; return reject("未登入"); }

        const user = JSON.parse(userStr);
        // 如果不是 SuperAdmin 且角色不在允許清單內
        if (user.role !== 'SuperAdmin' && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            alert("權限不足，無法存取此頁面。");
            window.location.href = 'index.html';
            return reject("權限不足");
        }

        //window.currentUser = user;
        resolve(user);// 回傳包含 stationId, role, name 的完整物件
    });
}

// 登出功能
export function logout() {
    if(confirm("確定要登出系統嗎？")) {
        sessionStorage.removeItem('busSystemUser');
        window.location.href = 'login.html';
    }
}
