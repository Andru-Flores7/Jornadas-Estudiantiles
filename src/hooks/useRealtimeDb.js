/**
 * useRealtimeDb — Hook que maneja la suscripción realtime de Supabase
 * y la carga inicial de datos desde la tabla `jornadas_scores`.
 *
 * Devuelve el estado `db` (datos por jurado) y `config` (configuración del encuentro),
 * y expone helpers para resetear desde el componente padre.
 *
 * @param {object} initialConfig - Configuración por defecto (ver utils/scoring.js)
 * @param {function} createInitialJurorState - Factory del estado inicial del jurado
 * @param {React.MutableRefObject} roleRef - Ref del rol activo (para invalidar jurorData si se elimina)
 * @param {function} onJurorDataReset - Callback llamado cuando el jurado activo es eliminado remotamente
 * @returns {{ db, setDb, config, setConfig }}
 */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { normalizePayload, initialConfig as defaultConfig } from '../utils/scoring';

export const useRealtimeDb = ({ createInitialJurorState, roleRef, onJurorDataReset }) => {
  const [db, setDb] = useState({ juror1: null, juror2: null, juror3: null, juror4: null });
  const [config, setConfig] = useState(defaultConfig);

  useEffect(() => {
    // ── Carga inicial ──────────────────────────────────────────────────────
    const fetchData = async () => {
      const { data } = await supabase.from('jornadas_scores').select('*');
      if (!data) return;

      const newDb = { juror1: null, juror2: null, juror3: null, juror4: null };
      data.forEach((row) => {
        if (row.juror_id === 'config') {
          setConfig(row.payload);
        } else {
          const parsed = normalizePayload(row.payload);
          if (parsed) parsed.updated_at = row.updated_at;
          newDb[row.juror_id] = parsed;
        }
      });
      setDb(newDb);
    };
    fetchData();

    // ── Suscripción realtime ───────────────────────────────────────────────
    const channel = supabase
      .channel('jornadas_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jornadas_scores' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldJurorId = payload.old.juror_id;
            if (oldJurorId === 'config') {
              setConfig(defaultConfig);
            } else {
              setDb((prev) => ({ ...prev, [oldJurorId]: null }));
              // Si el jurado activo fue eliminado, reseteamos su planilla local
              if (roleRef.current === oldJurorId) {
                onJurorDataReset();
              }
            }
            return;
          }

          const { juror_id: newJurorId, payload: newPayload, updated_at: updatedAt } = payload.new;

          if (newJurorId === 'config') {
            setConfig(newPayload);
          } else {
            const parsed = normalizePayload(newPayload);
            if (parsed) parsed.updated_at = updatedAt;
            setDb((prev) => ({ ...prev, [newJurorId]: parsed }));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Sin dependencias: roleRef y callbacks son estables

  return { db, setDb, config, setConfig };
};
