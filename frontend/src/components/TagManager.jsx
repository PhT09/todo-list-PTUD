import { useState, useEffect } from 'react';
import { todoApi } from '../api/todoApi';
import { FaTimes, FaPlus } from 'react-icons/fa';

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#6366f1', '#a855f7',
    '#ec4899', '#64748b',
];

const TagManager = ({ tags, onTagsChange }) => {
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#6366f1');
    const [showForm, setShowForm] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newTagName.trim()) return;
        try {
            const res = await todoApi.createTag({ name: newTagName.trim(), color: newTagColor });
            onTagsChange([...tags, res.data]);
            setNewTagName('');
            setShowForm(false);
        } catch (err) {
            alert('Lỗi tạo tag: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleDelete = async (tagId) => {
        try {
            await todoApi.deleteTag(tagId);
            onTagsChange(tags.filter(t => t.id !== tagId));
        } catch (err) {
            alert('Lỗi xóa tag');
        }
    };

    return (
        <div className="tag-manager">
            <div className="tag-manager-header">
                <span className="tag-manager-title">🏷️ Tags</span>
                <button
                    className="tag-add-btn"
                    onClick={() => setShowForm(!showForm)}
                    title="Thêm tag mới"
                >
                    <FaPlus size={10} />
                </button>
            </div>

            {showForm && (
                <form className="tag-create-form" onSubmit={handleCreate}>
                    <input
                        type="text"
                        placeholder="Tên tag..."
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="tag-name-input"
                        maxLength={50}
                        autoFocus
                    />
                    <div className="color-picker-row">
                        {PRESET_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={`color-dot ${newTagColor === c ? 'active' : ''}`}
                                style={{ background: c }}
                                onClick={() => setNewTagColor(c)}
                            />
                        ))}
                    </div>
                    <button type="submit" className="tag-create-submit">Tạo</button>
                </form>
            )}

            <div className="tag-list-manager">
                {tags.map((tag) => (
                    <span key={tag.id} className="tag-pill" style={{ background: tag.color + '20', color: tag.color, borderColor: tag.color }}>
                        {tag.name}
                        <button className="tag-remove-btn" onClick={() => handleDelete(tag.id)}>
                            <FaTimes size={8} />
                        </button>
                    </span>
                ))}
                {tags.length === 0 && <span className="tag-empty">Chưa có tag nào</span>}
            </div>
        </div>
    );
};

export default TagManager;
