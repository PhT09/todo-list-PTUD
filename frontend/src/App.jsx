
import { useState, useEffect, useContext } from 'react'
import Header from './components/Header'
import TodoInput from './components/TodoInput'
import FilterSortBar from './components/FilterSortBar'
import TodoList from './components/TodoList'
import PaginationBar from './components/PaginationBar'
import { todoApi } from './api/todoApi'
import './index.css'
import { AuthContext, AuthProvider } from './context/AuthContext'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'

function TodoApp() {
    const { user, token, logout } = useContext(AuthContext);

    const [todos, setTodos] = useState([])
    const [totalItems, setTotalItems] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    const [searchTerm, setSearchTerm] = useState('')
    const [currentFilter, setCurrentFilter] = useState('all') // 'all', 'active', 'completed'
    const [sortOrder, setSortOrder] = useState('desc') // 'desc', 'asc'

    // Debounce Search
    const [debouncedSearch, setDebouncedSearch] = useState('')
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // Reset page on search
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    // Data Fetching
    const fetchTodos = async () => {
        try {
            const offset = (currentPage - 1) * itemsPerPage
            const isDesc = sortOrder === 'desc'

            // Determine is_done filter
            let is_done = undefined
            if (currentFilter === 'active') is_done = false
            if (currentFilter === 'completed') is_done = true

            // API Call is proxied to backend
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
                logout(); // Token expired
            }
            console.error("Failed to fetch todos:", err)
        }
    }

    // Trigger fetch on dependency change
    useEffect(() => {
        if (token) fetchTodos()
    }, [currentPage, debouncedSearch, currentFilter, sortOrder, token])

    // --- Handlers ---

    const handleAdd = async (newTodoData) => {
        try {
            const res = await todoApi.create({ ...newTodoData, is_done: false })
            const newTodo = res.data;

            // Intelligent UI Update (Simulate Optimistic)
            const isFirstPage = currentPage === 1;
            const isDesc = sortOrder === 'desc';
            const matchesFilter = currentFilter !== 'completed';

            if (isFirstPage && isDesc && matchesFilter) {
                setTodos(prev => [newTodo, ...prev].slice(0, itemsPerPage));
                setTotalItems(prev => prev + 1);
            } else {
                // Refresh to sync pagination properly
                fetchTodos();
            }
        } catch (err) {
            alert("Lỗi khi thêm công việc: " + (err.response?.data?.detail || err.message));
        }
    }

    const handleToggle = async (id, newStatus) => {
        // 1. Optimistic Update
        const oldTodos = [...todos];
        setTodos(prev => prev.map(t => t.id === id ? { ...t, is_done: newStatus } : t));

        try {
            // 2. API Call
            await todoApi.update(id, { is_done: newStatus });

            // 3. Post-Sync (Check Filters)
            if (currentFilter !== 'all') {
                // If filtered, item might need to disappear. 
                // Re-fetch is safest for pagination accuracy.
                fetchTodos();
            }
        } catch (err) {
            // 4. Rollback on Error
            setTodos(oldTodos);
            alert("Lỗi cập nhật trạng thái");
        }
    }

    const handleDelete = async (id) => {
        // 1. Optimistic
        const oldTodos = [...todos];
        setTodos(prev => prev.filter(t => t.id !== id));
        setTotalItems(prev => Math.max(0, prev - 1));

        try {
            // 2. API Call
            await todoApi.delete(id);

            // 3. Post-Sync Pagination
            if (todos.length <= 1 && currentPage > 1) {
                // Page became empty -> Go back
                setCurrentPage(prev => prev - 1);
            } else if (todos.length <= itemsPerPage) {
                // Slot opened up -> Fetch to fill it?
                fetchTodos();
            }
        } catch (err) {
            // 4. Rollback
            setTodos(oldTodos);
            setTotalItems(prev => prev + 1);
            alert("Lỗi xóa công việc");
        }
    }

    const handleUpdateContent = async (id, data) => {
        // 1. Optimistic
        const oldTodos = [...todos];
        setTodos(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));

        try {
            // 2. API Call
            await todoApi.update(id, data);
        } catch (err) {
            // 3. Rollback
            setTodos(oldTodos);
            alert("Lỗi cập nhật nội dung");
        }
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <Header />
                <button
                    onClick={logout}
                    style={{
                        background: '#f87171',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Đăng xuất
                </button>
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
                <button id="clear-completed" onClick={() => alert("Tính năng xóa hàng loạt cần Backend hỗ trợ")}>
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

function Main() {
    const { token } = useContext(AuthContext);
    const [isRegister, setIsRegister] = useState(false);

    if (token) return <TodoApp />;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            {isRegister
                ? <RegisterForm onSwitch={() => setIsRegister(false)} />
                : <LoginForm onSwitch={() => setIsRegister(true)} />
            }
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Main />
        </AuthProvider>
    );
}
