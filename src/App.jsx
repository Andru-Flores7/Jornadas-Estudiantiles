/**
 * App — Componente raíz de la aplicación Jornadas Estudiantiles.
 *
 * Responsabilidades:
 *   1. Determinar el rol activo (null / jurorX / admin)
 *   2. Cargar y sincronizar datos via Supabase (hooks personalizados)
 *   3. Renderizar la vista correspondiente según el rol
 *
 * Estructura de carpetas relevante:
 *   src/
 *   ├── hooks/       → useRealtimeDb, useSupabaseSync
 *   ├── lib/         → supabase.js
 *   ├── config/      → constants.js
 *   ├── utils/       → scoring.js
 *   └── components/
 *       ├── layout/  → GlobalHeader, GlobalFooter, ErrorBoundary
 *       ├── admin/   → AdminView (+ ConfigPanel, ResultsTab, LiveMonitorTab)
 *       ├── juror/   → JurorView
 *       └── ui/      → LoadingSpinner, VoteDot
 */
import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import confetti from 'canvas-confetti';

import GlobalHeader from './components/layout/GlobalHeader';
import GlobalFooter from './components/layout/GlobalFooter';
import ErrorBoundary from './components/layout/ErrorBoundary';
import LoadingSpinner from './components/ui/LoadingSpinner';
import RoleSelection from './components/RoleSelection';

import { useRealtimeDb } from './hooks/useRealtimeDb';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { createInitialJurorState, normalizePayload, initialConfig } from './utils/scoring';

// Lazy-load las vistas pesadas → chunks separados para carga inicial más rápida
const JurorView = lazy(() => import('./components/juror/JurorView'));
const AdminView = lazy(() => import('./components/admin/AdminView'));
const AdminLogin = lazy(() => import('./components/admin/AdminLogin'));

const App = () => {
  const [role, setRole] = useState(null);
  const [jurorData, setJurorData] = useState(createInitialJurorState());
  const [adminSession, setAdminSession] = useState(null);

  // Escuchar cambios de sesión y verificar sesión activa inicial
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAdminSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAdminSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ref estable del rol para que los hooks no se re-creen al cambiar el rol
  const roleRef = useRef(role);
  useEffect(() => { roleRef.current = role; }, [role]);

  // ── Datos en tiempo real desde Supabase ──────────────────────────────────
  const { db, setDb, config, setConfig } = useRealtimeDb({
    createInitialJurorState,
    roleRef,
    onJurorDataReset: () => setJurorData(createInitialJurorState()),
  });

  // ── Sincronización debounced de la planilla del jurado ───────────────────
  const { syncToSupabase, flushSync, clearTimer, isSyncing } = useSupabaseSync(roleRef);

  // Limpia el timer de sync al desmontar
  useEffect(() => () => clearTimer(), [clearTimer]);

  // ── Selección de rol ─────────────────────────────────────────────────────
  const handleSelectRole = useCallback(async (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole !== 'admin') {
      const { data } = await supabase
        .from('jornadas_scores')
        .select('payload')
        .eq('juror_id', selectedRole)
        .single();
      setJurorData(data ? normalizePayload(data.payload) : createInitialJurorState());
    }
  }, []);

  // ── Cierre de sesión de Admin ───────────────────────────────────────────
  const handleAdminLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setAdminSession(null);
    setRole(null);
  }, []);

  // ── Actualización de datos del jurado (con sync debounced) ───────────────
  const handleSetData = useCallback((d) => {
    setJurorData(d);
    syncToSupabase(d);
  }, [syncToSupabase]);

  // ── Envío final de planilla ──────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const currentRole = roleRef.current;
    if (!currentRole || currentRole === 'admin') return;

    const finalData = { ...jurorData, submitted: true };
    setJurorData(finalData);
    await flushSync(finalData);

    try {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      console.warn('Confetti error:', err);
    }
    alert('¡Resultados enviados con éxito!');
  }, [jurorData, flushSync]);

  // ── Reset total del evento (solo Admin) ──────────────────────────────────
  const handleReset = useCallback(async () => {
    if (!window.confirm('¿ESTÁS SEGURO? Esto borrará TODOS los puntos y RESETEARÁ los nombres a sus valores por defecto.')) return;
    const { error } = await supabase
      .from('jornadas_scores')
      .delete()
      .neq('juror_id', 'null_check');
    if (!error) {
      setDb({ juror1: null, juror2: null, juror3: null, juror4: null });
      setConfig(initialConfig);
      alert('Sistema reseteado completamente.');
    }
  }, [setDb, setConfig]);

  // ── Renderizado según rol ────────────────────────────────────────────────
  let content;
  if (!role) {
    content = <RoleSelection onSelect={handleSelectRole} config={config} />;
  } else if (role === 'admin') {
    if (!adminSession) {
      content = (
        <AdminLogin
          onLoginSuccess={(session) => setAdminSession(session)}
          onCancel={() => setRole(null)}
        />
      );
    } else {
      content = (
        <AdminView
          db={db}
          onBack={() => setRole(null)}
          onReset={handleReset}
          config={config}
          onLogout={handleAdminLogout}
        />
      );
    }
  } else {
    content = (
      <JurorView
        role={role}
        data={jurorData}
        config={config}
        setData={handleSetData}
        onSave={handleSave}
        onBack={() => setRole(null)}
        isSyncing={isSyncing}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-vh-100 d-flex flex-column">
        <GlobalHeader />
        <div className="flex-grow-1">
          <Suspense fallback={<LoadingSpinner />}>
            {content}
          </Suspense>
        </div>
        <GlobalFooter />
      </div>
    </ErrorBoundary>
  );
};

export default App;
