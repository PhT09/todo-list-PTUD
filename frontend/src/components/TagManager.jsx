import { useState } from 'react';
import { todoApi } from '../api/todoApi';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#6366f1', '#a855f7',
    '#ec4899', '#64748b',
];

const TagManager = ({ tags, onTagsChange }) => {
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3b82f6');
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
        <div className="card-bg p-3 rounded-xl border border-[var(--color-glass-border)]">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-main flex items-center gap-1.5">
                    <i className="pi pi-tag text-[var(--color-primary)]"></i> Tags
                </span>
                <Button
                    icon={showForm ? 'pi pi-times' : 'pi pi-plus'}
                    rounded
                    text
                    size="small"
                    onClick={() => setShowForm(!showForm)}
                    tooltip="Thêm tag mới"
                    tooltipOptions={{ position: 'top' }}
                />
            </div>

            {showForm && (
                <form className="flex flex-col gap-2 mb-3 animate-fade-in" onSubmit={handleCreate}>
                    <InputText
                        placeholder="Tên tag..."
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        maxLength={50}
                        autoFocus
                        className="w-full"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                        {PRESET_COLORS.map((c) => (
                            <Button
                                key={c}
                                type="button"
                                rounded
                                onClick={() => setNewTagColor(c)}
                                style={{
                                    background: c,
                                    width: '1.5rem',
                                    height: '1.5rem',
                                    minWidth: '1.5rem',
                                    padding: 0,
                                    border: newTagColor === c ? '2.5px solid var(--color-text-main)' : '2px solid transparent',
                                    boxShadow: newTagColor === c ? `0 0 0 1px ${c}` : 'none',
                                }}
                            />
                        ))}
                    </div>
                    <Button
                        type="submit"
                        label="Tạo"
                        icon="pi pi-check"
                        size="small"
                        className="w-full"
                    />
                </form>
            )}

            <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                    <Chip
                        key={tag.id}
                        label={tag.name}
                        removable
                        onRemove={() => handleDelete(tag.id)}
                        style={{
                            background: tag.color + '20',
                            color: tag.color,
                            border: `1px solid ${tag.color}`,
                        }}
                    />
                ))}
                {tags.length === 0 && <span className="text-xs text-light">Chưa có tag nào</span>}
            </div>
        </div>
    );
};

export default TagManager;
