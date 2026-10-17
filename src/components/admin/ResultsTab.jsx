/**
 * ResultsTab — Pestaña "Resultados Consolidados" del panel Admin.
 *
 * Muestra:
 * 1. Tarjetas visuales (CategoryWinnerCard) por categoría.
 * 2. Tabla de puntaje en vivo por categoría.
 * 3. Tabla de votos individuales de cada jurado.
 * 4. Grilla de progreso por jurado.
 * 5. Marcador final (totalA vs totalB).
 *
 * @param {{ db, jurors, config, currentData, allVoted, anyCategoryFullyVoted, showRes }} props
 */
import { useMemo } from 'react';
import CategoryWinnerCard from '../CategoryWinnerCard';
import JurorProgressCard from './JurorProgressCard';
import { isCategoryFullyVoted, calculateJurorProgress } from '../../utils/scoring';

// ── Helpers internos ────────────────────────────────────────────────────────

/**
 * Determina el ganador y los puntos de un jurado en una categoría concreta.
 * @returns {{ label: string, winner: 'A'|'B'|'EMPATE'|null, detail: string }}
 */
const getJurorVoteDetails = (db, jurorId, categoryKey, teamA, teamB) => {
  const jurorData = db[jurorId];
  if (!jurorData || !jurorData.submitted) return { label: '-', winner: null, detail: '' };

  let valA = 0;
  let valB = 0;
  let hasData = false;
  let detailUnit = 'pts';

  if (categoryKey === 'napolitana') {
    valA = jurorData.napolitana === 'A' ? 1 : 0;
    valB = jurorData.napolitana === 'B' ? 1 : 0;
    hasData = valA > 0 || valB > 0;
    detailUnit = 'voto';
  } else if (categoryKey === 'popurri') {
    valA = (jurorData.popurri || []).filter((v) => v === 'A').length;
    valB = (jurorData.popurri || []).filter((v) => v === 'B').length;
    hasData = valA > 0 || valB > 0;
    detailUnit = 'votos';
  } else if (categoryKey === 'mascota') {
    valA = (jurorData.mascota || []).filter((v) => v === 'A').length;
    valB = (jurorData.mascota || []).filter((v) => v === 'B').length;
    hasData = valA > 0 || valB > 0;
    detailUnit = 'votos';
  } else if (['ritmo1', 'ritmo2', 'ritmo3'].includes(categoryKey)) {
    valA = Object.values(jurorData[categoryKey]?.A || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
    valB = Object.values(jurorData[categoryKey]?.B || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
    hasData = valA > 0 || valB > 0;
  } else if (categoryKey === 'videoclip') {
    valA = Object.values(jurorData.videoclip?.A || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
    valB = Object.values(jurorData.videoclip?.B || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
    hasData = valA > 0 || valB > 0;
  }

  if (!hasData) return { label: '-', winner: null, detail: '' };

  const winner = valA > valB ? 'A' : valB > valA ? 'B' : 'EMPATE';
  const label = winner === 'A' ? teamA : winner === 'B' ? teamB : 'EMPATE';
  return { label, winner, detail: `${valA} vs ${valB} ${detailUnit}` };
};

// ── Configuración de categorías ────────────────────────────────────────────

const SCORE_CATEGORIES = [
  { label: 'Juegos',                          key: 'juegos',     aKey: 'juegosA',  bKey: 'juegosB'  },
  { label: 'Ganador Popurrí Alternativo',     key: 'popurri',    aKey: 'popA',     bKey: 'popB'     },
  { label: 'Ganador Popurrí Mascota',         key: 'mascota',    aKey: 'masA',     bKey: 'masB'     },
  { label: 'Ganador Popurrí Selec. Ritmo 1',  key: 'ritmo1',     aKey: 'r1A',      bKey: 'r1B'      },
  { label: 'Ganador Popurrí Selec. Ritmo 2',  key: 'ritmo2',     aKey: 'r2A',      bKey: 'r2B'      },
  { label: 'Ganador Popurrí Selec. Ritmo 3',  key: 'ritmo3',     aKey: 'r3A',      bKey: 'r3B'      },
  { label: 'Ganador Video Clip',              key: 'videoclip',  aKey: 'vidA',     bKey: 'vidB'     },
  { label: 'Ganador Napolitana',              key: 'napolitana', aKey: 'napA',     bKey: 'napB'     },
];

const JUROR_VOTE_CATEGORIES = [
  { label: 'Popurrí Alternativo',              key: 'popurri'   },
  { label: 'Popurrí Alternativo de la Mascota',key: 'mascota'   },
  { label: 'Popurrí Seleccionado Ritmo 1',     key: 'ritmo1'    },
  { label: 'Popurrí Seleccionado Ritmo 2',     key: 'ritmo2'    },
  { label: 'Popurrí Seleccionado Ritmo 3',     key: 'ritmo3'    },
  { label: 'Video Clip',                       key: 'videoclip' },
  { label: '🎨 Napolitana',                    key: 'napolitana'},
];

const CARD_CATEGORIES = [
  { label: 'Popurrí Alternativo',          key: 'popurri',   aKey: 'popA', bKey: 'popB'  },
  { label: 'Popurrí Mascota',              key: 'mascota',   aKey: 'masA', bKey: 'masB'  },
  { label: 'Popurrí Seleccionado Ritmo 1', key: 'ritmo1',    aKey: 'r1A',  bKey: 'r1B'   },
  { label: 'Popurrí Seleccionado Ritmo 2', key: 'ritmo2',    aKey: 'r2A',  bKey: 'r2B'   },
  { label: 'Popurrí Seleccionado Ritmo 3', key: 'ritmo3',    aKey: 'r3A',  bKey: 'r3B'   },
  { label: 'Video Clip',                   key: 'videoclip', aKey: 'vidA', bKey: 'vidB'  },
  { label: '🎨 Napolitana',               key: 'napolitana',aKey: 'napA', bKey: 'napB'  },
];

// ── Componente principal ───────────────────────────────────────────────────

const ResultsTab = ({ db, jurors, config, currentData, allVoted, anyCategoryFullyVoted, showRes }) => {
  const teamA = config.teamA;
  const teamB = config.teamB;

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
      {/* ── 1. Tarjetas visuales por categoría ── */}
      <div className="row justify-content-center mb-5">
        <div className="col-12">
          {/* Tarjetas de Juegos */}
          {(currentData?.breakdown?.individualGames || []).map((win, i) => {
            const gameVoted = isCategoryFullyVoted(db, jurors, `juego-${i}`);
            return (
              <div className="mb-4" key={`card-juego-${i}`}>
                <CategoryWinnerCard
                  label={`Juego #${i + 1}`}
                  a={gameVoted ? (win === 'A' ? 6 : win === 'EMPATE' ? 3 : 0) : 0}
                  b={gameVoted ? (win === 'B' ? 6 : win === 'EMPATE' ? 3 : 0) : 0}
                  teamA={teamA}
                  teamB={teamB}
                  hasData={gameVoted}
                />
              </div>
            );
          })}

          {/* Tarjetas de demás categorías */}
          {CARD_CATEGORIES.map((cat) => {
            const catVoted = isCategoryFullyVoted(db, jurors, cat.key);
            return (
              <div className="mb-4" key={`card-cat-${cat.key}`}>
                <CategoryWinnerCard
                  label={cat.label}
                  a={catVoted ? currentData?.breakdown?.[cat.aKey] || 0 : 0}
                  b={catVoted ? currentData?.breakdown?.[cat.bKey] || 0 : 0}
                  teamA={teamA}
                  teamB={teamB}
                  hasData={catVoted}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. Tabla puntaje por categoría ── */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card shadow border-0 h-100" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            <div className="card-header bg-primary text-white py-3 fw-bold text-center text-uppercase">
              Puntaje en Vivo por Categoría
            </div>
            <div className="card-body p-0 table-responsive">
              <table className="table table-hover m-0 align-middle text-center responsive-table-admin">
                <thead className="table-light">
                  <tr>
                    <th className="text-start ps-4">Categoría</th>
                    <th>{teamA}</th>
                    <th>{teamB}</th>
                    <th>Ganador</th>
                  </tr>
                </thead>
                <tbody className="fw-bold">
                  {SCORE_CATEGORIES.map((row) => {
                    const voted = isCategoryFullyVoted(db, jurors, row.key);
                    const votesA = currentData?.breakdown?.[row.aKey] ?? 0;
                    const votesB = currentData?.breakdown?.[row.bKey] ?? 0;
                    const rowWinner = !voted
                      ? null
                      : votesA === votesB ? 'EMPATE'
                      : votesA > votesB ? teamA : teamB;

                    return (
                      <tr key={row.key}>
                        <td className="text-start ps-4 opacity-75">{row.label}</td>
                        <td style={{ color: '#ffb74d' }}>{voted ? votesA : '-'}</td>
                        <td style={{ color: '#ffb74d' }}>{voted ? votesB : '-'}</td>
                        <td>
                          {rowWinner === null ? (
                            <span className="badge px-3" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.45)', fontWeight: '600' }}>
                              ⏳ Esperando jurados...
                            </span>
                          ) : (
                            <span className={`badge ${rowWinner === 'EMPATE' ? 'bg-warning text-dark' : 'bg-success'} px-3`}>
                              {rowWinner}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="table-dark">
                  <tr>
                    <td className="text-start ps-4">RESULTADO PARCIAL</td>
                    <td className="h4 m-0" style={{ color: '#ff9800' }}>
                      {anyCategoryFullyVoted ? currentData?.totalA : '-'}
                    </td>
                    <td className="h4 m-0" style={{ color: '#ff9800' }}>
                      {anyCategoryFullyVoted ? currentData?.totalB : '-'}
                    </td>
                    <td className={`fw-bold ${anyCategoryFullyVoted && currentData?.totalA === currentData?.totalB ? 'text-warning' : 'text-info'}`}>
                      {!anyCategoryFullyVoted
                        ? '⏳ Esperando jurados...'
                        : currentData?.totalA === currentData?.totalB
                        ? 'EMPATE'
                        : currentData?.totalA > currentData?.totalB ? teamA : teamB}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Tabla votos individuales de jurados ── */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card shadow border-0 h-100" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            <div className="card-header bg-dark text-white py-3 fw-bold text-center text-uppercase">
              Votos Individuales de Jurados
            </div>
            <div className="card-body p-0 table-responsive">
              <table className="table table-hover m-0 align-middle text-center responsive-table-admin">
                <thead className="table-light">
                  <tr>
                    <th className="text-start ps-4">Categoría</th>
                    {jurors.map((j) => <th key={j.id}>{j.label}</th>)}
                  </tr>
                </thead>
                <tbody className="fw-bold">
                  {JUROR_VOTE_CATEGORIES.map((row) => (
                    <tr key={row.key}>
                      <td className="text-start ps-4 opacity-75">{row.label}</td>
                      {jurors.map((j) => {
                        const { label, winner, detail } = getJurorVoteDetails(db, j.id, row.key, teamA, teamB);
                        return (
                          <td key={j.id}>
                            {label === '-' ? (
                              <span className="text-muted">-</span>
                            ) : (
                              <div>
                                <span
                                  className="badge px-3 py-2"
                                  style={{
                                    background: winner === 'A' ? '#ff9800' : winner === 'B' ? '#2196f3' : '#6c757d',
                                    color: winner === 'A' ? '#000' : '#fff',
                                    borderRadius: '8px',
                                  }}
                                >
                                  {label}
                                </span>
                                <div className="small text-muted mt-1" style={{ fontSize: '11px' }}>{detail}</div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Grilla de progreso por jurado ── */}
      <div className="row g-3 mb-5">
        {jurorProgressData.map((jp) => (
          <JurorProgressCard
            key={jp.id}
            jp={jp}
            teamA={teamA}
            teamB={teamB}
            showRes={showRes}
            currentData={currentData}
          />
        ))}
      </div>

      {/* ── 5. Marcador final ── */}
      <div
        className="card shadow-lg bg-dark bg-opacity-75 text-white p-5 text-center border-0"
        style={{ borderRadius: '30px', background: 'linear-gradient(135deg, #1a1a1a, #2c3e50)' }}
      >
        <div className="row justify-content-center align-items-center">
          <div className="col-md-5">
            <div className="display-1 fw-bold" style={{ color: '#ff9800' }}>
              {anyCategoryFullyVoted ? currentData?.totalA : '-'}
            </div>
            <h4 className="text-uppercase">{teamA}</h4>
          </div>
          <div className="col-md-2 display-4 opacity-25">VS</div>
          <div className="col-md-5">
            <div className="display-1 fw-bold" style={{ color: '#ff9800' }}>
              {anyCategoryFullyVoted ? currentData?.totalB : '-'}
            </div>
            <h4 className="text-uppercase">{teamB}</h4>
          </div>
        </div>
        <div className="mt-5">
          <div className="winner-badge shadow-lg">
            <h2 className="m-0 fw-bolder text-uppercase">
              {!allVoted
                ? '⏳ ESPERANDO JURADOS...'
                : currentData?.totalA === currentData?.totalB
                ? '⚖️ EMPATE'
                : `🏆 GANADOR: ${currentData?.totalA > currentData?.totalB ? teamA : teamB}`}
            </h2>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResultsTab;
