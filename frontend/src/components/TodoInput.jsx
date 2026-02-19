import { useState } from 'react';
import { FaPlus, FaCalendarAlt } from 'react-icons/fa';
import { PRIORITY_OPTIONS } from '../api/todoApi';

const TodoInput = ({ onAdd, isAdding }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('Normal');
    const [showExtras, setShowExtras] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        const data = {
            title: title.trim(),
            description: description.trim() || null,
            due_date: dueDate ? new Date(dueDate).toISOString() : null,
            priority: priority,
        };

        onAdd(data);

        // Reset Form
        setTitle('');
        setDescription('');
        setDueDate('');
        setPriority('Normal');
        setShowExtras(false);
    };

    return (
        <div className="input-container">
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Tiêu đề công việc... (3 đến 100 kí tự)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isAdding}
                        autoFocus
                    />
                    <button
                        type="button"
                        className="extras-toggle-btn"
                        onClick={() => setShowExtras(!showExtras)}
                        title="Thêm deadline & ưu tiên"
                    >
                        <FaCalendarAlt size={14} />
                    </button>
                    <button type="submit" id="add-btn" title="Thêm công việc" disabled={!title.trim() || isAdding}>
                        <FaPlus />
                    </button>
                </div>
                <textarea
                    id="todo-desc-input"
                    placeholder="Mô tả chi tiết (tùy chọn)..."
                    rows="2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isAdding}
                ></textarea>

                {/* Priority Pill Selector — always visible */}
                <div className="priority-selector">
                    <span className="priority-label">Ưu tiên:</span>
                    <div className="priority-pills">
                        {PRIORITY_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`priority-pill ${priority === opt.value ? 'active' : ''}`}
                                style={{
                                    '--pill-color': opt.color,
                                    background: priority === opt.value ? opt.color : opt.color + '15',
                                    color: priority === opt.value ? '#fff' : opt.color,
                                    borderColor: opt.color,
                                }}
                                onClick={() => setPriority(opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {showExtras && (
                    <div className="input-extras">
                        {/* Date Picker */}
                        <div className="input-date-row">
                            <FaCalendarAlt size={12} className="input-icon" />
                            <input
                                type="datetime-local"
                                className="date-input"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                            />
                            {dueDate && (
                                <button type="button" className="clear-date-btn" onClick={() => setDueDate('')}>
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};
export default TodoInput;
