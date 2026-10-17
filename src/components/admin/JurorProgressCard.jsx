/**
 * JurorProgressCard — Tarjeta compacta de progreso de un jurado.
 * Usada en la pestaña "Resultados Consolidados" del Admin.
 *
 * Muestra estado (Pendiente / Votando / Enviado), barra de progreso
 * y el puntaje provisional de ese jurado para cada equipo.
 *
 * @param {{ jp, teamA, teamB, showRes, currentData }} props
 */
const JurorProgressCard = ({ jp, teamA, teamB, showRes, currentData }) => {
  const submitted = jp.progress.submitted;
  const percent = jp.progress.pct;
  const result = currentData?.jurorResults?.find((r) => r.id === jp.id)?.result;

  return (
    <div className="col-lg-4">
      <div
        className={`card shadow-sm border-0 p-3 text-center h-100 d-flex flex-column justify-content-center ${
          submitted
            ? 'border-start border-success border-5'
            : jp.progress.isStarted
            ? 'border-start border-warning border-5'
            : 'opacity-50'
        }`}
      >
        <h6 className="mb-1">{jp.label}</h6>

        {/* Insignia de estado */}
        <div className="small text-uppercase opacity-75 mb-2 d-flex justify-content-center align-items-center gap-2">
          {submitted ? (
            <span className="badge bg-success">✅ Recibido</span>
          ) : jp.progress.isStarted ? (
            <span className="badge bg-warning text-dark">✍️ Votando ({percent}%)</span>
          ) : (
            <span className="badge bg-secondary">⏳ Pendiente</span>
          )}
        </div>

        {/* Barra de progreso */}
        <div
          className="progress mb-2"
          style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}
        >
          <div
            className="progress-bar bg-success"
            style={{ width: `${percent}%`, transition: 'width 0.4s ease' }}
          />
        </div>

        {/* Puntaje provisional */}
        <b className="h5 mb-0">
          {teamA}: {showRes && result ? result.totalA : 0} | {teamB}:{' '}
          {showRes && result ? result.totalB : 0}
        </b>

        {jp.updatedAt && (
          <div className="small opacity-50 text-end mt-2" style={{ fontSize: '0.7rem' }}>
            Sinc: {jp.updatedAt}
          </div>
        )}
      </div>
    </div>
  );
};

export default JurorProgressCard;
