import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import ThemeToggle from './components/ThemeToggle'
import TodoInput from './components/TodoInput'
import FilterSortBar from './components/FilterSortBar'
import TodoList from './components/TodoList'
import PaginationBar from './components/PaginationBar'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import Dashboard from './components/Dashboard'
import { todoApi } from './api/todoApi'
import { FaSignOutAlt } from 'react-icons/fa'
import './index.css'

import TrashManager from './components/TrashManager'

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
    const [isTrashOpen, setIsTrashOpen] = useState(false)
    const [trashCount, setTrashCount] = useState(0)
    const [showDashboard, setShowDashboard] = useState(false)

    useEffect(() => {
        fetchTrashCount();
    }, []);

    const fetchTrashCount = () => {
        todoApi.getTrash()
            .then(res => setTrashCount(res.data.length))
            .catch(err => console.error("Failed to fetch trash count", err));
    }

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
            // Smart filters (overdue / today) use dedicated endpoints
            if (currentFilter === 'overdue') {
                const res = await todoApi.getOverdue();
                setTodos(res.data);
                setTotalItems(res.data.length);
                return;
            }
            if (currentFilter === 'today') {
                const res = await todoApi.getToday();
                setTodos(res.data);
                setTotalItems(res.data.length);
                return;
            }

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
            const matchesFilter = currentFilter !== 'completed' && currentFilter !== 'overdue' && currentFilter !== 'today';

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
            const res = await todoApi.update(id, { is_done: newStatus });
            // Re-sync with server data (includes productivity_score, completed_at)
            setTodos(prev => prev.map(t => t.id === id ? res.data : t));

            // If auto-trashed, the item will have deleted_at set — remove from list
            if (res.data.deleted_at) {
                setTodos(prev => prev.filter(t => t.id !== id));
                setTotalItems(prev => Math.max(0, prev - 1));
                fetchTrashCount();
                fetchTodos();
            } else if (currentFilter !== 'all') {
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
            fetchTrashCount();
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
            const res = await todoApi.update(id, data);
            setTodos(prev => prev.map(t => t.id === id ? res.data : t));
        } catch (err) {
            setTodos(oldTodos);
            alert("Lỗi cập nhật nội dung");
        }
    }

    const handleClearCompleted = async () => {
        if (!confirm("Bạn có chắc muốn xóa tất cả công việc đã hoàn thành?")) return;
        try {
            await todoApi.deleteCompleted();
            fetchTodos();
            setCurrentPage(1);
        } catch (err) {
            alert("Lỗi khi xóa: " + (err.response?.data?.detail || "Không thể thực hiện hành động này"));
        }
    }

    const showPagination = currentFilter !== 'overdue' && currentFilter !== 'today';

    // ── Grid Layout View ──
    return (
        <>
            <div className={`container ${showDashboard ? 'dashboard-view' : ''} app-grid-container`}>

                {/* Header: Title & Theme Toggle */}
                <header className="app-header">
                    <div>
                        <h1>Todo App</h1>
                        <p>Quản lý công việc hiệu quả</p>
                    </div>
                    <ThemeToggle />
                </header>

                {showDashboard ? (
                    <div className="dashboard-wrapper">
                        <Dashboard onBack={() => setShowDashboard(false)} />
                    </div>
                ) : (
                    <div className="main-grid">
                        {/* Left Column: Controls */}
                        <aside className="left-column">
                            <div className="user-controls-section">
                                <div className="user-info">
                                    <span className="user-email">{user?.email}</span>
                                        <button
                                            className="nav-btn dashboard-nav-btn"
                                            onClick={() => setShowDashboard(true)}
                                        >
                                            Thống kê
                                        </button>
                                        <button
                                            className="nav-btn trash-nav-btn"
                                            onClick={() => setIsTrashOpen(true)}
                                        >
                                            Thùng Rác {trashCount > 0 && <span className="badge">{trashCount}</span>}
                                        </button>
                                    <button className="logout-btn-small" onClick={logout} title="Đăng xuất">
                                        <FaSignOutAlt />
                                    </button>

                                </div>

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
                        </aside>

                        {/* Right Column: List & Pagination */}
                        <main className="right-column">
                            <div className="list-header">
                                <h3>Danh sách công việc</h3>
                                <span className="items-count">{totalItems} task</span>
                            </div>

                            <TodoList
                                todos={todos}
                                onToggle={handleToggle}
                                onDelete={handleDelete}
                                onUpdate={handleUpdateContent}
                            />

                            <div className="list-footer">
                                {showPagination && (
                                    <PaginationBar
                                        currentPage={currentPage}
                                        totalItems={totalItems}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={setCurrentPage}
                                    />
                                )}

                                {todos.some(t => t.is_done) && (
                                    <button id="clear-completed" onClick={handleClearCompleted}>
                                        Xóa đã xong
                                    </button>
                                )}
                            </div>
                        </main>
                    </div>
                )}


            </div>
            <TrashManager
                isOpen={isTrashOpen}
                onClose={() => setIsTrashOpen(false)}
                onRestore={() => { fetchTodos(); fetchTrashCount(); }}
                onDeleteForever={() => { fetchTrashCount(); }}
            />
        </>
    )
}

// ────────────────────────────────────────────
// Auth Page (Login / Register)
// ────────────────────────────────────────────
function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="auth-container">
            <div className="auth-header-row">
                <ThemeToggle />
            </div>
            <div className="auth-header">
                <h1 style={{ textAlign: 'center' }}>Todo App</h1>
                <p style={{ textAlign: 'center', marginBottom: '10px' }}>Quản lý công việc hiệu quả</p>
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
