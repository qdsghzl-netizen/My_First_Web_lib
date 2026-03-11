/**
 * 认证模块
 */

// 当前登录类型：viewer = 普通用户登录，admin = 管理员登录
let currentLoginRole = 'viewer';

function setLoginRole(role) {
    currentLoginRole = role === 'admin' ? 'admin' : 'viewer';
    
    const userTab = document.getElementById('userLoginTab');
    const adminTab = document.getElementById('adminLoginTab');
    
    if (userTab && adminTab) {
        if (currentLoginRole === 'admin') {
            userTab.classList.remove('btn-primary', 'active');
            userTab.classList.add('btn-outline-primary');
            adminTab.classList.remove('btn-outline-secondary');
            adminTab.classList.add('btn-secondary', 'active');
        } else {
            adminTab.classList.remove('btn-secondary', 'active');
            adminTab.classList.add('btn-outline-secondary');
            userTab.classList.remove('btn-outline-primary');
            userTab.classList.add('btn-primary', 'active');
        }
    }
}

function switchToRegister(event) {
    event.preventDefault();
    document.getElementById('loginForm').classList.add('d-none');
    document.getElementById('registerForm').classList.remove('d-none');
}

function switchToLogin(event) {
    event.preventDefault();
    document.getElementById('registerForm').classList.add('d-none');
    document.getElementById('loginForm').classList.remove('d-none');
}

function showAlert(message, type = 'danger') {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.classList.remove('d-none');
    
    setTimeout(() => {
        alertDiv.classList.add('d-none');
    }, 3000);
}

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    (async () => {
        try {
            const user = await StorageManager.login(username, password);

            // 当选择“管理员登录”时，必须是管理员账号
            if (currentLoginRole === 'admin' && user.role !== 'admin') {
                showAlert('当前为【管理员登录】，请使用管理员账号（如 admin/admin123）', 'danger');
                StorageManager.removeUser();
                return;
            }

            // 当选择“用户登录”时，普通用户和管理员都可以登录浏览
            showAlert('登录成功！', 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } catch (error) {
            showAlert(error.message || '登录失败', 'danger');
        }
    })();
}

function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    
    (async () => {
        try {
            await StorageManager.register(username, password, role);
            showAlert('注册成功！请登录', 'success');
            setTimeout(() => {
                switchToLogin({ preventDefault: () => {} });
            }, 1500);
        } catch (error) {
            showAlert(error.message || '注册失败', 'danger');
        }
    })();
}

function handleLogout() {
    StorageManager.removeUser();
    window.location.href = 'index.html';
}

// 页面加载检查登录状态
window.addEventListener('load', () => {
    if (window.location.pathname.includes('home.html')) {
        const user = StorageManager.getUser();
        if (!user) {
            window.location.href = 'index.html';
        }
    }
});