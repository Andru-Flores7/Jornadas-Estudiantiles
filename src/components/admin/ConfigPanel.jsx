/**
 * ConfigPanel — Panel de configuración del encuentro (Admin).
 *
 * Permite al administrador cambiar el número de encuentro,
 * los nombres de los equipos y los nombres de los jurados,
 * y sincronizarlos en tiempo real via Supabase.
 *
 * @param {{ config, onSave }} props
 */
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const ConfigPanel = ({ config, onSaved }) => {
  const [editConfig, setEditConfig] = useState(config);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await supabase.from('jornadas_scores').upsert({
      juror_id: 'config',
      payload: editConfig,
      updated_at: new Date(),
    });
    setIsSaving(false);
    onSaved?.();
    alert('Configuración actualizada y sincronizada.');
  };

  return (
    <div
      className="card shadow-sm border-0 p-4 mb-5"
      style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.05)' }}
    >
      <h4 className="fw-bold mb-4 text-primary">⚙️ Ajustes del Encuentro</h4>
      <div className="row g-3">
        {/* Número de encuentro */}
        <div className="col-md-2">
          <label className="form-label small fw-bold">N° Encuentro</label>
          <input
            type="text"
            className="form-control"
            value={editConfig.matchNo}
            onChange={(e) => setEditConfig({ ...editConfig, matchNo: e.target.value })}
          />
        </div>

        {/* Nombres de equipos */}
        <div className="col-md-5">
          <label className="form-label small fw-bold">Nombre Equipo A</label>
          <input
            type="text"
            className="form-control"
            value={editConfig.teamA}
            onChange={(e) => setEditConfig({ ...editConfig, teamA: e.target.value })}
          />
        </div>
        <div className="col-md-5">
          <label className="form-label small fw-bold">Nombre Equipo B</label>
          <input
            type="text"
            className="form-control"
            value={editConfig.teamB}
            onChange={(e) => setEditConfig({ ...editConfig, teamB: e.target.value })}
          />
        </div>

        {/* Nombres de jurados */}
        {['juror1', 'juror2', 'juror3', 'juror4'].map((id, i) => (
          <div className="col-md-4" key={id}>
            <label className="form-label small fw-bold">Nombre Jurado {i + 1}</label>
            <input
              type="text"
              className="form-control"
              value={editConfig.jurors[id]}
              onChange={(e) =>
                setEditConfig({
                  ...editConfig,
                  jurors: { ...editConfig.jurors, [id]: e.target.value },
                })
              }
            />
          </div>
        ))}

        <div className="col-12 mt-3">
          <button
            className="btn btn-primary w-100 fw-bold"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Guardando...' : '💾 Guardar y Sincronizar Nombres'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
