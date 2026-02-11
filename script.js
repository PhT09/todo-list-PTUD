// Select DOM elements
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const itemsLeft = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed');

// State management
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// Migration: Đảm bảo dữ liệu cũ cũng có ID
todos = todos.map((todo, index) => {
    if (!todo.id) {
        return { ...todo, id: Date.now() + index };
    }
    return todo;
});
saveTodos();

// Function to save to local storage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Function to update status bar
function updateStats() {
    const activeCount = todos.filter(todo => !todo.completed).length;
    itemsLeft.textContent = `${activeCount} công việc còn lại`;
}

// Helper to create Todo Element
function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id; // Lưu ID vào dataset của element

    li.innerHTML = `
        <span class="todo-text">${todo.text}</span>
        <div class="actions">
            <button class="action-btn check-btn" title="Hoàn thành">
                <i class="fa-solid fa-check"></i>
            </button>
            <button class="action-btn delete-btn" title="Xóa">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `;
    return li;
}

// Initial Render (Chỉ chạy 1 lần khi load trang)
function initRender() {
    todoList.innerHTML = '';
    todos.forEach(todo => {
        const li = createTodoElement(todo);
        todoList.appendChild(li);
    });
    updateStats();
}

// Add Todo
function addTodo() {
    const text = todoInput.value.trim();
    if (text === '') return;

    const newTodo = {
        id: Date.now(), // ID duy nhất theo thời gian thực
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    todos.unshift(newTodo);
    saveTodos();

    // Thao tác DOM trực tiếp: Tạo và thêm vào đầu danh sách
    const li = createTodoElement(newTodo);
    li.style.animation = 'slideIn 0.3s ease forwards';
    todoList.prepend(li);

    updateStats();

    todoInput.value = '';
    todoInput.focus();
}

// Handle Interactions via Event Delegation (Bắt sự kiện click trên toàn bộ list)
todoList.addEventListener('click', (e) => {
    const target = e.target;

    // Xử lý click vào check button hoặc nút xóa
    const btn = target.closest('button');
    // Xử lý click vào text để toggle
    const textSpan = target.closest('.todo-text');

    // Lấy thẻ li cha
    const li = target.closest('li.todo-item');
    if (!li) return;

    const id = Number(li.dataset.id);

    if (textSpan) {
        toggleTodo(id, li);
        return;
    }

    if (btn) {
        if (btn.classList.contains('check-btn')) {
            toggleTodo(id, li);
        } else if (btn.classList.contains('delete-btn')) {
            deleteTodo(id, li);
        }
    }
});

function toggleTodo(id, liElement) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();

        // Chỉ update class của element này, không render lại cả list
        liElement.classList.toggle('completed');
        updateStats();
    }
}

function deleteTodo(id, liElement) {
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
        todos.splice(index, 1);
        saveTodos();

        // Animation biến mất trước khi xóa khỏi DOM
        liElement.style.transform = 'translateX(50px)';
        liElement.style.opacity = '0';

        setTimeout(() => {
            liElement.remove();
            updateStats();
        }, 300); // Chờ animation CSS 0.3s kết thúc
    }
}

function clearCompleted() {
    const completedTodos = todos.filter(t => t.completed);
    if (completedTodos.length === 0) return;

    // Update Data
    todos = todos.filter(t => !t.completed);
    saveTodos();

    // Update DOM: Tìm các phần tử đã hoàn thành và xóa
    const completedElements = todoList.querySelectorAll('.todo-item.completed');

    completedElements.forEach(el => {
        el.style.transform = 'scale(0.8)';
        el.style.opacity = '0';
        setTimeout(() => {
            el.remove();
        }, 300);
    });

    // Cập nhật số lượng item ngay lập tức
    updateStats();
}

// Event Listeners
addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        addTodo();
    }
});

clearCompletedBtn.addEventListener('click', clearCompleted);

// Start app
initRender();
