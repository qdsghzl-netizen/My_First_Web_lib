/**
 * 本地存储管理模块
 */

const StorageManager = {
    // 用户相关
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
    
    // 所有用户数据
    setUsers(users) {
        localStorage.setItem('allUsers', JSON.stringify(users));
    },
    
    getUsers() {
        const users = localStorage.getItem('allUsers');
        return users ? JSON.parse(users) : this.getDefaultUsers();
    },
    
    // 文件管理
    setFiles(files) {
        localStorage.setItem('allFiles', JSON.stringify(files));
    },
    
    getFiles() {
        const files = localStorage.getItem('allFiles');
        return files ? JSON.parse(files) : this.getDefaultFiles();
    },
    
    // 分类管理
    setCategories(categories) {
        localStorage.setItem('categories', JSON.stringify(categories));
    },
    
    getCategories() {
        const categories = localStorage.getItem('categories');
        return categories ? JSON.parse(categories) : this.getDefaultCategories();
    },
    
    // 收藏管理
    addCollected(fileId) {
        const collected = this.getCollected();
        if (!collected.includes(fileId)) {
            collected.push(fileId);
            localStorage.setItem('collected', JSON.stringify(collected));
        }
    },
    
    removeCollected(fileId) {
        const collected = this.getCollected();
        const index = collected.indexOf(fileId);
        if (index > -1) {
            collected.splice(index, 1);
            localStorage.setItem('collected', JSON.stringify(collected));
        }
    },
    
    getCollected() {
        const collected = localStorage.getItem('collected');
        return collected ? JSON.parse(collected) : [];
    },
    
    isCollected(fileId) {
        return this.getCollected().includes(fileId);
    },
    
    // 默认数据
    getDefaultUsers() {
        return [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                createTime: new Date().toISOString()
            },
            {
                id: 2,
                username: 'viewer',
                password: 'viewer123',
                role: 'viewer',
                createTime: new Date().toISOString()
            }
        ];
    },
    
    getDefaultCategories() {
        // 默认多层级分类结构：专业 -> 年级 -> 课程
        return [
            // 顶级：专业
            { id: 1, name: '数学', parentId: null, children: [], level: 0, createTime: new Date().toISOString() },
            { id: 2, name: '化工', parentId: null, children: [], level: 0, createTime: new Date().toISOString() },
            { id: 3, name: '计算机科学与技术', parentId: null, children: [], level: 0, createTime: new Date().toISOString() },

            // 数学 - 年级
            { id: 4, name: '大一', parentId: 1, children: [], level: 1, createTime: new Date().toISOString() },
            { id: 5, name: '大二', parentId: 1, children: [], level: 1, createTime: new Date().toISOString() },

            // 化工 - 年级
            { id: 6, name: '大一', parentId: 2, children: [], level: 1, createTime: new Date().toISOString() },
            { id: 7, name: '大二', parentId: 2, children: [], level: 1, createTime: new Date().toISOString() },

            // 计算机科学与技术 - 年级
            { id: 8, name: '大一', parentId: 3, children: [], level: 1, createTime: new Date().toISOString() },
            { id: 9, name: '大二', parentId: 3, children: [], level: 1, createTime: new Date().toISOString() },

            // 数学 - 课程
            { id: 10, name: '高等数学', parentId: 4, children: [], level: 2, createTime: new Date().toISOString() },
            { id: 11, name: '线性代数', parentId: 4, children: [], level: 2, createTime: new Date().toISOString() },
            { id: 12, name: '概率论与数理统计', parentId: 5, children: [], level: 2, createTime: new Date().toISOString() },

            // 化工 - 课程
            { id: 13, name: '无机化学', parentId: 6, children: [], level: 2, createTime: new Date().toISOString() },
            { id: 14, name: '有机化学', parentId: 6, children: [], level: 2, createTime: new Date().toISOString() },
            { id: 15, name: '化工原理', parentId: 7, children: [], level: 2, createTime: new Date().toISOString() },

            // 计算机科学与技术 - 课程
            { id: 16, name: 'C语言程序设计', parentId: 8, children: [], level: 2, createTime: new Date().toISOString() },
            { id: 17, name: '离散数学', parentId: 8, children: [], level: 2, createTime: new Date().toISOString() },
            { id: 18, name: '数据结构', parentId: 9, children: [], level: 2, createTime: new Date().toISOString() },
            { id: 19, name: '计算机组成原理', parentId: 9, children: [], level: 2, createTime: new Date().toISOString() }
        ];
    },
    
    getDefaultFiles() {
        // 默认示例文件，挂在具体课程（叶子分类）下
        return [
            {
                id: 1,
                name: '高等数学（上）讲义',
                category: '数学 / 大一 / 高等数学',
                categoryId: 10,
                url: 'https://example.com/math-calculus-1.pdf',
                description: '高等数学（上）课程复习讲义示例',
                uploader: 'admin',
                uploadTime: new Date().toISOString(),
                access: 'public'
            },
            {
                id: 2,
                name: '线性代数习题精选',
                category: '数学 / 大一 / 线性代数',
                categoryId: 11,
                url: 'https://example.com/linear-algebra-exercises.pdf',
                description: '线性代数经典习题与解析示例',
                uploader: 'admin',
                uploadTime: new Date().toISOString(),
                access: 'public'
            },
            {
                id: 3,
                name: 'C语言程序设计实验报告范文',
                category: '计算机科学与技术 / 大一 / C语言程序设计',
                categoryId: 16,
                url: 'https://example.com/c-programming-lab-report.pdf',
                description: 'C语言程序设计课程实验报告格式示例',
                uploader: 'admin',
                uploadTime: new Date().toISOString(),
                access: 'viewers-only'
            }
        ];
    },
    
    // 初始化数据
    initializeData() {
        if (!localStorage.getItem('allUsers')) {
            this.setUsers(this.getDefaultUsers());
        }
        if (!localStorage.getItem('categories')) {
            this.setCategories(this.getDefaultCategories());
        }
        if (!localStorage.getItem('allFiles')) {
            this.setFiles(this.getDefaultFiles());
        }
        if (!localStorage.getItem('collected')) {
            localStorage.setItem('collected', JSON.stringify([]));
        }
    }
};

// 页面加载时初始化数据
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.initializeData();
});