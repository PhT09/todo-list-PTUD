
import { FaSearch } from 'react-icons/fa';

const FilterSortBar = ({ currentFilter, onFilterChange, searchTerm, onSearchChange, sortOrder, onSortChange }) => {
    return (
        <div className="actions-bar">
            {/* Search Input */}
            <div className="search-group" style={{ flex: 1, position: 'relative' }}>
                <input
                    type="text"
                    placeholder="Tìm kiếm công việc..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {/* Simple visual icon integration via CSS or custom style if needed,
            for now just input as requested */}
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
            </div>

            {/* Sort Select */}
            <select id="sort-order" value={sortOrder} onChange={(e) => onSortChange(e.target.value)}>
                <option value="desc">Mới nhất</option>
                <option value="asc">Cũ nhất</option>
            </select>
        </div>
    );
};
export default FilterSortBar;
