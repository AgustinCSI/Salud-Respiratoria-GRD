import { AlertCircle, SearchX, RefreshCw } from 'lucide-react';

export function LoadingState() {
  return <div aria-live="polite" role="status" aria-label="Cargando resultados" className="loading-state">
    <span className="sr-only">Calculando la selección…</span>
    <div className="metric-grid">{[1, 2, 3].map(i => <div className="skeleton skeleton-card" key={i} />)}</div>
    <div className="skeleton skeleton-chart" />
  </div>;
}

export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <div className="state-panel" role="alert"><AlertCircle size={28} /><h2>No pudimos cargar esta selección</h2><p>{message}</p><button className="button primary" onClick={retry}><RefreshCw size={16} />Volver a intentar</button></div>;
}

export function EmptyState({ reset }: { reset: () => void }) {
  return <div className="empty-inline" role="status"><SearchX size={24} /><div><h2>No hay hospitalizaciones respiratorias para esta selección</h2><p>El conteo es cero dentro de la cobertura simulada. Puedes ampliar las fechas o limpiar los filtros.</p></div><button className="button" onClick={reset}>Limpiar filtros</button></div>;
}
