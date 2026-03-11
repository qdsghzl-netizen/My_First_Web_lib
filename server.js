// 简单的 Node.js + Express 后端，用本地 JSON 文件做“数据库”
// 提供多端共享的用户 / 分类 / 文件 / 收藏数据接口

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 允许前端跨域访问（GitHub Pages 等）
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'db.json');

// ---------- 工具函数 ----------
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = createInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8') || '{}';
  try {
    const data = JSON.parse(raw);
    return {
      users: data.users || [],
      categories: data.categories || [],
      files: data.files || [],
      collections: data.collections || {}
    };
  } catch (e) {
    console.error('DB 解析失败，使用空数据:', e);
    return createInitialData();
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function createInitialData() {
  const now = new Date().toISOString();

  const users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', createTime: now },
    { id: 2, username: 'viewer', password: 'viewer123', role: 'viewer', createTime: now }
  ];

  const categories = [
    // 顶级：专业
    { id: 1, name: '数学', parentId: null, children: [], level: 0, createTime: now },
    { id: 2, name: '化工', parentId: null, children: [], level: 0, createTime: now },
    { id: 3, name: '计算机科学与技术', parentId: null, children: [], level: 0, createTime: now },

    // 数学 - 年级
    { id: 4, name: '大一', parentId: 1, children: [], level: 1, createTime: now },
    { id: 5, name: '大二', parentId: 1, children: [], level: 1, createTime: now },

    // 化工 - 年级
    { id: 6, name: '大一', parentId: 2, children: [], level: 1, createTime: now },
    { id: 7, name: '大二', parentId: 2, children: [], level: 1, createTime: now },

    // 计算机科学与技术 - 年级
    { id: 8, name: '大一', parentId: 3, children: [], level: 1, createTime: now },
    { id: 9, name: '大二', parentId: 3, children: [], level: 1, createTime: now },

    // 数学 - 课程
    { id: 10, name: '高等数学', parentId: 4, children: [], level: 2, createTime: now },
    { id: 11, name: '线性代数', parentId: 4, children: [], level: 2, createTime: now },
    { id: 12, name: '概率论与数理统计', parentId: 5, children: [], level: 2, createTime: now },

    // 化工 - 课程
    { id: 13, name: '无机化学', parentId: 6, children: [], level: 2, createTime: now },
    { id: 14, name: '有机化学', parentId: 6, children: [], level: 2, createTime: now },
    { id: 15, name: '化工原理', parentId: 7, children: [], level: 2, createTime: now },

    // 计算机科学与技术 - 课程
    { id: 16, name: 'C语言程序设计', parentId: 8, children: [], level: 2, createTime: now },
    { id: 17, name: '离散数学', parentId: 8, children: [], level: 2, createTime: now },
    { id: 18, name: '数据结构', parentId: 9, children: [], level: 2, createTime: now },
    { id: 19, name: '计算机组成原理', parentId: 9, children: [], level: 2, createTime: now }
  ];

  const files = [
    {
      id: 1,
      name: '高等数学（上）讲义',
      categoryId: 10,
      category: '数学 / 大一 / 高等数学',
      url: 'https://example.com/math-calculus-1.pdf',
      description: '高等数学（上）课程复习讲义示例',
      uploader: 'admin',
      uploadTime: now,
      access: 'public'
    },
    {
      id: 2,
      name: '线性代数习题精选',
      categoryId: 11,
      category: '数学 / 大一 / 线性代数',
      url: 'https://example.com/linear-algebra-exercises.pdf',
      description: '线性代数经典习题与解析示例',
      uploader: 'admin',
      uploadTime: now,
      access: 'public'
    },
    {
      id: 3,
      name: 'C语言程序设计实验报告范文',
      categoryId: 16,
      category: '计算机科学与技术 / 大一 / C语言程序设计',
      url: 'https://example.com/c-programming-lab-report.pdf',
      description: 'C语言程序设计课程实验报告格式示例',
      uploader: 'admin',
      uploadTime: now,
      access: 'viewers-only'
    }
  ];

  return {
    users,
    categories,
    files,
    collections: {}
  };
}

function getNextId(items) {
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id || 0)) + 1;
}

function buildCategoryPath(categoryId, categories) {
  const map = new Map(categories.map((c) => [c.id, c]));
  const path = [];
  let current = map.get(categoryId);
  while (current) {
    path.unshift(current.name);
    current = current.parentId != null ? map.get(current.parentId) : null;
  }
  return path.join(' / ');
}

// ---------- 基础接口 ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ---------- 认证 ----------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const db = readDB();
  const user = db.users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }
  const { password: _pwd, ...safeUser } = user;
  res.json(safeUser);
});

app.post('/api/register', (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }
  const db = readDB();
  if (db.users.find((u) => u.username === username)) {
    return res.status(400).json({ message: '用户名已存在' });
  }
  const newUser = {
    id: getNextId(db.users),
    username,
    password,
    role: role === 'admin' ? 'admin' : 'viewer',
    createTime: new Date().toISOString()
  };
  db.users.push(newUser);
  writeDB(db);
  const { password: _pwd, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

// ---------- 分类 ----------
app.get('/api/categories', (req, res) => {
  const db = readDB();
  res.json(db.categories);
});

app.post('/api/categories', (req, res) => {
  const { name, parentId } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: '分类名称不能为空' });
  }
  const db = readDB();
  const parent = parentId ? db.categories.find((c) => c.id === parentId) : null;
  const level = parent ? (parent.level || 0) + 1 : 0;

  // 同级重名检查
  const duplicate = db.categories.some(
    (c) => c.name === name && (c.parentId || null) === (parentId || null)
  );
  if (duplicate) {
    return res.status(400).json({ message: '同级分类已存在' });
  }

  const newCategory = {
    id: getNextId(db.categories),
    name,
    parentId: parentId || null,
    children: [],
    level,
    createTime: new Date().toISOString()
  };
  db.categories.push(newCategory);
  writeDB(db);
  res.status(201).json(newCategory);
});

app.delete('/api/categories/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = readDB();
  const category = db.categories.find((c) => c.id === id);
  if (!category) {
    return res.status(404).json({ message: '分类不存在' });
  }
  const fileCount = db.files.filter((f) => f.categoryId === id).length;
  const childrenCount = db.categories.filter((c) => c.parentId === id).length;
  if (fileCount > 0) {
    return res.status(400).json({ message: `该分类下还有 ${fileCount} 个文件，无法删除` });
  }
  if (childrenCount > 0) {
    return res.status(400).json({ message: `该分类下还有 ${childrenCount} 个子分类，无法删除` });
  }
  db.categories = db.categories.filter((c) => c.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// ---------- 文件 ----------
app.get('/api/files', (req, res) => {
  const db = readDB();
  res.json(db.files);
});

app.post('/api/files', (req, res) => {
  const { name, categoryId, url, description, uploader, access } = req.body || {};
  if (!name || !categoryId || !url || !uploader) {
    return res.status(400).json({ message: 'name, categoryId, url, uploader 为必填' });
  }
  const db = readDB();
  const category = db.categories.find((c) => c.id === categoryId);
  if (!category) {
    return res.status(400).json({ message: '分类不存在' });
  }
  const newFile = {
    id: getNextId(db.files),
    name,
    categoryId,
    category: buildCategoryPath(categoryId, db.categories),
    url,
    description: description || '',
    uploader,
    uploadTime: new Date().toISOString(),
    access: access || 'public'
  };
  db.files.push(newFile);
  writeDB(db);
  res.status(201).json(newFile);
});

app.put('/api/files/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, categoryId, url, description, access } = req.body || {};
  const db = readDB();
  const file = db.files.find((f) => f.id === id);
  if (!file) {
    return res.status(404).json({ message: '文件不存在' });
  }

  if (typeof name === 'string') file.name = name;
  if (typeof url === 'string') file.url = url;
  if (typeof description === 'string') file.description = description;
  if (typeof access === 'string') file.access = access;
  if (categoryId) {
    const category = db.categories.find((c) => c.id === categoryId);
    if (!category) {
      return res.status(400).json({ message: '分类不存在' });
    }
    file.categoryId = categoryId;
    file.category = buildCategoryPath(categoryId, db.categories);
  }

  writeDB(db);
  res.json(file);
});

app.delete('/api/files/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = readDB();
  const exists = db.files.some((f) => f.id === id);
  if (!exists) {
    return res.status(404).json({ message: '文件不存在' });
  }
  db.files = db.files.filter((f) => f.id !== id);

  // 同时从收藏中移除
  Object.keys(db.collections).forEach((username) => {
    db.collections[username] = (db.collections[username] || []).filter((fid) => fid !== id);
  });

  writeDB(db);
  res.json({ success: true });
});

// ---------- 收藏 ----------
app.get('/api/collections/:username', (req, res) => {
  const username = req.params.username;
  const db = readDB();
  const list = db.collections[username] || [];
  res.json(list);
});

app.post('/api/collections/:username', (req, res) => {
  const username = req.params.username;
  const { fileId } = req.body || {};
  if (!fileId) {
    return res.status(400).json({ message: 'fileId 必填' });
  }
  const db = readDB();
  if (!db.collections[username]) db.collections[username] = [];
  if (!db.collections[username].includes(fileId)) {
    db.collections[username].push(fileId);
  }
  writeDB(db);
  res.status(201).json(db.collections[username]);
});

app.delete('/api/collections/:username/:fileId', (req, res) => {
  const username = req.params.username;
  const fileId = parseInt(req.params.fileId, 10);
  const db = readDB();
  if (!db.collections[username]) db.collections[username] = [];
  db.collections[username] = db.collections[username].filter((id) => id !== fileId);
  writeDB(db);
  res.json(db.collections[username]);
});

// ---------- 启动 ----------
app.listen(PORT, () => {
  console.log(`Backend API server is running on http://localhost:${PORT}`);
});

