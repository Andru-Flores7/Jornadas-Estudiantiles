/**
 * LoadingSpinner — Indicador de carga centrado en pantalla completa.
 * Usado como fallback del Suspense mientras se cargan los chunks lazy.
 */
const LoadingSpinner = () => (
  <div className="d-flex align-items-center justify-content-center min-vh-100">
    <div className="text-center">
      <div
        className="spinner-border mb-3"
        role="status"
        style={{ color: '#ba8b02', width: '3rem', height: '3rem' }}
      />
      <div className="text-white opacity-75 fw-bold">Cargando...</div>
    </div>
  </div>
);

export default LoadingSpinner;
