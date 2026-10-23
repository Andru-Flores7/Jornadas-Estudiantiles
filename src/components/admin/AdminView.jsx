/**
 * AdminView — Orquestador de la vista de administrador.
 *
 * Este componente es intencionalmente liviano: solo gestiona estado de alto nivel
 * (pestaña activa, resultados persistidos) y delega el renderizado a sub-componentes:
 *
 *   - ConfigPanel     → Ajustes del encuentro
 *   - ResultsTab      → Resultados consolidados
 *   - LiveMonitorTab  → Monitoreo de jurados en vivo
 *
 * Para lógica de puntuación ver: src/utils/scoring.js
 * Para generación de PDF ver:    src/components/admin/generatePDF.js
 */
import { useState, useMemo, useEffect } from 'react';
import {
  calculateConsensus,
  calculateFinal,
  isCategoryFullyVoted,
} from '../../utils/scoring';
import ConfigPanel from './ConfigPanel';
import ResultsTab from './ResultsTab';
import LiveMonitorTab from './LiveMonitorTab';
import { generatePDF } from './generatePDF';

const CATEGORIES = ['juegos', 'napolitana', 'popurri', 'mascota', 'ritmo1', 'ritmo2', 'ritmo3', 'videoclip'];

const AdminView = ({ db, onBack, onReset, config, onLogout }) => {
  const teamA = config.teamA;
  const teamB = config.teamB;

  const [viewTab, setViewTab] = useState('results'); // 'results' | 'live'

  // Lista estable de jurados derivada de config
  const jurors = useMemo(() => [
    { id: 'juror1', label: config.jurors.juror1 },
    { id: 'juror2', label: config.jurors.juror2 },
    { id: 'juror3', label: config.jurors.juror3 },
    { id: 'juror4', label: config.jurors.juror4 },
  ], [config]);

  // Cálculos memoizados de consenso y resultados individuales
  const { totalA, totalB, breakdown } = useMemo(
    () => calculateConsensus(db, jurors),
    [db, jurors],
  );

  const jurorResults = useMemo(() =>
    jurors.map((j) => ({
      id: j.id,
      label: j.label,
      result: db[j.id] ? calculateFinal(db[j.id]) : null,
    })),
    [db, jurors],
  );

  const allVoted = useMemo(
    () => jurors.every((j) => db[j.id]?.submitted === true),
    [db, jurors],
  );

  const anyCategoryFullyVoted = useMemo(
    () => CATEGORIES.some((key) => isCategoryFullyVoted(db, jurors, key)),
    [db, jurors],
  );

  // Congela el resultado cuando todos los jurados votan
  const [persistedResults, setPersistedResults] = useState(null);
  useEffect(() => {
    if (allVoted) {
      setPersistedResults({ totalA, totalB, breakdown, jurorResults });
    } else {
      const anyActivity = jurors.some((j) => db[j.id]);
      if (!anyActivity) setPersistedResults(null);
    }
  }, [allVoted, totalA, totalB, breakdown, jurorResults, db, jurors]);

  const showRes = allVoted || anyCategoryFullyVoted || !!persistedResults;
  const currentData = { totalA, totalB, breakdown, jurorResults };

  const handleGeneratePDF = () =>
    generatePDF({ db, jurors, config, jurorResults });

  return (
    <div className="container py-5">
      {/* Barra de acciones */}
      <div className="d-flex justify-content-between mb-4">
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>
            ← Volver al inicio
          </button>
          {onLogout && (
            <button className="btn btn-outline-danger btn-sm" onClick={onLogout}>
              🔒 Cerrar Sesión
            </button>
          )}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-info btn-sm text-white fw-bold px-3" onClick={handleGeneratePDF}>
            📥 Descargar Comprobante PDF
          </button>
          <button className="btn btn-danger btn-sm" onClick={onReset}>
            🧹 Limpiar Evento
          </button>
        </div>
      </div>

      {/* Panel de configuración */}
      <ConfigPanel config={config} />

      <h2 className="text-center fw-bold mb-4 text-uppercase">
        Tablero de Resultados: {teamA} vs {teamB}
      </h2>

      {/* Selector de pestañas */}
      <div className="d-flex justify-content-center mb-5">
        <div className="btn-group p-1" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px' }}>
          {[
            { id: 'results', label: '📊 Resultados Consolidados' },
            { id: 'live',    label: '🟢 Monitoreo de Jurados en Vivo' },
          ].map(({ id, label }) => (
            <button
              key={id}
              className={`btn px-4 py-2 ${viewTab === id ? 'btn-primary shadow-sm' : 'btn-link text-white text-decoration-none'}`}
              style={{ borderRadius: '12px', border: 'none' }}
              onClick={() => setViewTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de la pestaña activa */}
      {viewTab === 'results' ? (
        <ResultsTab
          db={db}
          jurors={jurors}
          config={config}
          currentData={currentData}
          allVoted={allVoted}
          anyCategoryFullyVoted={anyCategoryFullyVoted}
          showRes={showRes}
        />
      ) : (
        <LiveMonitorTab
          db={db}
          jurors={jurors}
          jurorResults={jurorResults}
          config={config}
        />
      )}
    </div>
  );
};

export default AdminView;
