const API_URL = 'http://127.0.0.1:8000/api/v1';

// --- Select DOM elements ---
const todoInput = document.getElementById('todo-input');
const todoDescInput = document.getElementById('todo-desc-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const itemsLeft = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed');

const searchInput = document.getElementById('search-input');
const sortOrderSelect = document.getElementById('sort-order');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.getElementById('page-info');

// Create Toast Container
const toastContainer = document.createElement('div');
toastContainer.style.position = 'fixed';
toastContainer.style.bottom = '20px';
toastContainer.style.right = '20px';
toastContainer.style.zIndex = '9999';
document.body.appendChild(toastContainer);

function showNotification(message, type = 'error') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.padding = '12px 24px';
    toast.style.marginBottom = '10px';
    toast.style.borderRadius = '8px';
    toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
    toast.style.color = 'white';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';

    toastContainer.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.style.opacity = '1');

    // Remove after 3s
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// --- State ---
let todos = [];
let currentPage = 1;
const limit = 5;
let totalItems = 0;
let searchQuery = '';
let currentFilter = 'all';
let sortOrder = 'desc';
let debounceTimer;

// --- Helper Functions ---

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function updatePaginationInfo() {
    const totalPages = Math.ceil(totalItems / limit) || 1;
    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    itemsLeft.textContent = `${totalItems} công việc tìm thấy`;

    if (todos.length === 0 && totalItems === 0) {
        if (!document.getElementById('empty-msg')) {
            const msg = document.createElement('li');
            msg.id = 'empty-msg';
            msg.style.textAlign = 'center';
            msg.style.color = '#64748b';
            msg.style.padding = '20px';
            msg.textContent = 'Không có công việc nào';
            todoList.appendChild(msg);
        }
    } else {
        const emptyMsg = document.getElementById('empty-msg');
        if (emptyMsg) emptyMsg.remove();
    }
}

// --- API Calls ---

async function apiFetchTodos() {
    try {
        const offset = (currentPage - 1) * limit;
        const isDesc = sortOrder === 'desc';
        let url = `${API_URL}/todos?limit=${limit}&offset=${offset}&sort_desc=${isDesc}`;

        if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;

        if (currentFilter === 'active') url += `&is_done=false`;
        else if (currentFilter === 'completed') url += `&is_done=true`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.error(error);
        return { items: [], total: 0 };
    }
}

async function apiCreateTodo(todo) {
    const response = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo)
    });
    if (!response.ok) throw new Error('Create failed');
    return await response.json();
}

async function apiUpdateTodo(id, updates) {
    const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Update failed');
    return await response.json();
}

async function apiDeleteTodo(id) {
    const response = await fetch(`${API_URL}/todos/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Delete failed');
    return true;
}

// --- DOM Manipulation ---

function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.is_done ? 'completed' : ''}`;
    li.dataset.id = todo.id;

    // Add temp class if ID is temporary? Not really needed visually unless requested.

    const descHtml = todo.description ? `<div class="todo-desc">${escapeHtml(todo.description)}</div>` : '';

    li.innerHTML = `
        <div class="todo-content">
            <div class="todo-title">${escapeHtml(todo.title)}</div>
            ${descHtml}
        </div>
        <div class="actions">
            <button class="action-btn check-btn" title="Hoàn thành/Làm lại">
                <i class="fa-solid ${todo.is_done ? 'fa-rotate-left' : 'fa-check'}"></i>
            </button>
            <button class="action-btn edit-btn" title="Sửa nội dung">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="action-btn delete-btn" title="Xóa">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `;
    return li;
}

function renderTodoList() {
    todoList.innerHTML = '';
    if (todos.length === 0) {
        updatePaginationInfo();
        return;
    }

    const frag = document.createDocumentFragment();
    todos.forEach(todo => {
        frag.appendChild(createTodoElement(todo));
    });
    todoList.appendChild(frag);
    updatePaginationInfo();
}

async function refreshTodos() {
    const data = await apiFetchTodos();
    todos = data.items;
    totalItems = data.total;
    renderTodoList();
}

// --- Event Handlers (Optimistic) ---

// 1. ADD TODO
async function handleAddTodo() {
    const title = todoInput.value.trim();
    const description = todoDescInput.value.trim();

    if (title.length < 3) {
        showNotification('Tiêu đề phải từ 3 ký tự trở lên', 'error');
        return;
    }

    // Prepare temp data
    const tempId = Date.now();
    const newTodo = { id: tempId, title, description, is_done: false };

    // Optimistic Update Checks
    const matchesFilter = currentFilter !== 'completed';
    const isFirstPage = currentPage === 1;
    const isDescSort = sortOrder === 'desc';

    let addedToUi = false;
    let overflowTodo = null;

    if (matchesFilter && isFirstPage && isDescSort) {
        // UI
        const newLi = createTodoElement(newTodo);
        todoList.prepend(newLi);
        addedToUi = true;

        // State
        todos.unshift(newTodo);

        // Handle Limit
        if (todos.length > limit) {
            overflowTodo = todos.pop(); // Save for rollback if needed? 
            if (todoList.lastElementChild) todoList.lastElementChild.remove();
        }
    }

    // Total Items always increases
    totalItems++;
    updatePaginationInfo();

    // Clear Input immediately
    todoInput.value = '';
    todoDescInput.value = '';

    // Background API
    try {
        const realTodo = await apiCreateTodo({ title, description, is_done: false });

        // SYNC: Update ID
        // Find in local state
        const idx = todos.findIndex(t => t.id === tempId);
        if (idx !== -1) {
            todos[idx] = realTodo; // Replace with real object

            // Find in DOM
            const li = document.querySelector(`.todo-item[data-id="${tempId}"]`);
            if (li) li.dataset.id = realTodo.id;
        }

    } catch (e) {
        // ROLLBACK
        showNotification('Không thể thêm công việc. Đang hoàn tác...', 'error');

        if (addedToUi) {
            // Remove from UI
            const li = document.querySelector(`.todo-item[data-id="${tempId}"]`);
            if (li) {
                li.style.transition = 'opacity 0.3s';
                li.style.opacity = '0';
                setTimeout(() => li.remove(), 300);
            }

            // Remove from State
            const idx = todos.findIndex(t => t.id === tempId);
            if (idx !== -1) todos.splice(idx, 1);

            // Restore overflow if exists
            if (overflowTodo) {
                todos.push(overflowTodo);
                const overflowLi = createTodoElement(overflowTodo);
                todoList.appendChild(overflowLi);
            }
        }

        totalItems--;
        updatePaginationInfo();

        // Restore Inputs? Maybe useful for user retry
        todoInput.value = title;
        todoDescInput.value = description;
    }
}

// Event Delegation
todoList.addEventListener('click', async (e) => {
    const target = e.target;
    // Normalize target
    const btn = target.closest('button');
    const contentDiv = target.closest('.todo-content');
    const li = target.closest('li.todo-item');

    if (!li) return;
    const id = Number(li.dataset.id);
    const todoIndex = todos.findIndex(t => t.id === id);
    const todo = todos[todoIndex];

    if (!todo) return; // Should not happen

    // 2. TOGGLE STATUS
    if ((contentDiv && !li.classList.contains('edit-mode')) || (btn && btn.classList.contains('check-btn'))) {
        const oldStatus = todo.is_done;
        const newStatus = !oldStatus;

        // OPTIMISTIC UPDATE
        todo.is_done = newStatus; // Update Local State

        // Update UI
        li.classList.toggle('completed');
        const icon = li.querySelector('.check-btn i');
        if (icon) icon.className = `fa-solid ${newStatus ? 'fa-rotate-left' : 'fa-check'}`;

        // Check if item should disappear based on filter
        let shouldHide = false;
        if (currentFilter === 'active' && newStatus === true) shouldHide = true;
        if (currentFilter === 'completed' && newStatus === false) shouldHide = true;

        if (shouldHide) {
            li.style.display = 'none'; // Hide immediately
            totalItems--; // Temporarily decrease
            updatePaginationInfo();
            // Note: We don't remove from 'todos' array yet to make rollback easier? 
            // Actually better to keep state consistent.
            todos.splice(todoIndex, 1);
        }

        // BACKGROUND API
        try {
            await apiUpdateTodo(id, { is_done: newStatus });
            // Success: Do nothing more, state is already updated.
            // If hidden, we might want to fill the empty slot by fetching or just wait.
            // Current requirement says "do NOT call fetchTodos". So we leave it.

        } catch (e) {
            // ROLLBACK
            showNotification('Lỗi cập nhật trạng thái. Đang hoàn tác...', 'error');

            // Revert State
            todo.is_done = oldStatus;

            // Revert UI
            if (shouldHide) {
                // It was removed/hidden
                li.style.display = '';
                todos.splice(todoIndex, 0, todo); // Re-insert
                totalItems++;
                updatePaginationInfo();
            }

            li.classList.toggle('completed');
            if (icon) icon.className = `fa-solid ${oldStatus ? 'fa-rotate-left' : 'fa-check'}`;
        }
    }

    // 3. DELETE
    else if (btn && btn.classList.contains('delete-btn')) {
        if (!confirm('Bạn có chắc chắn xóa?')) return;

        // OPTIMISTIC UPDATE
        // Store for rollback
        const backupTodo = { ...todo };
        const backupIndex = todoIndex;
        const backupNextSibling = li.nextSibling; // For DOM position

        // UI: Remove immediately with transition?
        // Requirement says: "css opacity/transform"
        li.style.opacity = '0';
        li.style.transform = 'translateX(20px)';

        // Wait small delay for visual effect or just hide?
        // Immediate response requested.
        // We will execute logic immediately but let CSS play.
        setTimeout(() => {
            if (li.parentNode) li.remove(); // Remove from DOM
        }, 300);

        // Update State
        todos.splice(todoIndex, 1);
        totalItems--;
        updatePaginationInfo();

        // BACKGROUND API
        try {
            await apiDeleteTodo(id);
        } catch (e) {
            // ROLLBACK
            showNotification('Không thể xóa. Đang khôi phục...', 'error');

            // Restore State
            todos.splice(backupIndex, 0, backupTodo);
            totalItems++;
            updatePaginationInfo();

            // Restore UI
            // Need to recreate because 'li' might be removed
            const restoredLi = createTodoElement(backupTodo);

            // Insert back to correct position
            if (backupNextSibling) {
                todoList.insertBefore(restoredLi, backupNextSibling);
            } else {
                todoList.appendChild(restoredLi);
            }

            // Remove 'removed' styles (createTodoElement creates fresh)
        }
    }

    // 4. EDIT MODE (UI Only)
    else if (btn && btn.classList.contains('edit-btn')) {
        li.classList.add('edit-mode');
        li.innerHTML = `
            <div class="edit-form">
                <input type="text" class="edit-input-title" value="${escapeHtml(todo.title)}">
                <textarea class="edit-input-desc" rows="2">${escapeHtml(todo.description || '')}</textarea>
            </div>
            <div class="actions">
                <button class="action-btn save-btn"><i class="fa-solid fa-check"></i></button>
                <button class="action-btn cancel-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
        li.querySelector('.edit-input-title').focus();
    }

    // 5. SAVE EDIT
    else if (btn && btn.classList.contains('save-btn')) {
        const titleVal = li.querySelector('.edit-input-title').value.trim();
        const descVal = li.querySelector('.edit-input-desc').value.trim();

        if (titleVal.length < 3) {
            showNotification('Tiêu đề quá ngắn', 'error');
            return;
        }

        // Backup
        const oldTitle = todo.title;
        const oldDesc = todo.description;

        // OPTIMISTIC UPDATE
        todo.title = titleVal;
        todo.description = descVal;

        // Render new content immediately
        const newLi = createTodoElement(todo);
        li.replaceWith(newLi);

        // BACKGROUND API
        try {
            await apiUpdateTodo(id, { title: titleVal, description: descVal });
        } catch (e) {
            // ROLLBACK
            showNotification('Lỗi lưu thay đổi. Đang hoàn tác...', 'error');

            todo.title = oldTitle;
            todo.description = oldDesc;

            const originalLi = createTodoElement(todo);
            newLi.replaceWith(originalLi);
        }
    }

    // 6. CANCEL EDIT
    else if (btn && btn.classList.contains('cancel-btn')) {
        const originalLi = createTodoElement(todo);
        li.replaceWith(originalLi);
    }
});


// --- Filter & Pagination Handlers ---

searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        searchQuery = e.target.value.trim();
        currentPage = 1;
        refreshTodos();
    }, 300);
});

const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        currentPage = 1;
        refreshTodos();
    });
});

sortOrderSelect.addEventListener('change', (e) => {
    sortOrder = e.target.value;
    currentPage = 1;
    refreshTodos();
});

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        refreshTodos();
    }
});

nextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(totalItems / limit);
    if (currentPage < totalPages) {
        currentPage++;
        refreshTodos();
    }
});

addBtn.addEventListener('click', handleAddTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddTodo();
});

// Init
refreshTodos();