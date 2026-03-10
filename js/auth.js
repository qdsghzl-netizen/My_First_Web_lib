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
    
    const users = StorageManager.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        showAlert('用户名或密码错误！', 'danger');
        return;
    }

    // 当选择“管理员登录”时，必须是管理员账号
    if (currentLoginRole === 'admin' && user.role !== 'admin') {
        showAlert('当前为【管理员登录】，请使用管理员账号（如 admin/admin123）', 'danger');
        return;
    }

    // 当选择“用户登录”时，普通用户和管理员都可以登录浏览
    StorageManager.setUser(user);
    showAlert('登录成功！', 'success');
    setTimeout(() => {
        window.location.href = 'home.html';
    }, 1000);
}

function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    
    const users = StorageManager.getUsers();
    
    // 检查用户名是否已存在
    if (users.find(u => u.username === username)) {
        showAlert('用户名已存在！', 'danger');
        return;
    }
    
    // 创建新用户
    const newUser = {
        id: users.length + 1,
        username: username,
        password: password,
        role: role === 'admin' ? 'admin' : 'viewer',
        createTime: new Date().toISOString()
    };
    
    users.push(newUser);
    StorageManager.setUsers(users);
    
    showAlert('注册成功！请登录', 'success');
    setTimeout(() => {
        switchToLogin({ preventDefault: () => {} });
    }, 1500);
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