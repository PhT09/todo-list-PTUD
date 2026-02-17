
import { FaSearch } from 'react-icons/fa';

const FilterSortBar = ({ currentFilter, onFilterChange, searchTerm, onSearchChange, sortOrder, onSortChange }) => {
    return (
        <div className="actions-bar">
            {/* Search Input */}
            <div className="search-group" style={{ flex: 1, position: 'relative' }}>
                <input
                    type="text"
                    style={{ width: '100%' }}
                    placeholder="Tìm kiếm công việc..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {/* Sort Select */}
            <select id="sort-order" value={sortOrder} onChange={(e) => onSortChange(e.target.value)}>
                <option value="desc">Mới nhất</option>
                <option value="asc">Cũ nhất</option>
            </select>

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
