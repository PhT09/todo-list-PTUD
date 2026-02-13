
import TodoItem from './TodoItem';

const TodoList = ({ todos, onToggle, onDelete, onUpdate, availableTags = [] }) => {
    if (todos.length === 0) {
        return (
            <ul className="todo-list">
                <li style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                    Không có công việc nào
                </li>
            </ul>
        );
    }

    return (
        <ul className="todo-list">
            {todos.map((todo) => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    availableTags={availableTags}
                />
            ))}
        </ul>
    );
};

export default TodoList;
