const API_URL = 'http://127.0.0.1:8000/api/v1';

// Select DOM elements
const todoInput = document.getElementById('todo-input');
const todoDescInput = document.getElementById('todo-desc-input'); // New Description Input
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const itemsLeft = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed');

const searchInput = document.getElementById('search-input');
const sortOrderSelect = document.getElementById('sort-order');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.getElementById('page-info');

// State
let todos = [];
let currentPage = 1;
const limit = 5; // Pagination limit
let totalItems = 0;
let searchQuery = '';
let currentFilter = 'all'; // all, active, completed
let sortOrder = 'desc'; // desc, asc

// Helper for XSS safety
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- API Functions ---

async function fetchTodos() {
    try {
        const offset = (currentPage - 1) * limit;
        const isDesc = sortOrder === 'desc';
        let url = `${API_URL}/todos?limit=${limit}&offset=${offset}&sort_desc=${isDesc}`;

        if (searchQuery) {
            url += `&q=${encodeURIComponent(searchQuery)}`;
        }

        if (currentFilter === 'active') {
            url += `&is_done=false`;
        } else if (currentFilter === 'completed') {
            url += `&is_done=true`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch todos');

        const data = await response.json();
        todos = data.items;
        totalItems = data.total;

        renderTodos();
        updatePagination();
    } catch (error) {
        console.error('Error fetching todos:', error);
    }
}

async function apiCreateTodo(todo) {
    try {
        const response = await fetch(`${API_URL}/todos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(todo),
        });
        if (!response.ok) {
            const err = await response.json();
            alert(`Lỗi: ${err.detail || 'Không thể tạo công việc'}`);
            throw new Error('Failed to create todo');
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating todo:', error);
        throw error;
    }
}

async function apiUpdateTodo(id, todoUpdate) {
    try {
        // Use PATCH for partial updates
        const response = await fetch(`${API_URL}/todos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(todoUpdate),
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('Update failed:', err);
            throw new Error('Failed to update todo');
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating todo:', error);
        throw error;
    }
}

async function apiDeleteTodo(id) {
    try {
        const response = await fetch(`${API_URL}/todos/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete todo');
    } catch (error) {
        console.error('Error deleting todo:', error);
        throw error;
    }
}

// --- UI Functions ---

function updatePagination() {
    const totalPages = Math.ceil(totalItems / limit) || 1;
    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    itemsLeft.textContent = `${totalItems} công việc tìm thấy`;
}

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

function renderTodos() {
    todoList.innerHTML = '';

    if (todos.length === 0) {
        todoList.innerHTML = '<li style="text-align:center; color: #64748b; padding: 20px;">Không có công việc nào</li>';
        return;
    }

    todos.forEach(todo => {
        const li = createTodoElement(todo);
        todoList.appendChild(li);
    });
}

// --- Action Handlers ---

async function handleAddTodo() {
    const title = todoInput.value.trim();
    const description = todoDescInput.value.trim();

    if (title === '') return;

    if (title.length < 3 || title.length > 100) {
        alert('Tiêu đề phải từ 3 đến 100 ký tự');
        return;
    }

    // Don't send ID, let backend generate it
    const newTodoPayload = { title, description, is_done: false };

    try {
        const createdTodo = await apiCreateTodo(newTodoPayload);

        // Optimistic UI Update: Prepend to list directly to avoid full reload blink
        // Only if sortOrder is 'desc' (Mới nhất) and page is 1
        // Or we can just fetchTodos() but we want to avoid blink.

        // Let's rely on fetchTodos() for consistency but try to be smoother?
        // Actually, user explicitly asked to fix "blink".
        // The blink comes from innerHTML clear.
        // If we manually prepend, we don't clear list.

        const isFirstPage = currentPage === 1;
        const isDesc = sortOrder === 'desc';
        const isAllOrActive = currentFilter !== 'completed';

        if (isFirstPage && isDesc && isAllOrActive) {
            const li = createTodoElement(createdTodo);
            todoList.prepend(li); // Add to top
            todos.unshift(createdTodo);

            // Remove last item if over limit
            if (todos.length > limit) {
                todoList.lastElementChild.remove();
                todos.pop();
            }
            totalItems++;
            updatePagination();
        } else {
            // If we are on other pages, we should probably fetch to see correct state
            // Or just alert user? No, fetch.
            await fetchTodos();
        }

        todoInput.value = '';
        todoDescInput.value = ''; // Clear desc
    } catch (e) {
        // Error handled in api func
    }
}

// Event Delegation
todoList.addEventListener('click', async (e) => {
    const target = e.target;
    // Helper to find button even if icon clicked
    const btn = target.closest('button');
    const contentDiv = target.closest('.todo-content');
    const li = target.closest('li.todo-item');

    if (!li) return;
    const id = Number(li.dataset.id);
    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex === -1 && !li.classList.contains('edit-mode')) return; // Safety check

    let todo = todos[todoIndex];

    // 1. Toggle Status
    if ((contentDiv && !li.classList.contains('edit-mode')) || (btn && btn.classList.contains('check-btn'))) {
        if (todo) {
            const newStatus = !todo.is_done;
            // Optimistic update
            todo.is_done = newStatus;
            li.classList.toggle('completed');

            // Toggle icon
            const icon = li.querySelector('.check-btn i');
            if (icon) icon.className = `fa-solid ${newStatus ? 'fa-rotate-left' : 'fa-check'}`;

            try {
                await apiUpdateTodo(id, { is_done: newStatus });
                // Should we remove item if filter is active/completed?
                // To avoid blink, let's keep it but maybe fade it?
                // User flow: if filter is 'active' and I check 'done', it should disappear?
                if (currentFilter !== 'all') {
                    // If filter mismatch, remove element gracefully
                    li.style.transition = 'all 0.3s';
                    li.style.opacity = '0';
                    setTimeout(() => {
                        li.remove();
                        todos.splice(todoIndex, 1);
                        totalItems--;
                        updatePagination();
                        // If page becomes empty, fetch previous
                        if (todos.length === 0 && currentPage > 1) {
                            currentPage--;
                            fetchTodos();
                        } else if (todos.length < limit) {
                            // Try to fill gap? Complex. Let's just fetchTodos if we want perfection.
                            fetchTodos();
                        }
                    }, 300);
                }
            } catch (err) {
                // Revert
                todo.is_done = !newStatus;
                li.classList.toggle('completed');
                if (icon) icon.className = `fa-solid ${!newStatus ? 'fa-rotate-left' : 'fa-check'}`;
                alert('Có lỗi xảy ra khi cập nhật trạng thái');
            }
        }
    }

    // 2. Delete
    else if (btn && btn.classList.contains('delete-btn')) {
        if (confirm('Bạn có chắc chắn muốn xóa?')) {
            // Optimistic Remove
            li.style.transition = 'all 0.3s';
            li.style.opacity = '0';
            setTimeout(async () => {
                li.remove();

                try {
                    await apiDeleteTodo(id);
                    // Update state
                    todos.splice(todoIndex, 1);
                    totalItems--;
                    updatePagination();

                    // If list too small, fetch to refill
                    fetchTodos();
                } catch (err) {
                    alert('Không thể xóa công việc');
                    fetchTodos(); // Restore
                }
            }, 300);
        }
    }

    // 3. Edit Mode - Switch to Inputs
    else if (btn && btn.classList.contains('edit-btn')) {
        if (!todo) return;

        li.classList.add('edit-mode');

        // Inject Edit Form
        const currentTitle = todo.title;
        const currentDesc = todo.description || '';

        li.innerHTML = `
            <div class="edit-form">
                <input type="text" class="edit-input-title" value="${escapeHtml(currentTitle)}" placeholder="Tiêu đề">
                <textarea class="edit-input-desc" placeholder="Mô tả" rows="2">${escapeHtml(currentDesc)}</textarea>
            </div>
            <div class="actions">
                <button class="action-btn save-btn" title="Lưu">
                    <i class="fa-solid fa-check"></i>
                </button>
                <button class="action-btn cancel-btn" title="Hủy">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;

        const inputTitle = li.querySelector('.edit-input-title');
        inputTitle.focus();
    }

    // 4. Save Edit
    else if (btn && btn.classList.contains('save-btn')) {
        const inputTitle = li.querySelector('.edit-input-title');
        const inputDesc = li.querySelector('.edit-input-desc');

        const newTitle = inputTitle.value.trim();
        const newDesc = inputDesc.value.trim();

        if (newTitle.length < 3 || newTitle.length > 100) {
            alert('Tiêu đề phải từ 3 đến 100 ký tự');
            inputTitle.focus();
            return;
        }

        // Call API
        try {
            const updatedTodo = await apiUpdateTodo(id, {
                title: newTitle,
                description: newDesc
            });

            // Update local state
            todos[todoIndex] = updatedTodo;

            // Render new Item inplace
            const newLi = createTodoElement(updatedTodo);
            li.replaceWith(newLi);

        } catch (err) {
            alert('Lỗi cập nhật công việc');
        }
    }

    // 5. Cancel Edit
    else if (btn && btn.classList.contains('cancel-btn')) {
        // Re-render original item
        if (todo) {
            const originalLi = createTodoElement(todo);
            li.replaceWith(originalLi);
        }
    }
});

// Filter & Search Events
let debounceTimer;
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        searchQuery = e.target.value.trim();
        currentPage = 1;
        fetchTodos();
    }, 300);
});

// Filter Tabs Event
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        currentPage = 1;
        fetchTodos();
    });
});

sortOrderSelect.addEventListener('change', (e) => {
    sortOrder = e.target.value;
    currentPage = 1;
    fetchTodos();
});


// Pagination Events
prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchTodos();
    }
});

nextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(totalItems / limit);
    if (currentPage < totalPages) {
        currentPage++;
        fetchTodos();
    }
});

// Basic Events
addBtn.addEventListener('click', handleAddTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddTodo();
});
clearCompletedBtn.addEventListener('click', async () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả công việc đã hoàn thành?')) {
        alert('Tính năng xóa hàng loạt cần nâng cấp backend hỗ trợ Bulk Delete!');
    }
});

// Init
fetchTodos();