
const PaginationBar = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handlePrev = () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    };

    return (
        <div className="pagination-bar">
            <button
                onClick={handlePrev}
                disabled={currentPage <= 1}
            >
                Trước
            </button>
            <span id="page-info">
                {totalItems > 0 ? `Trang ${currentPage} / ${totalPages}` : 'Trang 0 / 0'}
            </span>
            <button
                onClick={handleNext}
                disabled={currentPage >= totalPages || totalPages === 0}
            >
                Sau
            </button>
        </div>
    );
};
export default PaginationBar;
