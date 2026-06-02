/* ============================================================
   复古日记 — Vintage Diary Application
   核心逻辑：CRUD · 图片 · 链接 · 附件 · 搜索 · 导入导出
   ============================================================ */

// --- 全局状态 ---
const STATE = {
  entries: [],           // 所有日记条目
  currentId: null,       // 当前编辑的日记 ID
  isDirty: false,        // 是否有未保存的更改
  autoSaveTimer: null,   // 自动保存计时器
  searchQuery: '',       // 当前搜索关键词
};

// --- 心情映射 ---
const MOOD_MAP = {
  happy: '😊', sad: '😢', angry: '😤',
  thoughtful: '🤔', calm: '😌', grateful: '🥰',
  excited: '🎉', tired: '😴',
};

// --- DOM 引用缓存 ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
  entryList: $('#entryList'),
  entryCount: $('#entryCount'),
  emptyState: $('#emptyState'),
  editorPanel: $('#editorPanel'),
  entryDate: $('#entryDate'),
  entryMood: $('#entryMood'),
  entryTitle: $('#entryTitle'),
  editorContent: $('#editorContent'),
  wordCount: $('#wordCount'),
  saveIndicator: $('#saveIndicator'),
  lastSaved: $('#lastSaved'),
  attachmentsList: $('#attachmentsList'),
  searchInput: $('#searchInput'),
  btnClearSearch: $('#btnClearSearch'),
  toastContainer: $('#toastContainer'),
  modalLinkOverlay: $('#modalLinkOverlay'),
  modalDeleteOverlay: $('#modalDeleteOverlay'),
  linkUrl: $('#linkUrl'),
  linkText: $('#linkText'),
};

// ============================================================
//  存储层 — localStorage 操作
// ============================================================

const Storage = {
  KEY: 'vintage_diary_entries',

  /** 加载所有日记 */
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      const data = raw ? JSON.parse(raw) : [];
      // 按更新时间倒序排列
      return data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (e) {
      console.error('加载日记失败:', e);
      return [];
    }
  },

  /** 保存所有日记 */
  save(entries) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(entries));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        Toast.show('存储空间不足！请清理旧日记或删除大图片。', 'error');
      } else {
        Toast.show('保存失败，请重试。', 'error');
      }
      return false;
    }
  },

  /** 导出为 JSON 文件 */
  export() {
    const data = JSON.stringify(STATE.entries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date().toISOString().slice(0, 10);
    a.download = `vintage-diary-backup-${now}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('日记备份已下载！📦', 'success');
  },

  /** 从 JSON 文件导入 */
  import(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) throw new Error('无效的备份文件格式');

        const existingIds = new Set(STATE.entries.map(en => en.id));
        let importedCount = 0;

        data.forEach(entry => {
          if (!entry.id || entry.content === undefined) return;
          if (existingIds.has(entry.id)) {
            // 冲突：给导入的条目生成新 ID
            entry.id = 'imported_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
          }
          STATE.entries.push(entry);
          importedCount++;
        });

        Storage.save(STATE.entries);
        STATE.entries = Storage.load();
        renderEntryList();
        Toast.show(`成功导入 ${importedCount} 篇日记！📥`, 'success');
      } catch (err) {
        Toast.show('导入失败：文件格式不正确。', 'error');
      }
    };
    reader.readAsText(file);
  },
};

// ============================================================
//  Toast 提示
// ============================================================

const Toast = {
  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
};

// ============================================================
//  模态框管理
// ============================================================

const Modal = {
  open(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) overlay.classList.add('show');
  },

  close(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) overlay.classList.remove('show');
  },

  closeAll() {
    $$('.modal-overlay').forEach(o => o.classList.remove('show'));
  },
};

// ============================================================
//  日记条目管理
// ============================================================

const EntryManager = {
  /** 创建新日记 */
  create() {
    const now = new Date();
    const id = 'entry_' + now.getTime();
    const entry = {
      id,
      title: '',
      content: '',
      mood: '',
      date: now.toISOString().slice(0, 10),
      attachments: [],   // [{ id, name, type, size, dataURL }]
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    STATE.entries.unshift(entry);
    Storage.save(STATE.entries);
    return entry;
  },

  /** 更新日记 */
  update(id, data) {
    const idx = STATE.entries.findIndex(e => e.id === id);
    if (idx === -1) return null;
    STATE.entries[idx] = {
      ...STATE.entries[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    Storage.save(STATE.entries);
    return STATE.entries[idx];
  },

  /** 删除日记 */
  delete(id) {
    STATE.entries = STATE.entries.filter(e => e.id !== id);
    Storage.save(STATE.entries);
  },

  /** 获取日记 */
  get(id) {
    return STATE.entries.find(e => e.id === id) || null;
  },

  /** 搜索日记 */
  search(query) {
    if (!query.trim()) return STATE.entries;
    const q = query.toLowerCase();
    return STATE.entries.filter(e =>
      e.title.toLowerCase().includes(q) ||
      stripHtml(e.content).toLowerCase().includes(q)
    );
  },
};

// ============================================================
//  编辑器操作
// ============================================================

const Editor = {
  /** 获取编辑器纯文本内容（用于字数统计和搜索） */
  getPlainText() {
    return DOM.editorContent.innerText || '';
  },

  /** 获取编辑器 HTML 内容 */
  getHTML() {
    return DOM.editorContent.innerHTML || '';
  },

  /** 设置编辑器 HTML 内容 */
  setHTML(html) {
    DOM.editorContent.innerHTML = html || '';
    this.updateWordCount();
  },

  /** 更新字数统计 */
  updateWordCount() {
    const text = this.getPlainText().trim();
    // 中文字数 + 英文单词数
    const cjkCount = (text.match(/[一-鿿㐀-䶿]/g) || []).length;
    const wordCount = (text.match(/[a-zA-Z0-9]+/g) || []).length;
    const total = cjkCount + wordCount;
    DOM.wordCount.textContent = total > 0 ? `${total} 字` : '0 字';
  },

  /** 执行编辑命令 */
  execCommand(command, value = null) {
    DOM.editorContent.focus();
    document.execCommand(command, false, value);
    this.updateWordCount();
  },

  /** 插入图片 */
  insertImage(file) {
    if (!file.type.startsWith('image/')) {
      Toast.show('请选择图片文件。', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target.result;

      // 压缩大图片（超过 800KB）
      if (dataURL.length > 800 * 1024) {
        this._compressImage(dataURL, (compressed) => {
          this._doInsertImage(compressed);
        });
      } else {
        this._doInsertImage(dataURL);
      }
    };
    reader.readAsDataURL(file);
  },

  /** 压缩图片 */
  _compressImage(dataURL, callback) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      const MAX = 1200;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = dataURL;
  },

  /** 实际执行图片插入 */
  _doInsertImage(dataURL) {
    DOM.editorContent.focus();
    document.execCommand('insertImage', false, dataURL);

    // 给插入的图片添加样式类
    const imgs = DOM.editorContent.querySelectorAll('img');
    const lastImg = imgs[imgs.length - 1];
    if (lastImg) {
      lastImg.style.maxWidth = '100%';
      lastImg.style.height = 'auto';
    }

    this.updateWordCount();
    EntryManager.update(STATE.currentId, { content: this.getHTML() });
    markDirty();
    Toast.show('图片已插入！🖼️', 'success');
  },

  /** 插入链接 */
  insertLink(url, text) {
    DOM.editorContent.focus();
    const displayText = text.trim() || url;
    const html = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(displayText)}</a>`;
    document.execCommand('insertHTML', false, html);
    this.updateWordCount();
    markDirty();
    Toast.show('链接已插入！🔗', 'success');
  },

  /** 插入分割线 */
  insertDivider() {
    DOM.editorContent.focus();
    document.execCommand('insertHorizontalRule', false, null);
    this.updateWordCount();
    markDirty();
  },

  /** 聚焦编辑器 */
  focus() {
    DOM.editorContent.focus();
  },
};

// ============================================================
//  附件管理
// ============================================================

const AttachmentManager = {
  /** 添加附件 */
  add(files) {
    const entry = EntryManager.get(STATE.currentId);
    if (!entry) return;

    let added = 0;
    Array.from(files).forEach(file => {
      // 限制单个文件 5MB
      if (file.size > 5 * 1024 * 1024) {
        Toast.show(`文件 "${file.name}" 超过 5MB，已跳过。`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment = {
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          name: file.name,
          type: file.type,
          size: file.size,
          dataURL: e.target.result,
        };
        entry.attachments.push(attachment);
        Storage.save(STATE.entries);
        renderAttachments();
        markDirty();
      };
      reader.readAsDataURL(file);
      added++;
    });

    if (added > 0) {
      Toast.show(`正在添加 ${added} 个文件…📎`, 'info', 1500);
    }
  },

  /** 删除附件 */
  remove(entryId, attachmentId) {
    const entry = EntryManager.get(entryId);
    if (!entry) return;
    entry.attachments = entry.attachments.filter(a => a.id !== attachmentId);
    Storage.save(STATE.entries);
    renderAttachments();
    markDirty();
  },

  /** 下载附件 */
  download(attachment) {
    const a = document.createElement('a');
    a.href = attachment.dataURL;
    a.download = attachment.name;
    a.click();
  },
};

// ============================================================
//  UI 渲染
// ============================================================

/** 渲染侧边栏日记列表 */
function renderEntryList() {
  const entries = STATE.searchQuery
    ? EntryManager.search(STATE.searchQuery)
    : STATE.entries;

  DOM.entryCount.textContent = STATE.searchQuery
    ? `找到 ${entries.length} 篇`
    : `共 ${STATE.entries.length} 篇日记`;

  if (entries.length === 0) {
    DOM.entryList.innerHTML = `
      <div style="text-align:center;padding:32px 16px;color:var(--text-muted);font-style:italic;">
        ${STATE.searchQuery ? '🔍 未找到匹配的日记' : '📝 还没有日记<br>点击上方按钮开始写吧'}
      </div>`;
    return;
  }

  DOM.entryList.innerHTML = entries.map(entry => {
    const date = new Date(entry.date);
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    const title = entry.title || '（无标题）';
    const preview = stripHtml(entry.content).slice(0, 50) || '空内容';
    const mood = entry.mood ? MOOD_MAP[entry.mood] || '' : '';
    const isActive = entry.id === STATE.currentId;

    return `
      <div class="entry-item${isActive ? ' active' : ''}" data-id="${entry.id}">
        <div class="entry-item-date">${dateStr}</div>
        <div class="entry-item-title">${escapeHtml(title)}</div>
        <div class="entry-item-preview">${escapeHtml(preview)}</div>
        ${mood ? `<span class="entry-item-mood">${mood}</span>` : ''}
      </div>
    `;
  }).join('');
}

/** 渲染附件列表 */
function renderAttachments() {
  const entry = EntryManager.get(STATE.currentId);
  if (!entry || entry.attachments.length === 0) {
    DOM.attachmentsList.innerHTML = '<p class="no-attachments">暂无附件</p>';
    return;
  }

  DOM.attachmentsList.innerHTML = entry.attachments.map(att => `
    <div class="attachment-item">
      <span>📄</span>
      <span class="att-name" title="${escapeHtml(att.name)}">${escapeHtml(att.name)}</span>
      <span class="att-size">${formatFileSize(att.size)}</span>
      <button class="att-download" title="下载">⬇</button>
      <button class="att-remove" title="移除">✕</button>
    </div>
  `).join('');

  // 绑定下载按钮
  DOM.attachmentsList.querySelectorAll('.att-download').forEach((btn, i) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      AttachmentManager.download(entry.attachments[i]);
    });
  });

  // 绑定移除按钮
  DOM.attachmentsList.querySelectorAll('.att-remove').forEach((btn, i) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      AttachmentManager.remove(STATE.currentId, entry.attachments[i].id);
    });
  });
}

/** 加载日记到编辑器 */
function loadEntryToEditor(id) {
  const entry = EntryManager.get(id);
  if (!entry) return;

  STATE.currentId = id;
  STATE.isDirty = false;

  DOM.editorPanel.style.display = 'flex';
  DOM.emptyState.style.display = 'none';
  DOM.entryDate.value = entry.date;
  DOM.entryMood.value = entry.mood;
  DOM.entryTitle.value = entry.title;
  Editor.setHTML(entry.content);
  renderAttachments();
  updateSaveIndicator();
}

/** 打开新日记 */
function openNewEntry() {
  const entry = EntryManager.create();
  STATE.currentId = entry.id;
  STATE.isDirty = false;

  DOM.editorPanel.style.display = 'flex';
  DOM.emptyState.style.display = 'none';
  DOM.entryDate.value = entry.date;
  DOM.entryMood.value = '';
  DOM.entryTitle.value = '';
  Editor.setHTML('');
  renderAttachments();
  updateSaveIndicator();
  renderEntryList();
  Editor.focus();
}

/** 保存当前日记 */
function saveCurrentEntry() {
  if (!STATE.currentId) return;

  const data = {
    title: DOM.entryTitle.value.trim(),
    content: Editor.getHTML(),
    mood: DOM.entryMood.value,
    date: DOM.entryDate.value,
  };

  EntryManager.update(STATE.currentId, data);
  STATE.isDirty = false;
  updateSaveIndicator();
  renderEntryList();
}

/** 更新保存状态指示器 */
function updateSaveIndicator() {
  if (STATE.isDirty) {
    DOM.saveIndicator.textContent = '⏳ 未保存';
    DOM.saveIndicator.className = 'save-indicator unsaved';
  } else {
    DOM.saveIndicator.textContent = '💾 已保存';
    DOM.saveIndicator.className = 'save-indicator';
  }

  const entry = EntryManager.get(STATE.currentId);
  if (entry) {
    const updated = new Date(entry.updatedAt);
    DOM.lastSaved.textContent = formatTimeAgo(updated);
  } else {
    DOM.lastSaved.textContent = '';
  }
}

/** 标记为有未保存更改 */
function markDirty() {
  STATE.isDirty = true;
  updateSaveIndicator();

  // 自动保存：2 秒无操作后自动保存
  clearTimeout(STATE.autoSaveTimer);
  STATE.autoSaveTimer = setTimeout(() => {
    if (STATE.isDirty && STATE.currentId) {
      saveCurrentEntry();
    }
  }, 2000);
}

/** 关闭编辑器，返回空状态 */
function closeEditor() {
  STATE.currentId = null;
  STATE.isDirty = false;
  clearTimeout(STATE.autoSaveTimer);
  DOM.editorPanel.style.display = 'none';
  DOM.emptyState.style.display = 'flex';
  DOM.searchInput.value = '';
  STATE.searchQuery = '';
  DOM.btnClearSearch.style.display = 'none';
  renderEntryList();
}

// ============================================================
//  工具栏状态同步
// ============================================================

function updateToolbarState() {
  const buttons = $$('.tool-btn[data-command]');
  buttons.forEach(btn => {
    const command = btn.dataset.command;
    const value = btn.dataset.value || null;

    if (command === 'formatBlock') {
      const currentBlock = document.queryCommandValue('formatBlock') || 'p';
      btn.classList.toggle('active', currentBlock.toLowerCase() === (value || 'p').toLowerCase());
    } else {
      const state = document.queryCommandState(command);
      btn.classList.toggle('active', state);
    }
  });
}

// ============================================================
//  事件绑定
// ============================================================

function bindEvents() {
  // --- 新建日记 ---
  $('#btnNewEntry').addEventListener('click', () => {
    if (STATE.isDirty) saveCurrentEntry();
    openNewEntry();
  });

  $('#btnEmptyNew').addEventListener('click', () => {
    openNewEntry();
  });

  // --- 日记列表点击 ---
  DOM.entryList.addEventListener('click', (e) => {
    const item = e.target.closest('.entry-item');
    if (!item) return;
    const id = item.dataset.id;
    if (id === STATE.currentId) return;
    if (STATE.isDirty) saveCurrentEntry();
    loadEntryToEditor(id);
    renderEntryList();
  });

  // --- 内容编辑 ---
  DOM.editorContent.addEventListener('input', () => {
    Editor.updateWordCount();
    markDirty();
  });

  DOM.editorContent.addEventListener('keydown', (e) => {
    // Ctrl+S 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveCurrentEntry();
      Toast.show('日记已保存！💾', 'success', 1500);
    }
  });

  // 更新工具栏按钮状态
  DOM.editorContent.addEventListener('keyup', updateToolbarState);
  DOM.editorContent.addEventListener('mouseup', updateToolbarState);

  // --- 标题和元数据变更 ---
  DOM.entryTitle.addEventListener('input', () => markDirty());
  DOM.entryDate.addEventListener('change', () => markDirty());
  DOM.entryMood.addEventListener('change', () => markDirty());

  // --- 保存按钮 ---
  $('#btnSaveEntry').addEventListener('click', () => {
    saveCurrentEntry();
    Toast.show('日记已保存！💾', 'success', 1500);
  });

  // --- 删除按钮 ---
  $('#btnDeleteEntry').addEventListener('click', () => {
    if (!STATE.currentId) return;
    Modal.open('modalDeleteOverlay');
  });

  $('#btnConfirmDelete').addEventListener('click', () => {
    if (!STATE.currentId) return;
    const id = STATE.currentId;
    EntryManager.delete(id);
    Modal.close('modalDeleteOverlay');
    closeEditor();
    Toast.show('日记已删除。🗑️', 'info');
  });

  // --- 工具栏按钮 ---
  $('#toolbar').addEventListener('click', (e) => {
    const btn = e.target.closest('.tool-btn');
    if (!btn) return;

    e.preventDefault();

    const command = btn.dataset.command;
    const value = btn.dataset.value || null;

    if (command) {
      if (command === 'formatBlock') {
        // 切换回正文
        const currentBlock = document.queryCommandValue('formatBlock') || 'p';
        if (currentBlock.toLowerCase() === value.toLowerCase()) {
          Editor.execCommand('formatBlock', 'p');
        } else {
          Editor.execCommand(command, value);
        }
      } else {
        Editor.execCommand(command, value);
      }
      updateToolbarState();
      markDirty();
    }
  });

  // --- 插入图片 ---
  $('#btnInsertImage').addEventListener('click', (e) => {
    e.preventDefault();
    $('#hiddenImageInput').click();
  });

  $('#hiddenImageInput').addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      Array.from(files).forEach(file => Editor.insertImage(file));
    }
    e.target.value = ''; // 清空以允许重复选择同一文件
  });

  // 支持粘贴图片 (Ctrl+V)
  DOM.editorContent.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        Editor.insertImage(file);
        return;
      }
    }
  });

  // 支持拖拽图片到编辑器
  DOM.editorContent.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  DOM.editorContent.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          Editor.insertImage(file);
        }
      });
    }
  });

  // --- 插入链接 ---
  $('#btnInsertLink').addEventListener('click', (e) => {
    e.preventDefault();
    // 预填选中文本
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';
    DOM.linkText.value = selectedText;
    DOM.linkUrl.value = '';
    Modal.open('modalLinkOverlay');
    setTimeout(() => DOM.linkUrl.focus(), 150);
  });

  $('#btnConfirmLink').addEventListener('click', () => {
    const url = DOM.linkUrl.value.trim();
    if (!url) {
      Toast.show('请输入链接地址。', 'error');
      return;
    }
    // 自动补全协议
    const fullUrl = /^https?:\/\//i.test(url) ? url : 'https://' + url;
    Editor.insertLink(fullUrl, DOM.linkText.value);
    Modal.close('modalLinkOverlay');
  });

  // --- 插入分割线 ---
  $('#btnInsertDivider').addEventListener('click', (e) => {
    e.preventDefault();
    Editor.insertDivider();
  });

  // --- 附件上传 ---
  $('#fileAttachment').addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      AttachmentManager.add(files);
    }
    e.target.value = '';
  });

  // --- 搜索 ---
  DOM.searchInput.addEventListener('input', (e) => {
    STATE.searchQuery = e.target.value.trim();
    DOM.btnClearSearch.style.display = STATE.searchQuery ? 'block' : 'none';

    // 搜索结果中高亮
    if (STATE.searchQuery && STATE.entries.length > 0) {
      // 自动打开第一篇匹配的日记
      const results = EntryManager.search(STATE.searchQuery);
      if (results.length > 0 && STATE.currentId !== results[0].id) {
        if (STATE.isDirty) saveCurrentEntry();
        loadEntryToEditor(results[0].id);
      }
    }

    renderEntryList();
  });

  DOM.btnClearSearch.addEventListener('click', () => {
    DOM.searchInput.value = '';
    STATE.searchQuery = '';
    DOM.btnClearSearch.style.display = 'none';
    renderEntryList();
  });

  // --- 导出 ---
  $('#btnExport').addEventListener('click', () => {
    if (STATE.isDirty) saveCurrentEntry();
    Storage.export();
  });

  // --- 导入 ---
  $('#fileImport').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (confirm('导入将合并到现有日记中，确认继续？')) {
        Storage.import(file);
      }
    }
    e.target.value = '';
  });

  // --- 模态框关闭 ---
  document.addEventListener('click', (e) => {
    // 点击遮罩关闭
    if (e.target.classList.contains('modal-overlay')) {
      Modal.close(e.target.id);
    }
    // 关闭按钮
    const closeBtn = e.target.closest('[data-close]');
    if (closeBtn) {
      Modal.close(closeBtn.dataset.close);
    }
  });

  // ESC 关闭模态框
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      Modal.closeAll();
    }
  });

  // --- 链接模态框中回车确认 ---
  $('#modalLinkOverlay').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('#btnConfirmLink').click();
    }
  });

  // --- 窗口关闭前提示 ---
  window.addEventListener('beforeunload', (e) => {
    if (STATE.isDirty) {
      e.preventDefault();
      e.returnValue = '您有未保存的更改，确定要离开吗？';
      return e.returnValue;
    }
  });
}

// ============================================================
//  工具函数
// ============================================================

/** 去除 HTML 标签 */
function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/** HTML 转义 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** 格式化文件大小 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

/** 格式化相对时间 */
function formatTimeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚保存';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 30) return `${days} 天前`;
  return new Date(date).toLocaleDateString('zh-CN');
}

// ============================================================
//  初始化
// ============================================================

function init() {
  // 加载数据
  STATE.entries = Storage.load();

  // 绑定事件
  bindEvents();

  // 渲染日记列表
  renderEntryList();

  // 设置今天的日期为默认值
  DOM.entryDate.value = new Date().toISOString().slice(0, 10);

  console.log('📖 复古日记已就绪');
  console.log(`   已加载 ${STATE.entries.length} 篇日记`);
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);
