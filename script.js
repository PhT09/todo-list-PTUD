const API_URL = 'http://127.0.0.1:8000';

// Select DOM elements
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const itemsLeft = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed');

const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');
const sortOrderSelect = document.getElementById('sort-order');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.getElementById('page-info');

// State
let todos = [];
let currentPage = 1;
const limit = 5;
let totalItems = 0;
let searchQuery = '';
let currentFilter = 'all'; // all, active, completed
let sortOrder = 'desc'; // desc, asc

// --- API Functions ---

// Fetch todos with filtering and pagination
async function fetchTodos() {
    try {
        const offset = (currentPage - 1) * limit;
        const isDesc = sortOrder === 'desc';
        let url = `${API_URL}/todos?limit=${limit}&offset=${offset}&sort_desc=${isDesc}`;

        // Add Filters
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
    }
}

async function apiUpdateTodo(todo) {
    try {
        const response = await fetch(`${API_URL}/todos/${todo.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(todo),
        });
        if (!response.ok) throw new Error('Failed to update todo');
    } catch (error) {
        console.error('Error updating todo:', error);
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
    }
}

// --- UI Functions ---

function updatePagination() {
    const totalPages = Math.ceil(totalItems / limit) || 1;
    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    // Update items left count (contextual)
    itemsLeft.textContent = `${totalItems} công việc tìm thấy`;
}

function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.is_done ? 'completed' : ''}`;
    li.dataset.id = todo.id;

    // Normal View
    li.innerHTML = `
        <span class="todo-text">${todo.title}</span>
        <div class="actions">
            <button class="action-btn check-btn" title="Hoàn thành/Làm lại">
                <i class="fa-solid ${todo.is_done ? 'fa-rotate-left' : 'fa-check'}"></i>
            </button>
            <button class="action-btn edit-btn" title="Sửa tiêu đề">
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
    const text = todoInput.value.trim();
    if (text === '') return;

    // Validate length client-side
    if (text.length < 3 || text.length > 100) {
        alert('Tiêu đề phải từ 3 đến 100 ký tự');
        return;
    }

    const newTodo = {
        id: Date.now(),
        title: text,
        is_done: false
    };

    await apiCreateTodo(newTodo);

    todoInput.value = '';
    // Reset filters
    searchQuery = '';
    searchInput.value = '';
    currentFilter = 'all';

    // Reset Active Tab UI
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');

    sortOrder = 'desc';
    sortOrderSelect.value = 'desc';
    currentPage = 1;

    await fetchTodos();
}

// Event Delegation
todoList.addEventListener('click', async (e) => {
    const target = e.target;
    // Find closest interactive elements
    const btn = target.closest('button');
    const textSpan = target.closest('.todo-text');
    const li = target.closest('li.todo-item');

    if (!li) return;
    const id = Number(li.dataset.id);
    const todo = todos.find(t => t.id === id);

    // 1. Toggle Status
    if (textSpan || (btn && btn.classList.contains('check-btn'))) {
        if (todo) {
            todo.is_done = !todo.is_done;
            li.classList.toggle('completed');
            const icon = li.querySelector('.check-btn i');
            if (icon) icon.className = `fa-solid ${todo.is_done ? 'fa-rotate-left' : 'fa-check'}`;

            await apiUpdateTodo(todo);
            if (currentFilter !== 'all') fetchTodos();
        }
    }

    // 2. Delete
    else if (btn && btn.classList.contains('delete-btn')) {
        if (confirm('Bạn có chắc chắn muốn xóa?')) {
            li.style.opacity = '0';
            setTimeout(() => li.remove(), 300);
            await apiDeleteTodo(id);
            setTimeout(fetchTodos, 350);
        }
    }

    // 3. Edit Mode - Switch to Input
    else if (btn && btn.classList.contains('edit-btn')) {
        if (!todo) return;

        // Switch Li content to Edit Form
        li.classList.add('edit-mode');
        li.innerHTML = `
            <input type="text" class="edit-input" value="${todo.title}">
            <div class="actions">
                <button class="action-btn save-btn" title="Lưu">
                    <i class="fa-solid fa-check"></i>
                </button>
                <button class="action-btn cancel-btn" title="Hủy">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;

        const input = li.querySelector('.edit-input');
        input.focus();

        // Handle Enter key in edit input
        input.addEventListener('keypress', (ev) => {
            if (ev.key === 'Enter') {
                li.querySelector('.save-btn').click();
            }
        });
    }

    // 4. Save Edit
    else if (btn && btn.classList.contains('save-btn')) {
        const input = li.querySelector('.edit-input');
        const newTitle = input.value.trim();

        if (newTitle.length < 3 || newTitle.length > 100) {
            alert('Tiêu đề phải từ 3 đến 100 ký tự');
            input.focus();
            return;
        }

        if (todo) {
            todo.title = newTitle;
            // Optimistic update
            const newLi = createTodoElement(todo);
            li.replaceWith(newLi);

            await apiUpdateTodo(todo);
            // No fetch needed if success, local state is updated
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
    }, 300); // 300ms debounce
});

// Filter Tabs Event
const filterButtons = document.querySelectorAll('.filter-btn');

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active from all
        filterButtons.forEach(b => b.classList.remove('active'));
        // Add active to click
        btn.classList.add('active');

        // Update Filter Logic
        currentFilter = btn.dataset.filter;
        currentPage = 1;
        fetchTodos();
    });
});

sortOrderSelect.addEventListener('change', (e) => {
    sortOrder = e.target.value;
    currentPage = 1; // Reset về trang 1 khi đổi cách sắp xếp
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
        // Logic này hơi phức tạp ở client vì pagination, 
        // đúng ra nên có API delete bulk. 
        // Ở đây tạm thời ta sẽ không implement bulk delete qua filter ở client 
        // vì nó chỉ xóa những gì đang hiển thị.
        alert('Tính năng xóa hàng loạt cần nâng cấp backend hỗ trợ Bulk Delete!');
    }
});

// Init
fetchTodos();