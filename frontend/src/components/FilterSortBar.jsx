
import { FaSearch } from 'react-icons/fa';

const FilterSortBar = ({ currentFilter, onFilterChange, searchTerm, onSearchChange, sortOrder, onSortChange }) => {
    return (
        <div className="actions-bar">
            {/* Search and Sort Group */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%' }}>
                {/* Search Input */}
                <input
                    type="text"
                    style={{ width: '75%' }}
                    placeholder="Tìm kiếm công việc..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />

                {/* Sort Select */}
                <select id="sort-order" style={{ width: '25%' }} value={sortOrder} onChange={(e) => onSortChange(e.target.value)}>
                    <option value="desc">Mới nhất</option>
                    <option value="asc">Cũ nhất</option>
                </select>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
                    onClick={() => onFilterChange('all')}
                >
                    Tất cả
                </button>
                <button
                    className={`filter-btn ${currentFilter === 'active' ? 'active' : ''}`}
                    onClick={() => onFilterChange('active')}
                >
                    Đang làm
                </button>
                <button
                    className={`filter-btn ${currentFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => onFilterChange('completed')}
                >
                    Đã xong
                </button>
                <button
                    className={`filter-btn overdue-filter ${currentFilter === 'overdue' ? 'active' : ''}`}
                    onClick={() => onFilterChange('overdue')}
                >
                    Trễ hạn
                </button>
                <button
                    className={`filter-btn today-filter ${currentFilter === 'today' ? 'active' : ''}`}
                    onClick={() => onFilterChange('today')}
                >
                    Hôm nay
                </button>
            </div>
        </div>
    );
};
export default FilterSortBar;
