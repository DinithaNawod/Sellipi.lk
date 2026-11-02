import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
interface Props { page: number; pages: number; total?: number; limit?: number; onPageChange: (page: number) => void; onLimitChange?: (limit: number) => void; }
export default function Pagination({ page, pages, total = 0, limit = 10, onPageChange, onLimitChange }: Props) {
  const last = Math.max(1, pages);
  return <div className="pagination-bar" aria-label="Archive pagination"><span>Page</span>
    <button onClick={() => onPageChange(1)} disabled={page <= 1} aria-label="First page"><ChevronsLeft /></button>
    <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page"><ChevronLeft /></button>
    <label className="page-number"><span className="sr-only">Current page</span><select value={Math.min(page, last)} onChange={event => onPageChange(Number(event.target.value))}>{Array.from({ length: last }, (_, index) => <option key={index} value={index + 1}>{String(index + 1).padStart(2, '0')}</option>)}</select></label>
    <button onClick={() => onPageChange(page + 1)} disabled={page >= last} aria-label="Next page"><ChevronRight /></button>
    <button onClick={() => onPageChange(last)} disabled={page >= last} aria-label="Last page"><ChevronsRight /></button><span>of {last}</span>
    <span className="record-count">Record {total ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total}</span>
    {onLimitChange && <select aria-label="Records per page" value={limit} onChange={event => onLimitChange(Number(event.target.value))}>{[10, 20, 50].map(value => <option key={value}>{value}</option>)}</select>}
  </div>;
}
