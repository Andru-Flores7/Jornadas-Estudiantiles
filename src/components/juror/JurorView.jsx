/**
 * JurorView — Planilla de votación para el jurado.
 *
 * Orquesta todas las secciones de la planilla:
 *   1. Header con info del encuentro
 *   2. Juegos (6 pts c/u)
 *   3. Popurrí Alternativo (4 pts)
 *   4. Popurrí Mascota (3 pts)
 *   5. Ritmo 1, 2 y 3 (4 pts c/u, criterios 1-5)
 *   6. Videoclip (15 pts, criterios 1-8)
 *   7. Napolitana (4 pts)
 *   8. Footer fijo con totales y botón de envío
 *
 * Para la lógica de cálculo de puntajes ver: src/utils/scoring.js
 * Para las constantes de criterios ver:      src/config/constants.js
 */
import { useMemo } from 'react';
import { calculateFinal } from '../../utils/scoring';
import { RITMO_CRITERIA, VIDEOCLIP_CRITERIA } from '../../config/constants';

// ── Sub-secciones ────────────────────────────────────────────────────────────

/**
 * ScoringTableSection — Tabla de criterios numéricos para Ritmos y Videoclip.
 * Usada por la sección de Ritmos (max=5) y Videoclip (max=8).
 */
const ScoringTableSection = ({ data, section, teamLabel, team, criteria, max, prizePtKey, onScoreChange }) => (
  <table className="table table-sm table-bordered text-center">
    <tbody>
      {criteria.map((c) => (
        <tr key={c.key}>
          <td className="text-start small opacity-75">{c.label}</td>
          <td>
            <input
              type="number"
              min="1"
              max={max}
              className="form-control form-control-sm text-center mx-auto"
              value={data[section][team][c.key]}
              onChange={(e) => onScoreChange(section, team, c.key, e.target.value, max)}
            />
          </td>
        </tr>
      ))}
      <tr className="table-warning">
        <td>Suma</td>
        <td>{Object.values(data[section][team]).reduce((a, v) => a + (Number(v) || 0), 0)}</td>
      </tr>
      <tr className="table-success">
        <td>Ganador</td>
        <td>{prizePtKey}</td>
      </tr>
    </tbody>
  </table>
);

// ── Componente principal ─────────────────────────────────────────────────────

const JurorView = ({ role, data, config, setData, onSave, onBack, isSyncing }) => {
  const calc = useMemo(() => calculateFinal(data), [data]);

  // Actualiza un campo de puntuación numérica validando el rango permitido
  const handleScoreChange = (section, team, criterion, value, max) => {
    if (value === '') {
      setData({ ...data, [section]: { ...data[section], [team]: { ...data[section][team], [criterion]: '' } }, submitted: false });
      return;
    }
    const val = parseInt(value, 10);
    if (!isNaN(val) && val >= 1 && val <= max) {
      setData({ ...data, [section]: { ...data[section], [team]: { ...data[section][team], [criterion]: val.toString() } }, submitted: false });
    }
  };

  // Alterna el ganador de un ítem binario (Juegos, Popurrí, Mascota)
  const toggleBinary = (arrayKey, index, team) => {
    const next = [...data[arrayKey]];
    next[index] = next[index] === team ? null : team;
    setData({ ...data, [arrayKey]: next, submitted: false });
  };

  const teamA = config.teamA;
  const teamB = config.teamB;

  return (
    <div className="container-fluid py-4 min-vh-100 pb-5">

      {/* ── Barra de navegación ── */}
      <div className="card d-flex flex-row justify-content-between align-items-center mb-4 p-3 border-0">
        <button className="btn btn-sm btn-outline-light opacity-75" onClick={onBack}>
          <span className="me-1">←</span>
        </button>
        <h5 className="m-0 fw-bold text-uppercase" style={{ fontSize: '18px' }}>
          <span className="text-primary">Planilla</span> {config.jurors[role]}
        </h5>
        <div className="badge bg-success">
          {isSyncing ? 'Sincronizando...' : 'Conectado'}
        </div>
      </div>

      {/* ── Info del encuentro ── */}
      <header
        className="card border-0 mb-4 p-4 text-white"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(186,139,2,0.15))', backdropFilter: 'blur(10px)' }}
      >
        <div className="row g-4 align-items-end text-center">
          {[
            { label: 'Encuentro', value: `#${config.matchNo}` },
            { label: 'Equipo A',  value: teamA },
            { label: 'Equipo B',  value: teamB },
          ].map(({ label, value }) => (
            <div key={label} className="col-md-4">
              <label className="form-label small text-uppercase fw-bold opacity-75 mb-1">{label}</label>
              <div className="h3 m-0 fw-bold">{value}</div>
            </div>
          ))}
        </div>
      </header>

      <main className="row g-4">

        {/* ── SECCIÓN: Juegos ── */}
        <section className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white fw-bold">JUEGOS (6 pts c/u)</div>
            <div className="card-body p-0">
              <table className="table table-bordered text-center m-0">
                <thead>
                  <tr>
                    <th>Juego</th>
                    <th>{teamA}</th>
                    <th>{teamB}</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2].map((i) => (
                    <tr key={i}>
                      <td>#{i + 1}</td>
                      {['A', 'B'].map((team) => (
                        <td key={team}>
                          <button
                            className={`btn btn-lg ${data.juegos[i] === team ? 'btn-success' : 'btn-light'}`}
                            onClick={() => toggleBinary('juegos', i, team)}
                          >
                            X
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── SECCIÓN: Popurrí Alternativo ── */}
        <section className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white fw-bold">POPURRÍ ALTERNATIVO (4 pts)</div>
            <div className="card-body p-0 overflow-auto">
              <table className="table table-bordered text-center m-0">
                <thead>
                  <tr>
                    <th>Equipo</th>
                    {[...Array(11)].map((_, i) => <th key={i}>{i + 1}</th>)}
                    <th>Ganador Popurrí Alternativo</th>
                  </tr>
                </thead>
                <tbody>
                  {['A', 'B'].map((team) => (
                    <tr key={team}>
                      <td>{team === 'A' ? teamA : teamB}</td>
                      {data.popurri.map((v, i) => (
                        <td key={i}>
                          <button
                            className={`btn btn-sm ${v === team ? 'btn-primary' : 'btn-light'}`}
                            style={{ width: '30px' }}
                            onClick={() => toggleBinary('popurri', i, team)}
                          >
                            X
                          </button>
                        </td>
                      ))}
                      <td className="fw-bold">{team === 'A' ? calc.prizePopA : calc.prizePopB}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── SECCIÓN: Popurrí Mascota ── */}
        <section className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white fw-bold">POPURRÍ ALTERNATIVO DE LA MASCOTA (3 pts)</div>
            <div className="card-body p-0 overflow-auto">
              <table className="table table-bordered text-center m-0">
                <thead>
                  <tr>
                    <th>Equipo</th>
                    {[...Array(5)].map((_, i) => <th key={i}>{i + 1}</th>)}
                    <th>Ganador Popurrí Mascota</th>
                  </tr>
                </thead>
                <tbody>
                  {['A', 'B'].map((team) => {
                    const mascotaList = Array.isArray(data.mascota) ? [...data.mascota] : [];
                    while (mascotaList.length < 5) mascotaList.push(null);
                    const finalMascota = mascotaList.slice(0, 5);
                    return (
                      <tr key={team}>
                        <td>{team === 'A' ? teamA : teamB}</td>
                        {finalMascota.map((v, i) => (
                          <td key={i}>
                            <button
                              className={`btn btn-sm ${v === team ? 'btn-primary' : 'btn-light'}`}
                              style={{ width: '30px' }}
                              onClick={() => {
                                const n = [...finalMascota];
                                n[i] = n[i] === team ? null : team;
                                setData({ ...data, mascota: n, submitted: false });
                              }}
                            >
                              X
                            </button>
                          </td>
                        ))}
                        <td className="fw-bold">{team === 'A' ? calc.prizeMasA : calc.prizeMasB}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── SECCIÓN: Ritmos 1, 2 y 3 ── */}
        {['ritmo1', 'ritmo2', 'ritmo3'].map((rit, idx) => (
          <section className="col-lg-4 col-md-6" key={rit}>
            <div className="card shadow-sm border-0">
              <div className="card-header text-white fw-bold">
                POPURRÍ SELECCIONADO <em>RITMO {idx + 1}</em> (1-5 por ítem) | 4 pts
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {['A', 'B'].map((team) => {
                    const prizeKeys = [
                      [calc.prizeR1A, calc.prizeR1B],
                      [calc.prizeR2A, calc.prizeR2B],
                      [calc.prizeR3A, calc.prizeR3B],
                    ];
                    const prize = team === 'A' ? prizeKeys[idx][0] : prizeKeys[idx][1];
                    return (
                      <div className="col-6" key={team}>
                        <h6 className="small text-uppercase fw-bold opacity-75">
                          {team === 'A' ? teamA : teamB}
                        </h6>
                        <ScoringTableSection
                          data={data}
                          section={rit}
                          team={team}
                          teamLabel={team === 'A' ? teamA : teamB}
                          criteria={RITMO_CRITERIA}
                          max={5}
                          prizePtKey={prize}
                          onScoreChange={handleScoreChange}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* ── SECCIÓN: Videoclip ── */}
        <section className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white fw-bold">VIDEOCLIP (1-8 por ítem) | 15 pts</div>
            <div className="card-body">
              <div className="row g-4">
                {['A', 'B'].map((team) => (
                  <div className="col-md-6" key={team}>
                    <h6>{team === 'A' ? teamA : teamB}</h6>
                    <table className="table table-sm table-bordered text-center">
                      <tbody>
                        {VIDEOCLIP_CRITERIA.map((c) => (
                          <tr key={c.key}>
                            <td className="text-start small">{c.label}</td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                max="8"
                                className="form-control form-control-sm text-center mx-auto"
                                value={data.videoclip[team][c.key]}
                                onChange={(e) => handleScoreChange('videoclip', team, c.key, e.target.value, 8)}
                              />
                            </td>
                          </tr>
                        ))}
                        <tr className="table-warning">
                          <td>Suma</td>
                          <td>{team === 'A' ? calc.sumVidA : calc.sumVidB}</td>
                        </tr>
                        <tr className="table-success">
                          <td>Ganador Video Clip</td>
                          <td>{team === 'A' ? calc.prizeVidA : calc.prizeVidB}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECCIÓN: Napolitana ── */}
        <section className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white fw-bold">NAPOLITANA (Lienzo Gigante) — Elegir Ganador</div>
            <div className="card-body">
              <p className="small opacity-75 mb-3">
                Selecciona el equipo con mejor napolitana. Solo se puede elegir uno.
              </p>
              <div className="d-flex gap-3 justify-content-center">
                {['A', 'B'].map((team) => (
                  <button
                    key={team}
                    className={`btn btn-lg fw-bold px-5 py-3 ${data.napolitana === team ? 'btn-success' : 'btn-outline-secondary'}`}
                    style={{ minWidth: '160px', borderRadius: '16px', fontSize: '1.1rem' }}
                    onClick={() => setData({ ...data, napolitana: data.napolitana === team ? null : team, submitted: false })}
                  >
                    {team === 'A' ? teamA : teamB}
                    {data.napolitana === team && ' ✓'}
                  </button>
                ))}
              </div>
              {data.napolitana && (
                <div className="text-center mt-3">
                  <span className="badge bg-success px-3 py-2" style={{ fontSize: '0.9rem' }}>
                    🎨 Ganador: {data.napolitana === 'A' ? teamA : teamB}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer fijo: totales + botón enviar ── */}
      <footer className="fixed-bottom py-3 px-4">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex gap-4 align-items-center">
            {[{ name: teamA, total: calc.totalA }, { name: teamB, total: calc.totalB }].map(({ name, total }, i, arr) => (
              <>
                <div key={name} className="text-center">
                  <div className="small text-uppercase opacity-50 fw-bold" style={{ fontSize: '0.65rem' }}>{name}</div>
                  <div className="h5 m-0 fw-bold text-primary">{total}</div>
                </div>
                {i < arr.length - 1 && <div className="vr h-100 opacity-25" />}
              </>
            ))}
          </div>
          <button
            className="btn btn-success fw-bold shadow-sm"
            style={{ borderRadius: '20px', fontSize: '10px' }}
            onClick={onSave}
          >
            🚀 ENVIAR RESULTADOS
          </button>
        </div>
      </footer>
    </div>
  );
};

export default JurorView;
