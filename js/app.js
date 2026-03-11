/**
 * 主应用逻辑
 */

let currentTab = 'all-files';
// 分类导航栈：用于实现 专业 -> 年级 -> 课程 的逐级浏览
let categoryNavStack = [];
// 当前正在查看文件列表的分类（叶子分类）ID
let currentCategoryIdForFiles = null;

// 页面初始化（异步，从后端加载数据）
document.addEventListener('DOMContentLoaded', async () => {
    const user = StorageManager.getUser();
    
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // 显示用户信息
    document.getElementById('currentUser').textContent = user.username;
    document.getElementById('userRole').textContent = 
        user.role === 'admin' ? '管理员' : '浏览者';
    
    // 显示/隐藏管理员菜单
    if (user.role === 'admin') {
        document.getElementById('admin-menu').classList.remove('d-none');
    }
    
    // 加载初始数据
    await loadAllFiles();
    await loadCategories();
    await populateCategorySelect();
});

// 标签页切换
function switchTab(tabName) {
    // 隐藏所有标签页
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.add('d-none');
    });
    
    // 显示当前标签页
    document.getElementById(tabName).classList.remove('d-none');
    currentTab = tabName;
    
    // 更新导航按钮样式
    document.querySelectorAll('.list-group-item').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.list-group-item')?.classList.add('active');
    
    // 加载相应数据
    if (tabName === 'my-collections') {
        loadCollections();
    } else if (tabName === 'categories') {
        loadCategoriesView();
    } else if (tabName === 'manage-categories') {
        loadManageCategories();
    } else if (tabName === 'manage-files') {
        populateCategorySelect(); // 切换到此标签时刷新分类下拉，确保与多级结构同步
    }
}

// 加载所有文件
async function loadAllFiles() {
    const user = StorageManager.getUser();
    const files = await StorageManager.getFiles();
    const filesList = document.getElementById('filesList');
    
    filesList.innerHTML = '';
    
    for (const file of files) {
        // 检查访问权限
        if (canAccessFile(file, user)) {
            const fileCard = await createFileCard(file);
            filesList.innerHTML += fileCard;
        }
    }
}

// 检查文件访问权限
function canAccessFile(file, user) {
    if (file.access === 'public') return true;
    if (file.access === 'private' && file.uploader === user.username) return true;
    if (file.access === 'viewers-only' && user.role === 'viewer') return true;
    if (file.access === 'admins-only' && user.role === 'admin') return true;
    return user.role === 'admin';
}

// 创建文件卡片
async function createFileCard(file) {
    const isCollected = await StorageManager.isCollected(file.id);
    const user = StorageManager.getUser();
    
    return `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <div class="text-center mb-2" style="cursor: pointer;" onclick="openFile(${file.id})">
                        <i class="bi bi-file-earmark-text" style="font-size: 2.5rem;"></i>
                    </div>
                    <h5 class="card-title">${file.name}</h5>
                    <p class="card-text text-muted">${file.description || '暂无描述'}</p>
                    <small class="text-secondary">
                        <strong>分类：</strong>${file.category}<br>
                        <strong>上传者：</strong>${file.uploader}<br>
                        <strong>上传时间：</strong>${new Date(file.uploadTime).toLocaleDateString()}
                    </small>
                </div>
                <div class="card-footer bg-white">
                    <button class="btn btn-sm btn-primary" onclick="openFile(${file.id})">
                        <i class="bi bi-download"></i> 打开
                    </button>
                    <button class="btn btn-sm ${isCollected ? 'btn-warning' : 'btn-outline-warning'}" 
                            onclick="toggleCollected(${file.id})">
                        <i class="bi bi-bookmark"></i> ${isCollected ? '已收藏' : '收藏'}
                    </button>
                    ${user.role === 'admin' ? `
                        <button class="btn btn-sm btn-outline-secondary" onclick="showChangeCategoryModal(${file.id})" title="修改所属分类">
                            <i class="bi bi-folder-symlink"></i> 修改分类
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteFile(${file.id})">
                            <i class="bi bi-trash"></i> 删除
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// 打开或下载文件 - 增强版
async function openFile(fileId) {
    const file = (await StorageManager.getFiles()).find(f => f.id === fileId);
    
    if (!file || file.url === '#') {
        alert('❌ 该文件暂无有效链接');
        return;
    }
    
    console.log('文件信息:', file);
    console.log('文件 URL:', file.url);
    
    // 获取文件扩展名
    const fileUrl = file.url;
    const fileExtension = fileUrl.split('.').pop().toLowerCase();
    
    // 能在浏览器中直接打开的文件类型
    const viewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'txt', 'html', 'xml', 'json', 'mp4', 'webm', 'ogg', 'mp3', 'wav'];
    
    if (viewableTypes.includes(fileExtension)) {
        // 直接打开
        console.log('在新标签页打开...');
        window.open(fileUrl, '_blank');
    } else {
        // 下载
        console.log('下载文件...');
        downloadFile(fileUrl, file.name);
    }
}

// 下载文件函数
function downloadFile(url, fileName) {
    // 方式1：使用 fetch + blob（推荐，支持跨域）
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('文件下载失败');
            }
            return response.blob();
        })
        .then(blob => {
            // 创建临时链接并触发下载
            const link = document.createElement('a');
            const blobUrl = URL.createObjectURL(blob);
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        })
        .catch(error => {
            console.error('下载出错:', error);
            alert('❌ 文件下载失败：' + error.message + '\n\n可能原因：\n1. 文件 URL 不正确\n2. 文件不存在\n3. 跨域限制');
            
            // 备选方案：直接打开
            console.log('尝试直接打开文件...');
            window.open(url, '_blank');
        });
}

// 切换收藏（同步到后端）
async function toggleCollected(fileId) {
    const isCollected = await StorageManager.isCollected(fileId);
    if (isCollected) {
        await StorageManager.removeCollected(fileId);
    } else {
        await StorageManager.addCollected(fileId);
    }
    await loadAllFiles();
}

// 加载收藏文件
async function loadCollections() {
    const [files, collected] = await Promise.all([
        StorageManager.getFiles(),
        StorageManager.getCollected(),
    ]);
    const collectionsList = document.getElementById('collectionsList');
    
    collectionsList.innerHTML = '';
    
    files.forEach(async file => {
        if (collected.includes(file.id)) {
            const fileCard = await createFileCard(file);
            collectionsList.innerHTML += fileCard;
        }
    });
    
    if (collected.length === 0) {
        collectionsList.innerHTML = '<p class="text-muted">还没有收藏任何文件</p>';
    }
}

// 加载分类（预热后端数据，当前主要用于其他函数）
async function loadCategories() {
    await StorageManager.getCategories();
}

// 加载分类视图（浏览分类）
async function loadCategoriesView() {
    const categories = await StorageManager.getCategories();
    const categoriesList = document.getElementById('categoriesList');
    
    categoriesList.innerHTML = '';
    
    // 只显示顶级分类
    const topLevelCategories = categories.filter(c => c.parentId === null);
    
    for (const category of topLevelCategories) {
        const fileCount = (await StorageManager.getFiles())
            .filter(f => f.categoryId === category.id).length;
        
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'col-md-6 col-lg-4 mb-3';
        categoryDiv.innerHTML = `
            <div class="card shadow-sm" style="cursor: pointer;">
                <div class="card-body text-center" onclick="showCategoryWithChildren(${category.id})">
                    <h4><i class="bi bi-folder"></i></h4>
                    <h5>${category.name}</h5>
                    <p class="text-muted mb-0">
                        <small>${fileCount} 个文件</small>
                    </p>
                </div>
            </div>
        `;
        categoriesList.appendChild(categoryDiv);
    }
}

// 计算分类路径（例如：数学 / 大一 / 高等数学）
function getCategoryPath(category, categories) {
    const path = [];
    let current = category;
    while (current) {
        path.unshift(current.name);
        current = current.parentId !== null
            ? categories.find(c => c.id === current.parentId)
            : null;
    }
    return path.join(' / ');
}

// 显示某个分类的下一级（用于 专业 -> 年级 -> 课程 导航）
async function showCategoryWithChildren(categoryId, pushHistory = true) {
    const categories = await StorageManager.getCategories();
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const children = categories.filter(c => c.parentId === categoryId);

    // 维护导航栈
    if (pushHistory) {
        categoryNavStack.push({ id: category.id, name: category.name });
    }

    // 隐藏所有标签页
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.add('d-none');
    });
    // 显示分类详情区域
    document.getElementById('category-detail').classList.remove('d-none');

    const title = document.getElementById('categoryDetailTitle');
    const searchWrapper = document.getElementById('categorySearchInput').parentElement;
    const categoryFilesList = document.getElementById('categoryFilesList');

    const fullPath = getCategoryPath(category, categories);
    title.textContent = `当前位置：${fullPath}`;

    // 设置返回按钮逻辑
    const backBtn = document.getElementById('backToCategories');
    backBtn.onclick = handleCategoryBack;

    // 如果还有子分类，先展示子分类列表
    if (children.length > 0) {
        // 子分类层级不展示搜索框
        searchWrapper.classList.add('d-none');
        currentCategoryIdForFiles = null;
        categoryFilesList.innerHTML = '';

        for (const child of children) {
            const fileCount = (await StorageManager.getFiles())
                .filter(f => f.categoryId === child.id).length;

            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 mb-3';
            card.innerHTML = `
                <div class="card shadow-sm" style="cursor: pointer;">
                    <div class="card-body text-center" onclick="showCategoryWithChildren(${child.id})">
                        <h4><i class="bi bi-folder"></i></h4>
                        <h5>${child.name}</h5>
                        <p class="text-muted mb-0">
                            <small>${fileCount} 个文件 / 下级分类</small>
                        </p>
                    </div>
                </div>
            `;
            categoryFilesList.appendChild(card);
        }
    } else {
        // 没有子分类时，展示该分类下的文件列表，并允许搜索
        searchWrapper.classList.remove('d-none');
        showCategoryFiles(categoryId, categories, fullPath);
    }
}

// 返回上一级分类 / 回到所有分类
function handleCategoryBack() {
    if (categoryNavStack.length <= 1) {
        categoryNavStack = [];
        currentCategoryIdForFiles = null;
        switchTab('categories');
        return;
    }
    // 弹出当前
    categoryNavStack.pop();
    const last = categoryNavStack[categoryNavStack.length - 1];
    showCategoryWithChildren(last.id, false);
}

// 显示分类下的文件（叶子分类）
async function showCategoryFiles(categoryId, categories = null, fullPath = '') {
    const user = StorageManager.getUser();
    const allCategories = categories || await StorageManager.getCategories();
    const category = allCategories.find(c => c.id === categoryId);
    const files = (await StorageManager.getFiles()).filter(f => f.categoryId === categoryId);

    currentCategoryIdForFiles = categoryId;

    // 隐藏所有标签页
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.add('d-none');
    });
    document.getElementById('category-detail').classList.remove('d-none');

    const title = document.getElementById('categoryDetailTitle');
    const categoryFilesList = document.getElementById('categoryFilesList');
    const searchWrapper = document.getElementById('categorySearchInput').parentElement;

    const pathText = fullPath || getCategoryPath(category, allCategories);
    title.textContent = `当前位置：${pathText}（课程文件）`;
    searchWrapper.classList.remove('d-none');

    categoryFilesList.innerHTML = '';

    if (files.length === 0) {
        categoryFilesList.innerHTML = '<p class="text-muted text-center">该课程暂无文件</p>';
        return;
    }

    for (const file of files) {
        if (canAccessFile(file, user)) {
            const fileCard = await createFileCard(file);
            categoryFilesList.innerHTML += fileCard;
        }
    }

    const backBtn = document.getElementById('backToCategories');
    backBtn.onclick = handleCategoryBack;
}
// 搜索文件
async function searchFiles() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const user = StorageManager.getUser();
    const files = await StorageManager.getFiles();
    const filesList = document.getElementById('filesList');
    
    filesList.innerHTML = '';
    
    for (const file of files) {
        if (canAccessFile(file, user) && 
            (file.name.toLowerCase().includes(searchTerm) ||
             (file.description || '').toLowerCase().includes(searchTerm))) {
            const fileCard = await createFileCard(file);
            filesList.innerHTML += fileCard;
        }
    }
}

// 添加文件（管理员）- 与多级分类结构兼容（同步到后端）
async function handleAddFile(event) {
    event.preventDefault();
    
    const user = StorageManager.getUser();
    if (user.role !== 'admin') {
        alert('只有管理员可以添加文件');
        return;
    }
    
    const fileName = document.getElementById('fileName').value.trim();
    const categoryIdRaw = document.getElementById('fileCategory').value;
    const categoryId = categoryIdRaw ? parseInt(categoryIdRaw, 10) : NaN;
    const fileUrl = document.getElementById('fileUrl').value.trim();
    const fileDescription = document.getElementById('fileDescription').value.trim();
    const fileAccess = document.getElementById('fileAccess').value;
    
    const categories = await StorageManager.getCategories();
    const category = categories.find(c => c.id === categoryId);
    
    // 校验：必须选择叶子分类（课程层级）
    if (!categoryId || isNaN(categoryId) || !category) {
        alert('请选择有效的分类（需选择具体课程）');
        return;
    }
    
    const isLeafCategory = !categories.some(c => c.parentId === category.id);
    if (!isLeafCategory) {
        alert('请选择具体课程分类（如：数学/大一/高等数学），不能选择专业或年级层级');
        return;
    }
    
    await StorageManager.addFile({
        name: fileName,
        categoryId: category.id,
        url: fileUrl,
        description: fileDescription,
        uploader: user.username,
        access: fileAccess,
    });
    
    // 显示成功消息
    const messageDiv = document.getElementById('addFileMessage');
    messageDiv.textContent = '文件添加成功！';
    messageDiv.className = 'alert alert-success';
    messageDiv.classList.remove('d-none');
    
    // 清空表单
    document.getElementById('addFileForm').reset();
    await populateCategorySelect(); // 保持下拉与分类结构同步
    
    setTimeout(() => {
        messageDiv.classList.add('d-none');
    }, 2000);
}

// 删除文件（管理员）
async function deleteFile(fileId) {
    if (!confirm('确定要删除该文件吗？')) return;
    
    await StorageManager.deleteFile(fileId);
    await loadAllFiles();
    alert('文件已删除');
}

// 填充分类选择框（仅叶子分类，用于“添加文件”和“修改分类”）
// selectId: 可选，指定要填充的 select 元素 id，默认 'fileCategory'
async function populateCategorySelect(selectId = 'fileCategory') {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const categories = await StorageManager.getCategories();
    const placeholder = selectId === 'changeFileCategorySelect' ? '--选择新分类--' : '--请选择分类--';
    select.innerHTML = `<option value="">${placeholder}</option>`;
    
    // 只显示“叶子分类”（没有子分类的分类，通常是具体课程）
    const leafCategories = categories.filter(cat => 
        !categories.some(c => c.parentId === cat.id)
    );
    
    leafCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = getCategoryPath(cat, categories);
        select.appendChild(option);
    });
}

// 显示修改分类模态框（管理员）
async function showChangeCategoryModal(fileId) {
    const user = StorageManager.getUser();
    if (user.role !== 'admin') return;
    
    const file = (await StorageManager.getFiles()).find(f => f.id === fileId);
    if (!file) return;
    
    document.getElementById('changeCategoryFileId').value = fileId;
    document.getElementById('changeCategoryFileName').textContent = file.name;
    document.getElementById('changeCategoryCurrent').textContent = file.category || '（未分类）';
    
    await populateCategorySelect('changeFileCategorySelect');
    document.getElementById('changeFileCategorySelect').value = file.categoryId || '';
    
    const modal = new bootstrap.Modal(document.getElementById('changeCategoryModal'));
    modal.show();
}

// 保存修改后的文件分类（管理员）
async function handleChangeFileCategory(event) {
    event.preventDefault();
    
    const user = StorageManager.getUser();
    if (user.role !== 'admin') return;
    
    const fileId = parseInt(document.getElementById('changeCategoryFileId').value, 10);
    const newCategoryIdRaw = document.getElementById('changeFileCategorySelect').value;
    const newCategoryId = newCategoryIdRaw ? parseInt(newCategoryIdRaw, 10) : NaN;
    
    const [files, categories] = await Promise.all([
        StorageManager.getFiles(),
        StorageManager.getCategories(),
    ]);
    const file = files.find(f => f.id === fileId);
    const newCategory = categories.find(c => c.id === newCategoryId);
    
    if (!file) {
        alert('文件不存在');
        return;
    }
    if (!newCategoryId || isNaN(newCategoryId) || !newCategory) {
        alert('请选择有效的分类');
        return;
    }
    
    const isLeafCategory = !categories.some(c => c.parentId === newCategory.id);
    if (!isLeafCategory) {
        alert('请选择具体课程分类，不能选择专业或年级层级');
        return;
    }
    
    await StorageManager.updateFile(fileId, { categoryId: newCategory.id });
    
    bootstrap.Modal.getInstance(document.getElementById('changeCategoryModal')).hide();
    alert('分类已更新');
    
    // 刷新当前视图
    if (currentTab === 'all-files') await loadAllFiles();
    else if (currentTab === 'my-collections') await loadCollections();
    else if (currentCategoryIdForFiles !== null) {
        await showCategoryFiles(currentCategoryIdForFiles);
    }
}

// 添加分类（管理员）
// 添加分类（支持多层级）- 修改版
async function handleAddCategory(event) {
    event.preventDefault();
    
    const user = StorageManager.getUser();
    if (user.role !== 'admin') {
        alert('只有管理员可以添加分类');
        return;
    }
    
    const categoryName = document.getElementById('categoryName').value.trim();
    const parentCategorySelect = document.getElementById('parentCategorySelect');
    const parentId = parentCategorySelect.value ? parseInt(parentCategorySelect.value) : null;
    
    if (!categoryName) {
        alert('分类名称不能为空');
        return;
    }
    
    await StorageManager.addCategory(categoryName, parentId);
    
    document.getElementById('categoryName').value = '';
    parentCategorySelect.value = '';
    await loadManageCategories();
    await populateParentCategorySelect();
    alert('✅ 分类添加成功！');
}

// 加载管理分类（树形结构显示）
async function loadManageCategories() {
    const categories = await StorageManager.getCategories();
    const list = document.getElementById('categoriesManageList');
    
    list.innerHTML = '';
    
    // 只显示顶级分类
    const topLevelCategories = categories.filter(c => c.parentId === null);
    
    topLevelCategories.forEach(cat => {
        const categoryElement = createCategoryTreeNode(cat, categories);
        list.appendChild(categoryElement);
    });
}

// 创建分类树节点
async function createCategoryTreeNode(category, allCategories) {
    const fileCount = (await StorageManager.getFiles())
        .filter(f => f.categoryId === category.id).length;
    
    // 获取子分类
    const children = allCategories.filter(c => c.parentId === category.id);
    
    const container = document.createElement('div');
    container.className = 'ms-' + (category.level * 3) + ' mb-2';  // 缩进
    
    // 创建分类行
    const categoryRow = document.createElement('div');
    categoryRow.className = 'card mb-2';
    categoryRow.innerHTML = `
        <div class="card-body py-2 px-3 d-flex justify-content-between align-items-center">
            <div>
                <strong>${'&nbsp;&nbsp;'.repeat(category.level * 2)}${category.name}</strong>
                <small class="text-muted ms-2">(${fileCount} 个文件)</small>
                ${children.length > 0 ? `<small class="text-muted ms-2">[${children.length} 个子分类]</small>` : ''}
            </div>
            <div>
                <button class="btn btn-sm btn-info me-2" 
                        onclick="showAddSubcategoryForm(${category.id}, '${category.name}')"
                        title="添加子分类">
                    <i class="bi bi-plus-square"></i> 添加子分类
                </button>
                <button class="btn btn-sm btn-danger" 
                        onclick="deleteCategory(${category.id})"
                        title="删除分类">
                    <i class="bi bi-trash"></i> 删除
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(categoryRow);
    
    // 递归显示子分类
    if (children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'ms-3';
        
        for (const child of children) {
            const childElement = await createCategoryTreeNode(child, allCategories);
            childrenContainer.appendChild(childElement);
        }
        
        container.appendChild(childrenContainer);
    }
    
    return container;
}

// 显示添加子分类的表单
function showAddSubcategoryForm(parentId, parentName) {
    const categoryNameInput = document.getElementById('categoryName');
    const parentCategorySelect = document.getElementById('parentCategorySelect');
    
    categoryNameInput.value = '';
    parentCategorySelect.value = parentId;
    categoryNameInput.focus();
    
    // 滚动到表单
    document.querySelector('#addCategoryForm').scrollIntoView({ behavior: 'smooth' });
    
    alert(`现在添加的分类将成为"${parentName}"的子分类`);
}

// 删除分类（管理员）
async function deleteCategory(categoryId) {
    const categories = await StorageManager.getCategories();
    const category = categories.find(c => c.id === categoryId);
    
    if (!category) {
        alert('分类不存在');
        return;
    }
    
    if (!confirm(`确定要删除分类"${category.name}"吗？`)) return;
    await StorageManager.deleteCategory(categoryId);
    await loadManageCategories();
    await populateParentCategorySelect();
    alert('✅ 分类已删除');
}

// 在分类中搜索文件
async function searchCategoryFiles() {
    const searchTerm = document.getElementById('categorySearchInput').value.toLowerCase();
    const user = StorageManager.getUser();
    if (!currentCategoryIdForFiles) {
        return;
    }
    
    // 获取当前叶子分类下的所有文件
    const files = (await StorageManager.getFiles()).filter(f => f.categoryId === currentCategoryIdForFiles);
    const categoryFilesList = document.getElementById('categoryFilesList');
    
    categoryFilesList.innerHTML = '';
    
    // 过滤和显示符合搜索条件的文件
    const filteredFiles = files.filter(file => 
        canAccessFile(file, user) && 
        (file.name.toLowerCase().includes(searchTerm) ||
         (file.description || '').toLowerCase().includes(searchTerm))
    );
    
    if (filteredFiles.length === 0) {
        categoryFilesList.innerHTML = '<p class="text-muted">没有找到匹配的文件</p>';
        return;
    }
    
    for (const file of filteredFiles) {
        const fileCard = await createFileCard(file);
        categoryFilesList.innerHTML += fileCard;
    }
}

// 填充父分类选择框
async function populateParentCategorySelect() {
    const categories = await StorageManager.getCategories();
    const select = document.getElementById('parentCategorySelect');
    
    select.innerHTML = '<option value="">-- 顶级分类 --</option>';
    
    // 按层级显示分类（为了可读性）
    const allCategories = categories.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name);
    });
    
    allCategories.forEach(cat => {
        const indent = '&nbsp;&nbsp;'.repeat(cat.level);
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name + ` (${cat.level === 0 ? '顶级' : '子分类'})`;
        option.innerHTML = `${'&nbsp;&nbsp;'.repeat(cat.level * 2)}${cat.name}`;
        select.appendChild(option);
    });
}