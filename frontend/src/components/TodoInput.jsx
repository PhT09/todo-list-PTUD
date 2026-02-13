import { useState } from 'react';
import { FaPlus, FaCalendarAlt, FaTags } from 'react-icons/fa';

const TodoInput = ({ onAdd, isAdding, availableTags = [] }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [showExtras, setShowExtras] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        const data = {
            title: title.trim(),
            description: description.trim() || null,
            due_date: dueDate ? new Date(dueDate).toISOString() : null,
            tag_ids: selectedTagIds.length > 0 ? selectedTagIds : null,
        };

        onAdd(data);

        // Reset Form
        setTitle('');
        setDescription('');
        setDueDate('');
        setSelectedTagIds([]);
        setShowExtras(false);
    };

    const toggleTag = (tagId) => {
        setSelectedTagIds((prev) =>
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        );
    };

    return (
        <div className="input-container">
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Tiêu đề công việc..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isAdding}
                        autoFocus
                    />
                    <button
                        type="button"
                        className="extras-toggle-btn"
                        onClick={() => setShowExtras(!showExtras)}
                        title="Thêm deadline & tags"
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

                        {/* Tag Selector */}
                        {availableTags.length > 0 && (
                            <div className="input-tag-row">
                                <FaTags size={12} className="input-icon" />
                                <div className="tag-selector">
                                    {availableTags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            className={`tag-select-pill ${selectedTagIds.includes(tag.id) ? 'selected' : ''}`}
                                            style={{
                                                '--tag-color': tag.color,
                                                background: selectedTagIds.includes(tag.id) ? tag.color : tag.color + '15',
                                                color: selectedTagIds.includes(tag.id) ? '#fff' : tag.color,
                                                borderColor: tag.color,
                                            }}
                                            onClick={() => toggleTag(tag.id)}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};
export default TodoInput;
