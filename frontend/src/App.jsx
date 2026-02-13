import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/Header'
import TodoInput from './components/TodoInput'
import FilterSortBar from './components/FilterSortBar'
import TodoList from './components/TodoList'
import PaginationBar from './components/PaginationBar'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import { todoApi } from './api/todoApi'
import './index.css'

// ────────────────────────────────────────────
// Main Todo App (shown when authenticated)
// ────────────────────────────────────────────
function TodoApp() {
    const { user, logout } = useAuth();
    const [todos, setTodos] = useState([])
    const [totalItems, setTotalItems] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    const [searchTerm, setSearchTerm] = useState('')
    const [currentFilter, setCurrentFilter] = useState('all')
    const [sortOrder, setSortOrder] = useState('desc')

    // Debounce Search
    const [debouncedSearch, setDebouncedSearch] = useState('')
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    // Data Fetching
    const fetchTodos = async () => {
        try {
            const offset = (currentPage - 1) * itemsPerPage
            const isDesc = sortOrder === 'desc'

            let is_done = undefined
            if (currentFilter === 'active') is_done = false
            if (currentFilter === 'completed') is_done = true

            const res = await todoApi.getAll({
                limit: itemsPerPage,
                offset: offset,
                q: debouncedSearch || undefined,
                is_done: is_done,
                sort_desc: isDesc
            });

            setTodos(res.data.items)
            setTotalItems(res.data.total)
        } catch (err) {
            console.error("Failed to fetch todos:", err)
            // If 401, token expired -> logout
            if (err.response?.status === 401) {
                logout();
            }
        }
    }

    useEffect(() => {
        fetchTodos()
    }, [currentPage, debouncedSearch, currentFilter, sortOrder])

    // --- Handlers ---
    const handleAdd = async (newTodoData) => {
        try {
            const res = await todoApi.create({ ...newTodoData, is_done: false })
            const newTodo = res.data;

            const isFirstPage = currentPage === 1;
            const isDesc = sortOrder === 'desc';
            const matchesFilter = currentFilter !== 'completed';

            if (isFirstPage && isDesc && matchesFilter) {
                setTodos(prev => [newTodo, ...prev].slice(0, itemsPerPage));
                setTotalItems(prev => prev + 1);
            } else {
                fetchTodos();
            }
        } catch (err) {
            alert("Lỗi khi thêm công việc: " + (err.response?.data?.detail || err.message));
        }
    }

    const handleToggle = async (id, newStatus) => {
        const oldTodos = [...todos];
        setTodos(prev => prev.map(t => t.id === id ? { ...t, is_done: newStatus } : t));
        try {
            await todoApi.update(id, { is_done: newStatus });
            if (currentFilter !== 'all') {
                fetchTodos();
            }
        } catch (err) {
            setTodos(oldTodos);
            alert("Lỗi cập nhật trạng thái");
        }
    }

    const handleDelete = async (id) => {
        const oldTodos = [...todos];
        setTodos(prev => prev.filter(t => t.id !== id));
        setTotalItems(prev => Math.max(0, prev - 1));
        try {
            await todoApi.delete(id);
            if (todos.length <= 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else if (todos.length <= itemsPerPage) {
                fetchTodos();
            }
        } catch (err) {
            setTodos(oldTodos);
            setTotalItems(prev => prev + 1);
            alert("Lỗi xóa công việc");
        }
    }

    const handleUpdateContent = async (id, data) => {
        const oldTodos = [...todos];
        setTodos(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
        try {
            await todoApi.update(id, data);
        } catch (err) {
            setTodos(oldTodos);
            alert("Lỗi cập nhật nội dung");
        }
    }

    const handleClearCompleted = async () => {
        if (!confirm("Bạn có chắc muốn xóa tất cả công việc đã hoàn thành?")) return;

        try {
            await todoApi.deleteCompleted();
            // Refresh list to sync pagination and counts correctly
            fetchTodos();
            setCurrentPage(1);
        } catch (err) {
            alert("Lỗi khi xóa: " + (err.response?.data?.detail || "Không thể thực hiện hành động này"));
        }
    }

    return (
        <div className="container">
            <Header />

            {/* User Info Bar */}
            <div className="user-bar">
                <span>👤 {user?.email}</span>
                <button className="logout-btn" onClick={logout}>Đăng Xuất</button>
            </div>

            <TodoInput onAdd={handleAdd} />

            <FilterSortBar
                currentFilter={currentFilter}
                onFilterChange={(filter) => { setCurrentFilter(filter); setCurrentPage(1); }}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
            />

            <TodoList
                todos={todos}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onUpdate={handleUpdateContent}
            />

            <div className="status-bar">
                <span id="items-left">{totalItems} công việc tìm thấy</span>
                <button id="clear-completed" onClick={handleClearCompleted}>
                    Xóa đã xong
                </button>
            </div>

            <PaginationBar
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
            />
        </div>
    )
}

// ────────────────────────────────────────────
// Auth Page (Login / Register)
// ────────────────────────────────────────────
function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="auth-container">
            <div className="auth-header">
                <h1>📝 Todo App</h1>
                <p>Quản lý công việc hiệu quả</p>
            </div>
            {isLogin
                ? <LoginForm onSwitch={() => setIsLogin(false)} />
                : <RegisterForm onSwitch={() => setIsLogin(true)} />
            }
        </div>
    );
}

// ────────────────────────────────────────────
// Root App (decides Auth vs Todo)
// ────────────────────────────────────────────
function AppContent() {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Đang tải...</p>
            </div>
        );
    }

    return token ? <TodoApp /> : <AuthPage />;
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App
