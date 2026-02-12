
import React, { useState } from 'react';
import { FaCheck, FaTrash, FaPen, FaTimes, FaUndo } from 'react-icons/fa';

const TodoItem = ({ todo, onToggle, onDelete, onUpdate }) => {
    // Local edit state
    const [isEditing, setIsEditing] = useState(false);

    // Temporary state for inputs
    const [editTitle, setEditTitle] = useState(todo.title);
    const [editDesc, setEditDesc] = useState(todo.description || '');

    // Initialize edit mode with current values
    const startEditing = (e) => {
        e.stopPropagation(); // Prevent toggle
        setEditTitle(todo.title);
        setEditDesc(todo.description || '');
        setIsEditing(true);
    };

    const cancelEdit = (e) => {
        e.stopPropagation();
        setIsEditing(false);
    };

    // Submit Update
    const handleSave = (e) => {
        e.stopPropagation();
        if (!editTitle.trim()) {
            alert("Tiêu đề không được để trống!");
            return;
        }

        // Call parent handler
        onUpdate(todo.id, {
            title: editTitle.trim(),
            description: editDesc.trim(),
        });
        setIsEditing(false);
    };

    // Toggle handler wrapper
    const handleToggle = (e) => {
        // Don't toggle if clicking buttons
        if (e.target.closest('button')) return;
        onToggle(todo.id, !todo.is_done);
    }

    const handleDelete = (e) => {
        e.stopPropagation();
        if (window.confirm('Bạn có chắc chắn muốn xóa?')) {
            onDelete(todo.id);
        }
    }

    // UI Render Logic
    return (
        <li className={`todo-item ${todo.is_done ? 'completed' : ''} ${isEditing ? 'edit-mode' : ''}`}>
            {isEditing ? (
                // Edit Mode
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
                // View Mode
                <>
                    <div className="todo-content" onClick={() => onToggle(todo.id, !todo.is_done)}>
                        <div className="todo-title">{todo.title}</div>
                        {todo.description && <div className="todo-desc">{todo.description}</div>}
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
