import TodoItem from './TodoItem';
import { Message } from 'primereact/message';

const TodoList = ({ todos, onToggle, onDelete, onUpdate }) => {
    if (todos.length === 0) {
        return (
            <div className="flex flex-1 min-h-0 items-center justify-center overflow-y-auto pr-1.5 scrollbar-thin">
                <Message
                    severity="info"
                    text="Không có công việc nào"
                    className="w-full justify-center"
                />
            </div>
        );
    }

    return (
        <ul className="flex-1 min-h-0 overflow-y-auto pr-1.5 list-none scrollbar-thin">
            {todos.map((todo) => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                />
            ))}
        </ul>
    );
};

export default TodoList;

