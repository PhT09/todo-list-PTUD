import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';

const sortOptions = [
    { label: 'Mới nhất', value: 'desc' },
    { label: 'Cũ nhất', value: 'asc' },
];

const filterOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Đang làm', value: 'active' },
    { label: 'Đã xong', value: 'completed' },
    { label: 'Trễ hạn', value: 'overdue' },
    { label: 'Hôm nay', value: 'today' },
];

const FilterSortBar = ({ currentFilter, onFilterChange, searchTerm, onSearchChange, sortOrder, onSortChange }) => {
    return (
        <div className="flex flex-col gap-3 justify-center">
            {/* Search + Sort */}
            <div className="flex gap-3 items-center w-full">
                <span className="p-input-icon-left flex-1">
                    <i className="pi pi-search" />
                    <InputText
                        placeholder="Tìm kiếm công việc..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full"
                    />
                </span>
                <Dropdown
                    value={sortOrder}
                    options={sortOptions}
                    onChange={(e) => onSortChange(e.value)}
                    className="w-[120px]"
                />
            </div>

            {/* Filter Tabs - PrimeReact SelectButton */}
            <SelectButton
                value={currentFilter}
                options={filterOptions}
                onChange={(e) => e.value && onFilterChange(e.value)}
                className="w-full"
                allowEmpty={false}
            />
        </div>
    );
};

export default FilterSortBar;
