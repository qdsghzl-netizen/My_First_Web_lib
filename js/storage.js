/**
 * 数据访问管理模块
 * 改为通过后端 API 进行读写，实现多端同步
 */

// 后端 API 根地址：
// - 本地开发时可用 http://localhost:3000/api
// - 部署到线上（如 Render / Railway / 自建服务器）后，改成你的后端地址
const API_BASE_URL = 'https://my-first-web-lib-backend.onrender.com';

async function apiRequest(path, options = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'omit',
        ...options,
    });
    if (!res.ok) {
        let msg = `请求失败：${res.status}`;
        try {
            const data = await res.json();
            if (data && data.message) msg = data.message;
        } catch {
            // ignore
        }
        throw new Error(msg);
    }
    try {
        return await res.json();
    } catch {
        return null;
    }
}

const StorageManager = {
    // 当前登录用户仍存本地，方便前端使用
    setUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    },

    getUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    removeUser() {
        localStorage.removeItem('currentUser');
    },

    // 认证
    async login(username, password) {
        const user = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        this.setUser(user);
        return user;
    },

    async register(username, password, role) {
        const user = await apiRequest('/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, role }),
        });
        return user;
    },

    // 分类
    async getCategories() {
        return await apiRequest('/categories');
    },

    async addCategory(name, parentId) {
        return await apiRequest('/categories', {
            method: 'POST',
            body: JSON.stringify({ name, parentId }),
        });
    },

    async deleteCategory(categoryId) {
        return await apiRequest(`/categories/${categoryId}`, {
            method: 'DELETE',
        });
    },

    // 文件
    async getFiles() {
        return await apiRequest('/files');
    },

    async addFile(payload) {
        return await apiRequest('/files', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    async updateFile(fileId, payload) {
        return await apiRequest(`/files/${fileId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },

    async deleteFile(fileId) {
        return await apiRequest(`/files/${fileId}`, {
            method: 'DELETE',
        });
    },

    // 收藏（按用户名存储在后端）
    async getCollected() {
        const user = this.getUser();
        if (!user) return [];
        return await apiRequest(`/collections/${encodeURIComponent(user.username)}`);
    },

    async addCollected(fileId) {
        const user = this.getUser();
        if (!user) return;
        await apiRequest(`/collections/${encodeURIComponent(user.username)}`, {
            method: 'POST',
            body: JSON.stringify({ fileId }),
        });
    },

    async removeCollected(fileId) {
        const user = this.getUser();
        if (!user) return;
        await apiRequest(`/collections/${encodeURIComponent(user.username)}/${fileId}`, {
            method: 'DELETE',
        });
    },

    async isCollected(fileId) {
        const collected = await this.getCollected();
        return collected.includes(fileId);
    },
};

