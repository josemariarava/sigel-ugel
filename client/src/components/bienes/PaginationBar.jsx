import { Button } from '@fluentui/react-components'

const PaginationBar = ({ currentPage, setCurrentPage, totalPages, pageSize, totalItems }) => {
    if (totalItems <= pageSize) return null

    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, totalItems)

    const getPageNumbers = () => {
        const pages = []
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else if (currentPage <= 3) {
            for (let i = 1; i <= 5; i++) pages.push(i)
        } else if (currentPage >= totalPages - 2) {
            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
        } else {
            for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i)
        }
        return pages
    }

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            <span>
                Mostrando {start}–{end} de {totalItems}
            </span>
            <div className="flex items-center gap-1">
                <Button
                    size="small"
                    appearance="subtle"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                >
                    Anterior
                </Button>
                {getPageNumbers().map(pageNum => (
                    <Button
                        key={pageNum}
                        size="small"
                        appearance={currentPage === pageNum ? 'primary' : 'subtle'}
                        onClick={() => setCurrentPage(pageNum)}
                    >
                        {pageNum}
                    </Button>
                ))}
                <Button
                    size="small"
                    appearance="subtle"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    )
}

export default PaginationBar
