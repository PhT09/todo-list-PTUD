import { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { PRIORITY_OPTIONS, getPriorityColor, getPriorityLabel } from '../api/todoApi';

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const TodoItem = ({ todo, onToggle, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(todo.title);
    const [editDesc, setEditDesc] = useState(todo.description || '');
    const [editDueDate, setEditDueDate] = useState(
        todo.due_date ? new Date(todo.due_date) : null
    );
    const [editPriority, setEditPriority] = useState(todo.priority || 'Normal');

    const startEditing = (e) => {
        e.stopPropagation();
        setEditTitle(todo.title);
        setEditDesc(todo.description || '');
        setEditDueDate(todo.due_date ? new Date(todo.due_date) : null);
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
            alert('Tiêu đề không được để trống!');
            return;
        }
        const formatDateObj = (d) => {
            if (!d) return null;
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        onUpdate(todo.id, {
            title: editTitle.trim(),
            description: editDesc.trim() || null,
            due_date: formatDateObj(editDueDate),
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
        <li
            className={`input-bg rounded-xl px-3.5 py-2.5 mb-2 flex justify-between items-center transition-all duration-300 text-main hover:bg-[var(--color-card-hover)] hover:translate-x-0.5 hover:shadow-md ${todo.is_done ? 'opacity-60 bg-slate-100/10' : ''
                }`}
            style={{ borderLeft: `3px solid ${priorityColor}` }}
        >
            {isEditing ? (
                <>
                    <div className="flex-1 flex flex-col gap-2 mr-3">
                        <InputText
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSave(e)}
                            className="w-full"
                        />
                        <InputTextarea
                            rows={2}
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full"
                            autoResize
                        />
                        <div className="flex flex-wrap items-center gap-2">
                            <Calendar
                                value={editDueDate}
                                onChange={(e) => setEditDueDate(e.value)}
                                minDate={new Date()}
                                dateFormat="yy-mm-dd"
                                placeholder="Deadline"
                                showIcon
                                className="flex-1"
                            />
                            <div className="flex gap-1 flex-wrap">
                                {PRIORITY_OPTIONS.map((opt) => (
                                    <Button
                                        key={opt.value}
                                        type="button"
                                        label={opt.label}
                                        size="small"
                                        rounded
                                        onClick={() => setEditPriority(opt.value)}
                                        style={{
                                            background: editPriority === opt.value ? opt.color : opt.color + '15',
                                            color: editPriority === opt.value ? '#fff' : opt.color,
                                            borderColor: opt.color,
                                            borderWidth: '1.5px',
                                            padding: '0.15rem 0.6rem',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        <Button
                            icon="pi pi-check"
                            rounded
                            text
                            severity="success"
                            onClick={handleSave}
                        />
                        <Button
                            icon="pi pi-times"
                            rounded
                            text
                            severity="secondary"
                            onClick={cancelEdit}
                        />
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                        <Checkbox
                            checked={todo.is_done}
                            onChange={() => onToggle(todo.id, !todo.is_done)}
                            style={{ width: '1.2rem', height: '1.2rem' }}
                        />
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onToggle(todo.id, !todo.is_done)}>
                            <div className="flex items-center gap-2">
                                <div className={`font-medium mb-0.5 break-words ${todo.is_done ? 'line-through' : ''}`}>
                                    {todo.title}
                                </div>
                                {todo.is_overdue && (
                                    <Tag
                                        value="Trễ hạn"
                                        severity="danger"
                                        icon="pi pi-clock"
                                        style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                    />
                                )}
                            </div>
                            {todo.description && (
                                <div className="text-sm text-light overflow-hidden text-ellipsis line-clamp-2">
                                    {todo.description}
                                </div>
                            )}
                            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                <Tag
                                    value={getPriorityLabel(todo.priority)}
                                    style={{
                                        background: priorityColor + '20',
                                        color: priorityColor,
                                        border: `1px solid ${priorityColor}`,
                                        fontSize: '0.7rem',
                                        padding: '0.1rem 0.5rem',
                                    }}
                                />
                                {todo.productivity_score !== null && todo.productivity_score !== undefined && (
                                    <Tag
                                        value={todo.productivity_score.toFixed(1)}
                                        icon="pi pi-star"
                                        style={{
                                            background: '#fef3c7',
                                            color: '#f59e0b',
                                            fontSize: '0.7rem',
                                            padding: '0.1rem 0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.2rem',
                                        }}
                                    />
                                )}
                            </div>
                            {todo.due_date && (
                                <div className={`text-xs mt-1 flex items-center gap-1 ${todo.is_overdue ? 'text-red-500' : 'text-light'}`}>
                                    <i className="pi pi-clock text-[0.65rem]"></i> {formatDate(todo.due_date)}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            icon={todo.is_done ? 'pi pi-undo' : 'pi pi-check'}
                            rounded
                            text
                            severity="success"
                            onClick={(e) => { e.stopPropagation(); onToggle(todo.id, !todo.is_done); }}
                        />
                        <Button
                            icon="pi pi-pencil"
                            rounded
                            text
                            severity="info"
                            onClick={startEditing}
                        />
                        <Button
                            icon="pi pi-trash"
                            rounded
                            text
                            severity="danger"
                            onClick={handleDelete}
                        />
                    </div>
                </>
            )}
        </li>
    );
};

export default TodoItem;
