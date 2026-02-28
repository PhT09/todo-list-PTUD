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
import TrashManager from './components/TrashManager'
import { todoApi } from './api/todoApi'
import { Button } from 'primereact/button'
import { Badge } from 'primereact/badge'
import { ProgressSpinner } from 'primereact/progressspinner'

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
            .catch(() => { });
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
            setTodos(prev => prev.map(t => t.id === id ? res.data : t));

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

    return (
        <>
            <div className={`glass-bg rounded-2xl shadow-glass p-4 w-[95%] max-w-[1200px] mx-auto my-1 transition-all duration-300 ${showDashboard ? 'max-w-[1400px]' : ''}`}>

                {/* Header */}
                <header className="relative text-center mb-2 pb-2 border-b border-[var(--color-glass-border)]">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            Todo App
                        </h1>
                        <p className="text-light text-sm">Quản lý công việc hiệu quả</p>
                    </div>
                    <ThemeToggle />
                </header>

                {showDashboard ? (
                    <div>
                        <Dashboard onBack={() => setShowDashboard(false)} />
                    </div>
                ) : (
                    <div className="grid grid-cols-[minmax(0,1fr)_700px] gap-4 items-start main-grid-layout">
                        {/* Left Column */}
                        <aside className="flex flex-col gap-2.5">
                            <div className="p-1">
                                <div className="flex justify-between items-center font-semibold text-[0.95rem] gap-2.5">
                                    <span className="text-main text-sm truncate">{user?.email}</span>
                                    <Button
                                        label="Thống kê"
                                        onClick={() => setShowDashboard(true)}
                                        severity="secondary"
                                        outlined
                                        size="small"
                                    />
                                    <Button
                                        label="Thùng Rác"
                                        onClick={() => setIsTrashOpen(true)}
                                        severity="secondary"
                                        outlined
                                        size="small"
                                        badge={trashCount > 0 ? String(trashCount) : null}
                                        badgeSeverity="danger"
                                        className="flex items-center gap-1"
                                    />
                                    <Button
                                        icon="pi pi-sign-out"
                                        onClick={logout}
                                        severity="danger"
                                        text
                                        rounded
                                    />
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

                        {/* Right Column */}
                        <main className="flex flex-col gap-2 h-[600px] py-3 px-6 max-sm:px-3 card-bg rounded-2xl ">
                            <div className="flex justify-between items-center pb-2 border-b border-[var(--color-glass-border)] mb-0.5">
                                <h3 className="text-lg text-main font-semibold">Danh sách công việc</h3>
                                <Badge value={`${totalItems} task`} severity="info" />
                            </div>

                            <TodoList
                                todos={todos}
                                onToggle={handleToggle}
                                onDelete={handleDelete}
                                onUpdate={handleUpdateContent}
                            />

                            <div className="flex justify-between items-center border-t border-[var(--color-glass-border)] mt-auto">
                                {showPagination && (
                                    <PaginationBar
                                        currentPage={currentPage}
                                        totalItems={totalItems}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={setCurrentPage}
                                    />
                                )}

                                {todos.some(t => t.is_done) && (
                                    <Button
                                        label="Xóa đã xong"
                                        onClick={handleClearCompleted}
                                        severity="danger"
                                        text
                                        size="small"
                                    />
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
        <div className="pt-16 px-4 flex flex-col items-center">
            <div className="absolute top-5 right-5">
                <ThemeToggle />
            </div>
            <div className="text-center mb-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                    Todo App
                </h1>
                <p className="text-light text-sm mt-1">Quản lý công việc hiệu quả</p>
            </div>
            {isLogin
                ? <LoginForm onSwitch={() => setIsLogin(false)} />
                : <RegisterForm onSwitch={() => setIsLogin(true)} />
            }
        </div>
    );
}

// ────────────────────────────────────────────
// Root App
// ────────────────────────────────────────────
function AppContent() {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3">
                <ProgressSpinner style={{ width: '40px', height: '40px' }} />
                <p className="text-light">Đang tải...</p>
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
