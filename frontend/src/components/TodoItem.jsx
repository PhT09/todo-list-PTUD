import React, { useState } from 'react';
import { FaCheck, FaTrash, FaPen, FaTimes, FaUndo, FaClock, FaStar } from 'react-icons/fa';
import { PRIORITY_OPTIONS, getPriorityColor } from '../api/todoApi';

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const TodoItem = ({ todo, onToggle, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(todo.title);
    const [editDesc, setEditDesc] = useState(todo.description || '');
    const [editDueDate, setEditDueDate] = useState(
        todo.due_date ? new Date(todo.due_date).toISOString().slice(0, 16) : ''
    );
    const [editPriority, setEditPriority] = useState(todo.priority || 'Normal');

    const startEditing = (e) => {
        e.stopPropagation();
        setEditTitle(todo.title);
        setEditDesc(todo.description || '');
        setEditDueDate(todo.due_date ? new Date(todo.due_date).toISOString().slice(0, 16) : '');
        setEditPriority(todo.priority || 'Normal');
        setIsEditing(true);
    };

    const cancelEdit = (e) => {
        e.stopPropagation();
        setIsEditing(false);
    };

    const handleSave = (e) => {
        e.stopPropagation();
        if (!editTitle.trim()) {
            alert("Tiêu đề không được để trống!");
            return;
        }
        onUpdate(todo.id, {
            title: editTitle.trim(),
            description: editDesc.trim() || null,
            due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
            priority: editPriority,
        });
        setIsEditing(false);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(todo.id);
    };

    const priorityColor = getPriorityColor(todo.priority);

    return (
        <li className={`todo-item ${todo.is_done ? 'completed' : ''} ${todo.is_overdue ? 'overdue' : ''} ${isEditing ? 'edit-mode' : ''}`}
            style={{ borderLeft: `3px solid ${priorityColor}` }}
        >
            {isEditing ? (
                <>
                    <div className="edit-form">
                        <input
                            type="text"
                            className="edit-input-title"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSave(e)}
                        />
                        <textarea
                            className="edit-input-desc"
                            rows="2"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                        />
                        <div className="edit-extras">
                            <input
                                type="datetime-local"
                                className="date-input"
                                value={editDueDate}
                                onChange={(e) => setEditDueDate(e.target.value)}
                                min={new Date(todo.created_at).toISOString().slice(0, 16)}
                            />
                            <div className="priority-pills compact">
                                {PRIORITY_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        className={`priority-pill ${editPriority === opt.value ? 'active' : ''}`}
                                        style={{
                                            background: editPriority === opt.value ? opt.color : opt.color + '15',
                                            color: editPriority === opt.value ? '#fff' : opt.color,
                                            borderColor: opt.color,
                                        }}
                                        onClick={() => setEditPriority(opt.value)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="actions">
                        <button className="action-btn save-btn" onClick={handleSave} title="Lưu">
                            <FaCheck />
                        </button>
                        <button className="action-btn cancel-btn" onClick={cancelEdit} title="Hủy">
                            <FaTimes />
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="todo-content" onClick={() => onToggle(todo.id, !todo.is_done)}>
                        <div className="todo-title-row">
                            <div className="todo-title">{todo.title}</div>
                            {todo.is_overdue && (
                                <span className="overdue-badge">
                                    <FaClock size={10} /> Trễ hạn
                                </span>
                            )}
                        </div>
                        {todo.description && <div className="todo-desc">{todo.description}</div>}

                        {/* Priority badge + Score display */}
                        <div className="todo-meta-row">
                            <span
                                className="priority-badge"
                                style={{
                                    background: priorityColor + '20',
                                    color: priorityColor,
                                    borderColor: priorityColor,
                                }}
                            >
                                {todo.priority || 'Normal'}
                            </span>
                            {todo.productivity_score !== null && todo.productivity_score !== undefined && (
                                <span className="score-badge">
                                    <FaStar size={10} /> {todo.productivity_score.toFixed(1)}
                                </span>
                            )}
                        </div>

                        {/* Due date display */}
                        {todo.due_date && (
                            <div className={`todo-due ${todo.is_overdue ? 'due-overdue' : ''}`}>
                                <FaClock size={10} /> {formatDate(todo.due_date)}
                            </div>
                        )}
                    </div>
                    <div className="actions">
                        <button
                            className="action-btn check-btn"
                            onClick={(e) => { e.stopPropagation(); onToggle(todo.id, !todo.is_done); }}
                            title={todo.is_done ? "Làm lại" : "Hoàn thành"}
                        >
                            {todo.is_done ? <FaUndo /> : <FaCheck />}
                        </button>
                        <button className="action-btn edit-btn" onClick={startEditing} title="Sửa">
                            <FaPen size={12} />
                        </button>
                        <button className="action-btn delete-btn" onClick={handleDelete} title="Xóa">
                            <FaTrash size={12} />
                        </button>
                    </div>
                </>
            )}
        </li>
    );
};

export default TodoItem;
