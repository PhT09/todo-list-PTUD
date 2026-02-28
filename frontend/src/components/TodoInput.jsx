import { useState, useRef, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { PRIORITY_OPTIONS } from '../api/todoApi';

const TodoInput = ({ onAdd, isAdding }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState(null);
    const [priority, setPriority] = useState('Normal');
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                const isOverlay = event.target.closest('.p-datepicker');
                if (!isOverlay) {
                    setIsExpanded(false);
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
        setTitle('');
        setDescription('');
        setDueDate(null);
        setPriority('Normal');
        setIsExpanded(false);
    };

    const isAddDisabled = !isExpanded || title.trim().length < 3 || title.trim().length > 100 || isAdding;

    return (
        <div ref={containerRef} className="card-bg p-3 rounded-xl">
            <form onSubmit={handleSubmit}>
                <div className="flex gap-2">
                    <InputText
                        placeholder="Tiêu đề công việc... (3 đến 100 kí tự)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onFocus={() => setIsExpanded(true)}
                        disabled={isAdding}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        icon="pi pi-plus"
                        disabled={isAddDisabled}
                        className={`shrink-0 ${!isAddDisabled ? 'bg-blue-600 border-blue-600' : ''}`}
                        style={{ borderRadius: '10px' }}
                    />
                </div>

                {isExpanded && (
                    <div className="animate-fade-in flex flex-col gap-2 mt-2">
                        <InputTextarea
                            placeholder="Mô tả chi tiết (tùy chọn)..."
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isAdding}
                            className="w-full"
                            autoResize
                        />

                        {/* Priority Pills using PrimeReact Buttons */}
                        <div className="flex gap-1.5 flex-wrap py-1 justify-around">
                            {PRIORITY_OPTIONS.map((opt) => (
                                <Button
                                    key={opt.value}
                                    type="button"
                                    label={opt.label}
                                    size="small"
                                    rounded
                                    onClick={() => setPriority(opt.value)}
                                    className="text-xs"
                                    style={{
                                        background: priority === opt.value ? opt.color : opt.color + '15',
                                        color: priority === opt.value ? '#fff' : opt.color,
                                        borderColor: opt.color,
                                        borderWidth: '1.5px',
                                        padding: '0.25rem 0.75rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Date Picker */}
                        <div className="w-full">
                            <Calendar
                                value={dueDate}
                                onChange={(e) => setDueDate(e.value)}
                                minDate={new Date()}
                                dateFormat="yy-mm-dd"
                                placeholder="Chọn ngày hết hạn (tùy chọn)"
                                showIcon
                                className="w-full"
                            />
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default TodoInput;