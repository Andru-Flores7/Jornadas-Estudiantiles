/**
 * useSupabaseSync — Hook para sincronizar los datos del jurado con Supabase.
 *
 * Encapsula la lógica de debounce (700ms) para no saturar la base de datos
 * con cada pulsación de tecla. También expone `flushSync` para guardar
 * inmediatamente (p.ej. al presionar "Enviar").
 *
 * @param {React.MutableRefObject} roleRef - Ref con el rol actual del usuario.
 * @returns {{ syncToSupabase, flushSync, isSyncing }}
 */
import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const useSupabaseSync = (roleRef) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimerRef = useRef(null);

  /**
   * Sincronización con debounce: espera 700ms tras el último cambio.
   * Si se llama de nuevo antes del timeout, resetea el contador.
   */
  const syncToSupabase = useCallback((newData) => {
    const currentRole = roleRef.current;
    if (!currentRole || currentRole === 'admin') return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    setIsSyncing(true);

    syncTimerRef.current = setTimeout(async () => {
      try {
        await supabase
          .from('jornadas_scores')
          .upsert({ juror_id: currentRole, payload: newData, updated_at: new Date() });
      } catch (err) {
        console.error('Sync error:', err);
      } finally {
        setIsSyncing(false);
      }
    }, 700);
  }, [roleRef]);

  /**
   * Guarda inmediatamente, cancelando cualquier debounce pendiente.
   * Útil al presionar "Enviar resultados".
   */
  const flushSync = useCallback(async (data) => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    const currentRole = roleRef.current;
    if (!currentRole || currentRole === 'admin') return;

    setIsSyncing(true);
    try {
      await supabase
        .from('jornadas_scores')
        .upsert({ juror_id: currentRole, payload: data, updated_at: new Date() });
    } catch (err) {
      console.error('Flush sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [roleRef]);

  /** Limpia el timer al desmontar el componente padre */
  const clearTimer = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
  }, []);

  return { syncToSupabase, flushSync, clearTimer, isSyncing };
};
