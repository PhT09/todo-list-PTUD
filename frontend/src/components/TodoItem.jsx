import React, { useState } from 'react';
import { FaCheck, FaTrash, FaPen, FaTimes, FaUndo, FaClock } from 'react-icons/fa';

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const TodoItem = ({ todo, onToggle, onDelete, onUpdate, availableTags = [] }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(todo.title);
    const [editDesc, setEditDesc] = useState(todo.description || '');
    const [editDueDate, setEditDueDate] = useState(
        todo.due_date ? new Date(todo.due_date).toISOString().slice(0, 16) : ''
    );
    const [editTagIds, setEditTagIds] = useState(
        todo.tags ? todo.tags.map(t => t.id) : []
    );

    const startEditing = (e) => {
        e.stopPropagation();
        setEditTitle(todo.title);
        setEditDesc(todo.description || '');
        setEditDueDate(todo.due_date ? new Date(todo.due_date).toISOString().slice(0, 16) : '');
        setEditTagIds(todo.tags ? todo.tags.map(t => t.id) : []);
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
            tag_ids: editTagIds,
        });
        setIsEditing(false);
    };

    const handleToggle = (e) => {
        if (e.target.closest('button')) return;
        onToggle(todo.id, !todo.is_done);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (window.confirm('Bạn có chắc chắn muốn xóa?')) {
            onDelete(todo.id);
        }
    };

    const toggleEditTag = (tagId) => {
        setEditTagIds((prev) =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    return (
        <li className={`todo-item ${todo.is_done ? 'completed' : ''} ${todo.is_overdue ? 'overdue' : ''} ${isEditing ? 'edit-mode' : ''}`}>
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
                            {availableTags.length > 0 && (
                                <div className="tag-selector compact">
                                    {availableTags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            className={`tag-select-pill ${editTagIds.includes(tag.id) ? 'selected' : ''}`}
                                            style={{
                                                background: editTagIds.includes(tag.id) ? tag.color : tag.color + '15',
                                                color: editTagIds.includes(tag.id) ? '#fff' : tag.color,
                                                borderColor: tag.color,
                                            }}
                                            onClick={() => toggleEditTag(tag.id)}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            )}
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

                        {/* Tags display */}
                        {todo.tags && todo.tags.length > 0 && (
                            <div className="todo-tags">
                                {todo.tags.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="tag-pill-sm"
                                        style={{ background: tag.color + '20', color: tag.color }}
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}

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
