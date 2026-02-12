
import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';

const TodoInput = ({ onAdd, isAdding }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        // Pass data to parent logic
        onAdd({
            title: title.trim(),
            description: description.trim(),
        });

        // Reset Form
        setTitle('');
        setDescription('');
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
            </form>
        </div>
    );
};
export default TodoInput;
