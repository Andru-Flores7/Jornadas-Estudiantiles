/**
 * LiveMonitorTab — Pestaña "Monitoreo de Jurados en Vivo" del panel Admin.
 *
 * Muestra una tarjeta expandible por jurado con:
 * - Estado (Pendiente / Votando / Enviado)
 * - Barra de progreso
 * - Puntos provisionales
 * - Desglose visual con VoteDots
 * - Detalle completo expandible (puntuaciones por criterio)
 *
 * También incluye la Matriz Comparativa de Votos en Vivo.
 *
 * @param {{ db, jurors, jurorResults, config }} props
 */
import { useState, useMemo } from 'react';
import VoteDot from '../ui/VoteDot';
import { calculateJurorProgress } from '../../utils/scoring';

// ── Helper: renderiza una fila de dots ──────────────────────────────────────
const DotRow = ({ arr, total, teamA, teamB }) => (
  <div className="d-flex gap-1 flex-wrap justify-content-center">
    {Array.from({ length: total }, (_, i) => (
      <VoteDot key={i} value={arr?.[i]} index={i} teamA={teamA} teamB={teamB} />
    ))}
  </div>
);

// ── Helper: celda de criterio numérico ──────────────────────────────────────
const ScoreEntries = ({ obj }) => (
  <>
    {Object.entries(obj || {}).map(([k, v]) => (
      <div key={k} className="d-flex justify-content-between pe-2 lh-sm my-1">
        <span className="opacity-75 text-capitalize" style={{ fontSize: '0.65rem' }}>{k}:</span>
        <span className="fw-bold">{v || '-'}</span>
      </div>
    ))}
  </>
);

// ── Componente principal ───────────────────────────────────────────────────

const LiveMonitorTab = ({ db, jurors, jurorResults, config }) => {
  const teamA = config.teamA;
  const teamB = config.teamB;

  const [expandedJuror, setExpandedJuror] = useState({
    juror1: false, juror2: false, juror3: false, juror4: false,
  });

  const jurorProgressData = useMemo(() =>
    jurors.map((j) => ({
      id: j.id,
      label: j.label,
      progress: calculateJurorProgress(db[j.id]),
      updatedAt: db[j.id]?.updated_at
        ? new Date(db[j.id].updated_at).toLocaleTimeString()
        : null,
    })),
    [db, jurors]
  );

  return (
    <>
      {/* ── Tarjetas de jurado ── */}
      <div className="row g-4 mb-5">
        {jurorProgressData.map((jp) => {
          const dataObj = db[jp.id];
          const { isStarted, submitted, pct } = jp.progress;
          const isExpanded = expandedJuror[jp.id];
          const result = jurorResults.find((r) => r.id === jp.id)?.result;

          return (
            <div key={jp.id} className="col-lg-4 col-md-12">
              <div className={`card shadow border-0 h-100 p-4 d-flex flex-column justify-content-between ${
                submitted ? 'border-top border-success border-5'
                : isStarted ? 'border-top border-warning border-5'
                : 'opacity-75'
              }`}>

                {/* Cabecera */}
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold m-0 text-white">{jp.label}</h5>
                    {submitted ? (
                      <span className="badge bg-success">Enviado</span>
                    ) : isStarted ? (
                      <span className="badge bg-warning text-dark">Votando {pct}%</span>
                    ) : (
                      <span className="badge bg-secondary">Pendiente</span>
                    )}
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between small opacity-75 mb-1" style={{ fontSize: '0.75rem' }}>
                      <span>Progreso de Planilla</span>
                      <span>{jp.progress.totalFilled} / 51 campos</span>
                    </div>
                    <div className="progress" style={{ height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.1)' }}>
                      <div
                        className={`progress-bar ${submitted ? 'bg-success' : 'bg-warning'}`}
                        role="progressbar"
                        style={{ width: `${pct}%`, transition: 'width 0.4s ease' }}
                        aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"
                      />
                    </div>
                  </div>

                  {/* Puntajes provisionales */}
                  <div className="d-flex justify-content-around align-items-center py-2 mb-4 bg-dark bg-opacity-25 rounded border border-white border-opacity-10">
                    {[{ team: teamA, total: result?.totalA }, { team: teamB, total: result?.totalB }].map(({ team, total }, i) => (
                      <div key={i} className="text-center">
                        <div className="small text-uppercase opacity-50" style={{ fontSize: '0.65rem' }}>{team}</div>
                        <div className="h4 m-0 fw-bold" style={{ color: '#ff9800' }}>{total ?? 0}</div>
                      </div>
                    ))}
                  </div>

                  {/* Desglose visual con VoteDots */}
                  <div className="d-flex flex-column gap-3 my-4">
                    <div>
                      <div className="small opacity-75 fw-bold mb-1" style={{ fontSize: '0.75rem' }}>
                        Juegos ({jp.progress.juegos.filled}/3):
                      </div>
                      <DotRow arr={dataObj?.juegos} total={3} teamA={teamA} teamB={teamB} />
                    </div>

                    <div>
                      <div className="small opacity-75 fw-bold mb-1" style={{ fontSize: '0.75rem' }}>Napolitana:</div>
                      <div className="d-flex gap-1 justify-content-center">
                        <span
                          className="d-inline-flex align-items-center justify-content-center fw-bold rounded-circle shadow-sm"
                          style={{
                            width: '28px', height: '28px', fontSize: '9px',
                            background: dataObj?.napolitana === 'A' ? '#ff9800' : dataObj?.napolitana === 'B' ? '#2196f3' : 'rgba(255,255,255,0.15)',
                            color: dataObj?.napolitana ? '#000' : 'rgba(255,255,255,0.4)',
                            border: dataObj?.napolitana ? 'none' : '1px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          {dataObj?.napolitana || '-'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="small opacity-75 fw-bold mb-1" style={{ fontSize: '0.75rem' }}>
                        Popurrí Alternativo ({jp.progress.popurri.filled}/11):
                      </div>
                      <DotRow arr={dataObj?.popurri} total={11} teamA={teamA} teamB={teamB} />
                    </div>

                    <div>
                      <div className="small opacity-75 fw-bold mb-1" style={{ fontSize: '0.75rem' }}>
                        Popurrí Mascota ({jp.progress.mascota.filled}/5):
                      </div>
                      <DotRow arr={dataObj?.mascota} total={5} teamA={teamA} teamB={teamB} />
                    </div>

                    {/* Ritmos */}
                    <div className="row g-2">
                      {['ritmo1', 'ritmo2', 'ritmo3'].map((r, i) => (
                        <div className="col-4" key={r}>
                          <div className="small opacity-75 fw-bold" style={{ fontSize: '0.72rem' }}>Ritmo {i + 1}</div>
                          <div className="badge bg-dark w-100 text-center border border-white border-opacity-10 py-2 px-1">
                            {jp.progress[r].filled} / 12
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Videoclip */}
                    <div>
                      <div className="small opacity-75 fw-bold" style={{ fontSize: '0.75rem' }}>Video Clip</div>
                      <div className="badge bg-dark w-100 text-center border border-white border-opacity-10 py-2">
                        {jp.progress.videoclip.filled} / 14 campos
                      </div>
                    </div>
                  </div>

                  {/* Detalle expandible */}
                  {isExpanded && (
                    <div className="mt-3 p-3 bg-dark bg-opacity-50 rounded shadow-inner" style={{ fontSize: '0.82rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="row g-3">
                        {[{ team: 'A', label: teamA, cls: 'text-warning', borderCls: 'border-end border-secondary border-opacity-25' },
                          { team: 'B', label: teamB, cls: 'text-info', borderCls: '' }
                        ].map(({ team, label, cls, borderCls }) => (
                          <div key={team} className={`col-6 ${borderCls}`}>
                            <h6 className={`${cls} text-uppercase mb-2`} style={{ fontSize: '0.7rem', fontWeight: '700' }}>{label}</h6>
                            <div className="d-flex flex-column gap-2">
                              {['ritmo1', 'ritmo2', 'ritmo3'].map((r, i) => (
                                <div key={r}>
                                  <div className="text-muted fw-bold mb-1" style={{ fontSize: '0.65rem' }}>Ritmo {i + 1}:</div>
                                  <ScoreEntries obj={dataObj?.[r]?.[team]} />
                                </div>
                              ))}
                              <div>
                                <div className="text-muted fw-bold mb-1" style={{ fontSize: '0.65rem' }}>Video Clip:</div>
                                <ScoreEntries obj={dataObj?.videoclip?.[team]} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botón expandir */}
                <div className="mt-4 border-top border-white border-opacity-10 pt-3">
                  <button
                    className="btn btn-outline-primary btn-sm w-100 fw-bold"
                    onClick={() => setExpandedJuror((prev) => ({ ...prev, [jp.id]: !prev[jp.id] }))}
                    disabled={!isStarted}
                  >
                    {isExpanded ? '🔼 Ocultar Detalles' : '🔽 Ver Planilla Detallada'}
                  </button>
                  <div className="text-end small mt-2" style={{ fontSize: '0.65rem', opacity: jp.updatedAt ? 0.5 : 0.25 }}>
                    {jp.updatedAt ? `Sincronizado: ${jp.updatedAt}` : 'Sin actividad en vivo'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Matriz comparativa ── */}
      <div className="card shadow border-0 mt-5 mb-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
        <div className="card-header bg-primary text-white py-3 fw-bold text-center text-uppercase">
          📊 Matriz Comparativa de Votos en Vivo
        </div>
        <div className="card-body p-0 table-responsive">
          <table className="table table-hover m-0 align-middle text-center responsive-table-admin">
            <thead className="table-light">
              <tr>
                <th className="text-start ps-4">Categoría / Ítem</th>
                {jurors.map((j) => <th key={j.id}>{j.label}</th>)}
              </tr>
            </thead>
            <tbody className="fw-bold">
              {/* Juegos */}
              {[0, 1, 2].map((idx) => (
                <tr key={`juego-${idx}`}>
                  <td className="text-start ps-4 opacity-75">Juego #{idx + 1}</td>
                  {jurors.map((j) => {
                    const val = db[j.id]?.juegos?.[idx];
                    return (
                      <td key={j.id}>
                        {val ? (
                          <span className={`badge ${val === 'A' ? 'bg-warning text-dark' : 'bg-primary'} px-3`}>
                            {val === 'A' ? teamA : teamB}
                          </span>
                        ) : (
                          <span className="text-muted opacity-50 small">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Popurrí y Mascota */}
              {[
                { label: 'Popurrí Alternativo', key: 'popurri', total: 11 },
                { label: 'Popurrí Mascota', key: 'mascota', total: 5 },
              ].map(({ label, key, total }) => (
                <tr key={key}>
                  <td className="text-start ps-4 opacity-75">{label}</td>
                  {jurors.map((j) => {
                    const arr = db[j.id]?.[key] || [];
                    const filled = arr.filter((x) => x !== null && x !== '').length;
                    const aCount = arr.filter((x) => x === 'A').length;
                    const bCount = arr.filter((x) => x === 'B').length;
                    return (
                      <td key={j.id}>
                        {filled > 0 ? (
                          <span className="text-white">
                            {filled}/{total}{' '}
                            <span className="text-muted small">({teamA}: {aCount} | {teamB}: {bCount})</span>
                          </span>
                        ) : (
                          <span className="text-muted opacity-50 small">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Ritmos (A y B) y Videoclip (A y B) */}
              {['ritmo1', 'ritmo2', 'ritmo3', 'videoclip'].flatMap((section) =>
                ['A', 'B'].map((team) => {
                  const maxItems = section === 'videoclip' ? 7 : 5;
                  const label = section === 'videoclip'
                    ? `Videoclip: ${team === 'A' ? teamA : teamB}`
                    : `Ritmo ${section.slice(-1)}: ${team === 'A' ? teamA : teamB}`;
                  return (
                    <tr key={`${section}-${team}`}>
                      <td className="text-start ps-4 opacity-75">{label}</td>
                      {jurors.map((j) => {
                        const obj = db[j.id]?.[section]?.[team] || {};
                        const filled = Object.values(obj).filter((x) => x !== '').length;
                        const sum = Object.values(obj).reduce((acc, v) => acc + (Number(v) || 0), 0);
                        return (
                          <td key={j.id}>
                            {filled > 0 ? (
                              <span className={team === 'A' ? 'text-warning' : 'text-info'}>
                                {sum} pts{' '}
                                <span className="text-muted small">({filled}/{maxItems})</span>
                              </span>
                            ) : (
                              <span className="text-muted opacity-50 small">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default LiveMonitorTab;
