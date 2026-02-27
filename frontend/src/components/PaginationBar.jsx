import { Paginator } from 'primereact/paginator';

const PaginationBar = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const first = (currentPage - 1) * itemsPerPage;

    const onPaginatorChange = (e) => {
        const newPage = Math.floor(e.first / itemsPerPage) + 1;
        onPageChange(newPage);
    };

    return (
        <Paginator
            first={first}
            rows={itemsPerPage}
            totalRecords={totalItems}
            onPageChange={onPaginatorChange}
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            className="p-0"
        />
    );
};

export default PaginationBar;
