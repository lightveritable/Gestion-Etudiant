function checkSession() {
    const token = sessionStorage.getItem("token");
    const expireTime = parseInt(sessionStorage.getItem("expireTime") || "0");
    const now = Date.now();

    if (!token || !expireTime || now > expireTime) {
        sessionStorage.clear();
        //window.location.href = "login.html";
    }
}

// refresh session sur activité
function refreshSession() {
    const expireTime = Date.now() + 60 * 60 * 1000;
    sessionStorage.setItem("expireTime", String(expireTime));
}

// events globaux
["click", "mousemove", "keypress"].forEach(event => {
    document.addEventListener(event, refreshSession);
});
