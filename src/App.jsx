import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { supabase } from "./supabase";
import confetti from "canvas-confetti";
import GlobalHeader from "./components/GlobalHeader";
import GlobalFooter from "./components/GlobalFooter";
import RoleSelection from "./components/RoleSelection";
import ErrorBoundary from "./components/ErrorBoundary";
import {
  createInitialJurorState,
  normalizePayload,
  initialConfig,
} from "./utils/scoring";

// Lazy-load heavy views — split into separate chunks for faster initial load
const JurorView = lazy(() => import("./components/JurorView"));
const AdminView = lazy(() => import("./components/AdminView"));

const LoadingSpinner = () => (
  <div className="d-flex align-items-center justify-content-center min-vh-100">
    <div className="text-center">
      <div
        className="spinner-border mb-3"
        role="status"
        style={{ color: "#ba8b02", width: "3rem", height: "3rem" }}
      />
      <div className="text-white opacity-75 fw-bold">Cargando...</div>
    </div>
  </div>
);

const App = () => {
  const [role, setRole] = useState(null);
  const [jurorData, setJurorData] = useState(createInitialJurorState());
  const [db, setDb] = useState({ juror1: null, juror2: null, juror3: null });
  const [config, setConfig] = useState(initialConfig);
  const [isSyncing, setIsSyncing] = useState(false);

  // Ref to hold the debounce timer for Supabase sync
  const syncTimerRef = useRef(null);
  // Ref to keep the latest role value accessible inside debounced callback
  const roleRef = useRef(role);
  useEffect(() => { roleRef.current = role; }, [role]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from("jornadas_scores").select("*");
      if (data) {
        const newDb = { juror1: null, juror2: null, juror3: null };
        data.forEach((row) => {
          if (row.juror_id === "config") {
            setConfig(row.payload);
          } else {
            const parsed = normalizePayload(row.payload);
            if (parsed) {
              parsed.updated_at = row.updated_at;
            }
            newDb[row.juror_id] = parsed;
          }
        });
        setDb(newDb);
      }
    };
    fetchData();

    const channel = supabase
      .channel("jornadas_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jornadas_scores" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldJurorId = payload.old.juror_id;
            if (oldJurorId === "config") {
              setConfig(initialConfig);
            } else {
              setDb((prev) => ({ ...prev, [oldJurorId]: null }));
              if (roleRef.current === oldJurorId) {
                setJurorData(createInitialJurorState());
              }
            }
            return;
          }

          const newJurorId = payload.new.juror_id;
          const newPayload = payload.new.payload;
          const updatedAt = payload.new.updated_at;

          if (newJurorId === "config") {
            setConfig(newPayload);
          } else {
            const parsed = normalizePayload(newPayload);
            if (parsed) {
              parsed.updated_at = updatedAt;
            }
            setDb((prev) => ({ ...prev, [newJurorId]: parsed }));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Clear any pending sync on unmount
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []); // No dependency on `role` — use ref instead to avoid channel restarts

  // Debounced sync: waits 700ms after last change before hitting Supabase
  const syncToSupabase = useCallback((newData) => {
    const currentRole = roleRef.current;
    if (!currentRole || currentRole === "admin") return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    setIsSyncing(true);

    syncTimerRef.current = setTimeout(async () => {
      try {
        await supabase
          .from("jornadas_scores")
          .upsert({ juror_id: currentRole, payload: newData, updated_at: new Date() });
      } catch (err) {
        console.error("Sync error:", err);
      } finally {
        setIsSyncing(false);
      }
    }, 700);
  }, []);

  const handleSelectRole = useCallback(async (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole !== "admin") {
      const { data } = await supabase
        .from("jornadas_scores")
        .select("payload")
        .eq("juror_id", selectedRole)
        .single();
      if (data) setJurorData(normalizePayload(data.payload));
      else setJurorData(createInitialJurorState());
    }
  }, []);

  const handleSave = useCallback(async () => {
    // Cancel any pending debounced sync and immediately flush
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    const currentRole = roleRef.current;
    if (!currentRole || currentRole === "admin") return;

    const finalData = { ...jurorData, submitted: true };
    setJurorData(finalData);
    setIsSyncing(true);
    try {
      await supabase
        .from("jornadas_scores")
        .upsert({ juror_id: currentRole, payload: finalData, updated_at: new Date() });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSyncing(false);
    }

    try {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      console.warn("Confetti error:", err);
    }

    alert("¡Resultados enviados con éxito!");
  }, [jurorData]);

  const handleReset = useCallback(async () => {
    if (
      window.confirm(
        "¿ESTÁS SEGURO? Esto borrará TODOS los puntos y RESETEARÁ los nombres a sus valores por defecto.",
      )
    ) {
      const { error } = await supabase
        .from("jornadas_scores")
        .delete()
        .neq("juror_id", "null_check");
      if (!error) {
        setDb({ juror1: null, juror2: null, juror3: null });
        setConfig(initialConfig);
        alert("Sistema reseteado completamente.");
      }
    }
  }, []);

  // Stable setData callback — avoids creating a new fn on every render
  const handleSetData = useCallback((d) => {
    setJurorData(d);
    syncToSupabase(d);
  }, [syncToSupabase]);

  let content;
  if (!role) {
    content = <RoleSelection onSelect={handleSelectRole} config={config} />;
  } else if (role === "admin") {
    content = (
      <AdminView
        db={db}
        onBack={() => setRole(null)}
        onReset={handleReset}
        config={config}
      />
    );
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
