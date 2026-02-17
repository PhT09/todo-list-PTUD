import React, { useState, useEffect } from 'react';
import { todoApi } from '../api/todoApi';

export default function TrashManager({ isOpen, onClose, onRestore, onDeleteForever }) {
    const [trashItems, setTrashItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            todoApi.getTrash()
                .then(res => setTrashItems(res.data))
                .catch(err => alert("Lỗi tải thùng rác"))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    const handleRestore = async (id) => {
        try {
            await todoApi.restore(id);
            setTrashItems(prev => prev.filter(t => t.id !== id));
            onRestore(); // Trigger refresh on main list
        } catch (err) {
            alert("Lỗi khôi phục công việc");
        }
    };

    const handleDeleteForever = async (id) => {
        if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn? Hành động này không thể hoàn tác!")) return;
        try {
            await todoApi.permanentDelete(id);
            setTrashItems(prev => prev.filter(t => t.id !== id));
            onDeleteForever(); // Optional: just refresh trash list
        } catch (err) {
            alert("Lỗi xóa vĩnh viễn");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content trash-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🗑️ Thùng rác</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="trash-list">
                    {loading ? (
                        <p>Đang tải...</p>
                    ) : trashItems.length === 0 ? (
                        <p className="empty-trash">Thùng rác trống</p>
                    ) : (
                        trashItems.map(item => (
                            <div key={item.id} className="trash-item">
                                <div className="trash-info">
                                    <span className="trash-title">{item.title}</span>
                                    <span className="trash-date">
                                        Đã xóa: {new Date(item.deleted_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="trash-actions">
                                    <button
                                        className="restore-btn"
                                        onClick={() => handleRestore(item.id)}
                                        title="Khôi phục"
                                    >
                                        ♻️
                                    </button>
                                    <button
                                        className="delete-forever-btn"
                                        onClick={() => handleDeleteForever(item.id)}
                                        title="Xóa vĩnh viễn"
                                    >
                                        ❌
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
