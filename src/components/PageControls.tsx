export default function PageControls({ page, pages, total, onChange, disabled = false }: { page: number; pages: number; total: number; onChange: (page: number) => void; disabled?: boolean }) {
  return <div className="page-controls"><span>{total} result{total === 1 ? '' : 's'}</span><div><button disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>Previous</button><span>Page {page} of {Math.max(1, pages)}</span><button disabled={disabled || page >= pages} onClick={() => onChange(page + 1)}>Next</button></div></div>;
}
