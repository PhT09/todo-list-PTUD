import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { todoApi } from '../api/todoApi';

export default function TrashManager({ isOpen, onClose, onRestore, onDeleteForever }) {
    const [trashItems, setTrashItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            todoApi.getTrash()
                .then(res => setTrashItems(res.data))
                .catch(() => alert('Lỗi tải thùng rác'))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    const handleRestore = async (id) => {
        try {
            await todoApi.restore(id);
            setTrashItems(prev => prev.filter(t => t.id !== id));
            onRestore();
        } catch {
            alert('Lỗi khôi phục công việc');
        }
    };

    const handleDeleteForever = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn? Hành động này không thể hoàn tác!')) return;
        try {
            await todoApi.permanentDelete(id);
            setTrashItems(prev => prev.filter(t => t.id !== id));
            onDeleteForever();
        } catch {
            alert('Lỗi xóa vĩnh viễn');
        }
    };

    return (
        <Dialog
            header={`Thùng rác ${trashItems.length > 0 ? `(${trashItems.length})` : ''}`}
            visible={isOpen}
            onHide={onClose}
            modal
            className="w-[90%] max-w-[500px] p-4"
            breakpoints={{ '768px': '95vw' }}
        >
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-6">
                        <ProgressSpinner style={{ width: '40px', height: '40px' }} />
                    </div>
                ) : trashItems.length === 0 ? (
                    <Message severity="info" text="Thùng rác trống" className="w-full justify-center" />
                ) : (
                    trashItems.map(item => (
                        <div key={item.id} className="input-bg p-3 rounded-lg flex justify-between items-center border border-[var(--color-glass-border)]">
                            <div className="flex flex-col">
                                <span className="font-medium text-main text-sm">{item.title}</span>
                                <span className="text-xs text-light">
                                    Đã xóa: {new Date(item.deleted_at).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    icon="pi pi-replay"
                                    rounded
                                    text
                                    severity="success"
                                    onClick={() => handleRestore(item.id)}
                                />
                                <Button
                                    icon="pi pi-times"
                                    rounded
                                    text
                                    severity="danger"
                                    onClick={() => handleDeleteForever(item.id)}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Dialog>
    );
}
