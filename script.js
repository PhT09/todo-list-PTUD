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

// --- State ---
let todos = []; // Local mirror of displayed todos
let currentPage = 1;
const limit = 5;
let totalItems = 0;
let searchQuery = '';
let currentFilter = 'all'; // 'all', 'active', 'completed'
let sortOrder = 'desc'; // 'desc', 'asc'
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

    // Check empty state visual
    if (todos.length === 0 && totalItems === 0) {
        todoList.innerHTML = '<li style="text-align:center; color: #64748b; padding: 20px;" id="empty-msg">Không có công việc nào</li>';
    } else if (todos.length > 0) {
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
        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        return data; // {items, total}
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
    if (!response.ok) throw new Error('Failed to create');
    return await response.json();
}

async function apiUpdateTodo(id, updates) {
    // Using PATCH for partial updates
    const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update');
    return await response.json();
}

async function apiDeleteTodo(id) {
    const response = await fetch(`${API_URL}/todos/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete');
    return true;
}

// --- DOM Manipulation ---

function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.is_done ? 'completed' : ''}`;
    li.dataset.id = todo.id;

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
        updatePaginationInfo(); // Will show empty msg
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

// --- Event Handlers ---

// 1. ADD TODO
async function handleAddTodo() {
    const title = todoInput.value.trim();
    const description = todoDescInput.value.trim();

    if (title.length < 3 || title.length > 100) {
        alert('Tiêu đề phải từ 3 đến 100 ký tự');
        return;
    }

    try {
        const newTodo = await apiCreateTodo({ title, description, is_done: false });

        // Reset Inputs
        todoInput.value = '';
        todoDescInput.value = '';

        // Surgical Update Logic
        // Check if new item belongs on current page
        // Conditions: 
        // 1. Filter: 'all' or 'active' (since new items are not done)
        // 2. Sort: 'desc' (Newest first) -> Should appear at top of Page 1
        // 3. Sort: 'asc'  (Oldest first) -> Should appear at end of LAST Page. If we are on first page, we won't see it (likely).

        const matchesFilter = currentFilter !== 'completed';
        const isFirstPage = currentPage === 1;
        const isDescSort = sortOrder === 'desc';

        // Always update total count
        totalItems++;

        if (matchesFilter && isFirstPage && isDescSort) {
            // Remove empty message if exists
            const emptyMsg = document.getElementById('empty-msg');
            if (emptyMsg) emptyMsg.remove();

            // UI: Prepend
            const newLi = createTodoElement(newTodo);
            todoList.prepend(newLi);

            // State: Unshift
            todos.unshift(newTodo);

            // Pagination Limit Enforcement
            if (todos.length > limit) {
                // Remove last visualization
                if (todoList.lastElementChild) todoList.lastElementChild.remove();
                // Remove from local state
                todos.pop();
            }
        }

        // Update pagination bar text (Total changed)
        updatePaginationInfo();

    } catch (e) {
        alert('Lỗi khi thêm công việc: ' + e.message);
    }
}

// Event Delegation for List Actions
todoList.addEventListener('click', async (e) => {
    const target = e.target;
    // Normalize target to specific interactive elements
    const btn = target.closest('button');
    const contentDiv = target.closest('.todo-content');
    const li = target.closest('li.todo-item');

    if (!li) return;
    const id = Number(li.dataset.id);
    const todoIndex = todos.findIndex(t => t.id === id);
    const todo = todos[todoIndex];

    // 2. TOGGLE STATUS
    if ((contentDiv && !li.classList.contains('edit-mode')) || (btn && btn.classList.contains('check-btn'))) {
        if (!todo) return;
        const newStatus = !todo.is_done;

        // Optimistic UI Class Toggle (Instant feedback)
        li.classList.toggle('completed');
        const icon = li.querySelector('.check-btn i');
        if (icon) icon.className = `fa-solid ${newStatus ? 'fa-rotate-left' : 'fa-check'}`;

        try {
            // API Call
            const updatedTodo = await apiUpdateTodo(id, { is_done: newStatus });

            // Sync Local State
            todos[todoIndex] = updatedTodo;

            // Surgical Check: Does it still belong in this list?
            let shouldRemove = false;
            if (currentFilter === 'active' && newStatus === true) shouldRemove = true;
            if (currentFilter === 'completed' && newStatus === false) shouldRemove = true;

            if (shouldRemove) {
                li.remove();
                todos.splice(todoIndex, 1);
                totalItems--;

                // If page becomes empty, we might need to fetch
                if (todos.length === 0 && totalItems > 0) {
                    // Go to previous page? or Stay and fetch? 
                    // Usually stay. But if we are on page 2 and it becomes empty, go to page 1.
                    if (currentPage > 1) {
                        currentPage--;
                    }
                    refreshTodos(); // Fetch to refill
                } else {
                    updatePaginationInfo();
                }
            }

        } catch (e) {
            // Revert UI on error
            li.classList.toggle('completed');
            if (icon) icon.className = `fa-solid ${!newStatus ? 'fa-rotate-left' : 'fa-check'}`;
            alert('Lỗi cập nhật trạng thái');
        }
    }

    // 3. DELETE
    else if (btn && btn.classList.contains('delete-btn')) {
        if (!confirm('Bạn có chắc chắn xóa?')) return;

        try {
            // Visual fade out first?
            li.style.opacity = '0.5';

            await apiDeleteTodo(id);

            // Surgical DOM Removal
            li.remove();

            // Update State
            todos.splice(todoIndex, 1);
            totalItems--;

            // Pagination Logic
            if (todos.length === 0 && totalItems > 0) {
                if (currentPage > 1) currentPage--;
                refreshTodos(); // Fetch to fill the page
            } else {
                updatePaginationInfo();
            }

        } catch (e) {
            li.style.opacity = '1';
            alert('Lỗi xóa công việc');
        }
    }

    // 4. ENTER EDIT MODE
    else if (btn && btn.classList.contains('edit-btn')) {
        if (!todo) return;
        li.classList.add('edit-mode');
        // Replace content with Form
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
            alert('Tiêu đề quá ngắn');
            return;
        }

        try {
            const updatedTodo = await apiUpdateTodo(id, { title: titleVal, description: descVal });

            // Update State
            todos[todoIndex] = updatedTodo;

            // Surgical Replace
            const newLi = createTodoElement(updatedTodo);
            li.replaceWith(newLi);

        } catch (e) {
            alert('Lỗi lưu công việc');
        }
    }

    // 6. CANCEL EDIT
    else if (btn && btn.classList.contains('cancel-btn')) {
        // Re-create original element
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

// Tabs
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

// Start
refreshTodos();