import { useState, useRef, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { Calendar } from 'primereact/calendar';
import { PRIORITY_OPTIONS } from '../api/todoApi';

const TodoInput = ({ onAdd, isAdding }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('Normal');
    const [isExpanded, setIsExpanded] = useState(false);
    const calendarRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                // Đảm bảo không thu gọn khi click vào popup calendar của PrimeReact (nếu nó append vào ngoài root)
                const isOverlay = event.target.closest('.p-datepicker');
                if (!isOverlay) {
                    setIsExpanded(false);
                    // Clear the form like when submitting
                    setTitle('');
                    setDescription('');
                    setDueDate(null);
                    setPriority('Normal');
                }
            }
        };

        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExpanded]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimTitle = title.trim();
        if (!isExpanded || trimTitle.length < 3 || trimTitle.length > 100) return;

        const formatDate = (date) => {
            const d = new Date(date);
            let month = '' + (d.getMonth() + 1);
            let day = '' + d.getDate();
            const year = d.getFullYear();

            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;

            return [year, month, day].join('-');
        };

        const data = {
            title: trimTitle,
            description: description.trim() || null,
            due_date: dueDate ? formatDate(dueDate) : null,
            priority: priority,
        };

        onAdd(data);

        // Reset Form
        setTitle('');
        setDescription('');
        setDueDate(null);
        setPriority('Normal');
        setIsExpanded(false);
    };

    const isAddDisabled = !isExpanded || title.trim().length < 3 || title.trim().length > 100 || isAdding;

    return (
        <div className="input-container" ref={containerRef}>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Tiêu đề công việc... (3 đến 100 kí tự)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onFocus={() => setIsExpanded(true)}
                        disabled={isAdding}
                    />

                    <button
                        type="submit"
                        id="add-btn"
                        title="Thêm công việc"
                        disabled={isAddDisabled}
                    >
                        <FaPlus />
                    </button>
                </div>

                {isExpanded && (
                    <div className="expanded-ui" style={{ marginTop: '10px', animation: 'fadeIn 0.3s ease-in-out' }}>
                        <textarea
                            id="todo-desc-input"
                            placeholder="Mô tả chi tiết (tùy chọn)..."
                            rows="2"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isAdding}
                        ></textarea>

                        {/* Priority Pill Selector */}
                        <div className="priority-selector">
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

                        {/* Date Picker */}
                        <div style={{ width: '100%' }}>
                            <Calendar
                                ref={calendarRef}
                                value={dueDate}
                                onChange={(e) => {
                                    setDueDate(e.value);
                                }}
                                minDate={new Date()}
                                showTime={false}
                                dateFormat="yy-mm-dd"
                                placeholder="YYYY-MM-DD"
                                showClear
                            />
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};
export default TodoInput;