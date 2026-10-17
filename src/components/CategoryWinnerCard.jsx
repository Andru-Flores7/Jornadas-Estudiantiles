/**
 * CategoryWinnerCard — Tarjeta grande de resultado por categoría.
 *
 * Muestra el puntaje de Equipo A vs Equipo B y el ganador con
 * un banner dorado. Si `hasData` es false (jurados aún votando),
 * muestra un mensaje de espera en lugar del ganador.
 *
 * @param {{ label, a, b, teamA, teamB, hasData, honorOnly }} props
 *   - label:     Nombre de la categoría (ej: "Juego #1")
 *   - a:         Puntos del Equipo A
 *   - b:         Puntos del Equipo B
 *   - teamA:     Nombre del Equipo A
 *   - teamB:     Nombre del Equipo B
 *   - hasData:   true si todos los jurados ya votaron esta categoría
 *   - honorOnly: true para categorías de honor (Napolitana) — muestra 🎨 en lugar de 🏆
 */
const CategoryWinnerCard = ({ label, a, b, teamA, teamB, hasData, honorOnly }) => {
  const winner = !hasData ? null : a === b ? 'EMPATE' : a > b ? teamA : teamB;

  return (
    <div
      className="card border-0 shadow-lg text-white w-100"
      style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        marginBottom: '300px',
      }}
    >
      <div className="card-body p-4 d-flex flex-column justify-content-between text-center">

        {/* Nombre de la categoría */}
        <div
          className="text-uppercase fw-black mb-3 mt-1"
          style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.3rem)', fontWeight: '900', letterSpacing: '3px', color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
        >
          {label}
        </div>

        {/* Puntajes */}
        <div className="d-flex align-items-center justify-content-around my-4">
          {[{ team: teamA, score: a, isA: true }, { team: teamB, score: b, isA: false }].map(({ team, score, isA }, i, arr) => (
            <>
              <div key={team} className="text-center px-2" style={{ flex: 1 }}>
                <div className="m-0 fw-black" style={{ color: '#ffab40', fontSize: 'clamp(3.8rem, 7.5vw, 6.5rem)', fontWeight: '900', lineHeight: '1', textShadow: '0 4px 20px rgba(255,171,64,0.4)' }}>
                  {honorOnly ? (isA ? (a > b ? '1' : '0') : (b > a ? '1' : '0')) : score}
                </div>
                <div className="fw-bold mt-3 px-2 text-uppercase" style={{ fontSize: 'clamp(1.2rem, 2.2vw, 1.8rem)', fontWeight: '800', color: '#f1f5f9', letterSpacing: '1px' }}>
                  {team}
                </div>
              </div>
              {i < arr.length - 1 && (
                <div className="fw-black mx-3" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: '900', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                  VS
                </div>
              )}
            </>
          ))}
        </div>

        {/* Banner ganador o espera */}
        <div className="mt-3 mb-2 px-2">
          {winner ? (
            <div
              className="py-3 px-4 rounded-pill shadow-lg d-inline-block w-100 text-uppercase"
              style={{
                background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
                color: '#000000',
                fontSize: 'clamp(1.3rem, 2.2vw, 1.8rem)',
                fontWeight: '900',
                letterSpacing: '1.5px',
                boxShadow: '0 8px 25px rgba(245,158,11,0.4)',
              }}
            >
              {honorOnly ? '🎨' : '🏆'}{' '}
              {winner === 'EMPATE' ? 'empate' : `GANADOR: ${winner}`}
            </div>
          ) : (
            <div
              className="py-3 px-4 rounded-pill d-inline-block w-100"
              style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.5rem)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: '1px' }}
            >
              ⏳ Esperando que todos los jurados envíen sus votos...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryWinnerCard;
