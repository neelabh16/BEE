import './Pagination.css';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {}
}) {
  if (totalPages <= 1) return null;

  const current = Math.max(1, Math.min(currentPage, totalPages));

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageClick = (page) => {
    if (page !== current && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="pagination pagination-wrapper" aria-label="Pagination Navigation">
      {/* First Page Button */}
      <button
        type="button"
        className="page-btn"
        disabled={current <= 1}
        onClick={() => handlePageClick(1)}
        aria-label="First page"
        title="First page"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="11 17 6 12 11 7" />
          <polyline points="18 17 13 12 18 7" />
        </svg>
      </button>

      {/* Previous Page Button */}
      <button
        type="button"
        className="page-btn"
        disabled={current <= 1}
        onClick={() => handlePageClick(current - 1)}
        aria-label="Previous page"
        title="Previous page"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis" aria-hidden="true">
              &hellip;
            </span>
          );
        }

        const isActive = page === current;

        return (
          <button
            key={page}
            type="button"
            className={`page-btn ${isActive ? 'active' : ''}`}
            onClick={() => handlePageClick(page)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        );
      })}

      {/* Next Page Button */}
      <button
        type="button"
        className="page-btn"
        disabled={current >= totalPages}
        onClick={() => handlePageClick(current + 1)}
        aria-label="Next page"
        title="Next page"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Last Page Button */}
      <button
        type="button"
        className="page-btn"
        disabled={current >= totalPages}
        onClick={() => handlePageClick(totalPages)}
        aria-label="Last page"
        title="Last page"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="13 17 18 12 13 7" />
          <polyline points="6 17 11 12 6 7" />
        </svg>
      </button>
    </nav>
  );
}
