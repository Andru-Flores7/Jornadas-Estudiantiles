import React, { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import confetti from "canvas-confetti";
import GlobalHeader from "./components/GlobalHeader";
import GlobalFooter from "./components/GlobalFooter";

// --- INITIAL STATE ---
const createInitialJurorState = () => ({
  submitted: false,
  header: { jury: "", matchNo: "", teamA: "Equipo A", teamB: "Equipo B" },
  juegos: Array(3).fill(null),
  popurri: Array(10).fill(null),
  mascota: Array(4).fill(null),
  ritmo1: {
    A: {
      vestimenta: "",
      originalidad: "",
      desplazamiento: "",
      coordinacion: "",
      "conexion en pareja": "",
    },
    B: {
      vestimenta: "",
      originalidad: "",
      desplazamiento: "",
      coordinacion: "",
      "conexion en pareja": "",
    },
  },
  ritmo2: {
    A: {
      vestimenta: "",
      originalidad: "",
      desplazamiento: "",
      coordinacion: "",
      "conexion en pareja": "",
    },
    B: {
      vestimenta: "",
      originalidad: "",
      desplazamiento: "",
      coordinacion: "",
      "conexion en pareja": "",
    },
  },
  videoclip: {
    A: {
      "cordinacion coreografica": "",
      "composicion coreografica": "",
      "adaptacion al tiempo musical": "",
      "uso del espacio": "",
      "impacto visual": "",
      carisma: "",
    },
    B: {
      "cordinacion coreografica": "",
      "composicion coreografica": "",
      "adaptacion al tiempo musical": "",
      "uso del espacio": "",
      "impacto visual": "",
      carisma: "",
    },
  },
});

const initialConfig = {
  teamA: "Equipo A",
  teamB: "Equipo B",
  matchNo: "1",
  jurors: {
    juror1: "Jurado 1",
    juror2: "Jurado 2",
    juror3: "Jurado 3",
  },
};

const calculateFinal = (data) => {
  if (!data) return { a: 0, b: 0 };
  const ptsJuegosA = data.juegos.filter((v) => v === "A").length * 6;
  const ptsJuegosB = data.juegos.filter((v) => v === "B").length * 6;

  const countPopA = data.popurri.filter((v) => v === "A").length,
    countPopB = data.popurri.filter((v) => v === "B").length;
  const prizePopA = countPopA > countPopB && countPopA > 0 ? 4 : 0;
  const prizePopB = countPopB > countPopA && countPopB > 0 ? 4 : 0;

  const countMasA = data.mascota.filter((v) => v === "A").length,
    countMasB = data.mascota.filter((v) => v === "B").length;
  const prizeMasA = countMasA > countMasB && countMasA > 0 ? 3 : 0;
  const prizeMasB = countMasB > countMasA && countMasB > 0 ? 3 : 0;

  const sumR1A = Object.values(data.ritmo1.A).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const sumR1B = Object.values(data.ritmo1.B).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const prizeR1A = sumR1A > sumR1B && sumR1A > 0 ? 4 : 0;
  const prizeR1B = sumR1B > sumR1A && sumR1B > 0 ? 4 : 0;

  const sumR2A = Object.values(data.ritmo2.A).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const sumR2B = Object.values(data.ritmo2.B).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const prizeR2A = sumR2A > sumR2B && sumR2A > 0 ? 4 : 0;
  const prizeR2B = sumR2B > sumR2A && sumR2B > 0 ? 4 : 0;

  const sumVidA = Object.values(data.videoclip.A).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const sumVidB = Object.values(data.videoclip.B).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const prizeVidA = sumVidA > sumVidB && sumVidA > 0 ? 15 : 0;
  const prizeVidB = sumVidB > sumVidA && sumVidB > 0 ? 15 : 0;

  return {
    ptsJuegosA,
    ptsJuegosB,
    prizePopA,
    prizePopB,
    prizeMasA,
    prizeMasB,
    prizeR1A,
    prizeR1B,
    prizeR2A,
    prizeR2B,
    sumVidA,
    sumVidB,
    prizeVidA,
    prizeVidB,
    totalA:
      ptsJuegosA + prizePopA + prizeMasA + prizeR1A + prizeR2A + prizeVidA,
    totalB:
      ptsJuegosB + prizePopB + prizeMasB + prizeR1B + prizeR2B + prizeVidB,
  };
};

const calculateConsensus = (db, jurors) => {
  const submittedIds = jurors
    .filter((j) => db[j.id]?.submitted)
    .map((j) => j.id);
  if (submittedIds.length === 0)
    return {
      totalA: 0,
      totalB: 0,
      breakdown: {
        juegosA: 0,
        juegosB: 0,
        popA: 0,
        popB: 0,
        masA: 0,
        masB: 0,
        r1A: 0,
        r1B: 0,
        r2A: 0,
        r2B: 0,
        vidA: 0,
        vidB: 0,
      },
    };

  const individualResults = submittedIds.map((id) => calculateFinal(db[id]));

  // 1. Juegos (6 pts por juego, por mayoría)
  let juegosA = 0,
    juegosB = 0;
  const individualGames = [];
  for (let i = 0; i < 3; i++) {
    let votesA = 0,
      votesB = 0;
    submittedIds.forEach((id) => {
      if (db[id].juegos[i] === "A") votesA++;
      if (db[id].juegos[i] === "B") votesB++;
    });
    const gameWinner = votesA > votesB ? "A" : votesB > votesA ? "B" : null;
    if (gameWinner === "A") juegosA += 6;
    else if (gameWinner === "B") juegosB += 6;
    individualGames.push(gameWinner);
  }

  // 2. Función genérica para premios por mayoría
  const getConsensusPrize = (keyA, keyB, points) => {
    let winA = 0,
      winB = 0;
    individualResults.forEach((r) => {
      if (r[keyA] > r[keyB]) winA++;
      else if (r[keyB] > r[keyA]) winB++;
    });
    if (winA > winB) return { a: points, b: 0 };
    if (winB > winA) return { a: 0, b: points };
    return { a: 0, b: 0 };
  };

  const pop = getConsensusPrize("prizePopA", "prizePopB", 4);
  const mas = getConsensusPrize("prizeMasA", "prizeMasB", 3);
  const r1 = getConsensusPrize("prizeR1A", "prizeR1B", 4);
  const r2 = getConsensusPrize("prizeR2A", "prizeR2B", 4);
  const vidPrize = getConsensusPrize("prizeVidA", "prizeVidB", 15);

  const breakdown = {
    juegosA,
    juegosB,
    individualGames, // [A, B, null]
    popA: pop.a,
    popB: pop.b,
    masA: mas.a,
    masB: mas.b,
    r1A: r1.a,
    r1B: r1.b,
    r2A: r2.a,
    r2B: r2.b,
    vidA: vidPrize.a,
    vidB: vidPrize.b,
  };

  return {
    totalA: juegosA + pop.a + mas.a + r1.a + r2.a + breakdown.vidA,
    totalB: juegosB + pop.b + mas.b + r1.b + r2.b + breakdown.vidB,
    breakdown,
  };
};

const App = () => {
  const [role, setRole] = useState(null);
  const [jurorData, setJurorData] = useState(createInitialJurorState());
  const [db, setDb] = useState({ juror1: null, juror2: null, juror3: null });
  const [config, setConfig] = useState(initialConfig);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from("jornadas_scores").select("*");
      if (data) {
        const newDb = { juror1: null, juror2: null, juror3: null };
        data.forEach((row) => {
          if (row.juror_id === "config") {
            setConfig(row.payload);
          } else {
            newDb[row.juror_id] = row.payload;
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
              if (role === oldJurorId) {
                setJurorData(createInitialJurorState());
              }
            }
            return;
          }

          const newJurorId = payload.new.juror_id;
          const newPayload = payload.new.payload;

          if (newJurorId === "config") {
            setConfig(newPayload);
          } else {
            setDb((prev) => ({ ...prev, [newJurorId]: newPayload }));
          }
        },
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [role]);

  const syncToSupabase = async (newData) => {
    if (!role || role === "admin") return;
    setIsSyncing(true);
    await supabase
      .from("jornadas_scores")
      .upsert({ juror_id: role, payload: newData, updated_at: new Date() });
    setIsSyncing(false);
  };

  const handleSelectRole = async (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole !== "admin") {
      const { data } = await supabase
        .from("jornadas_scores")
        .select("payload")
        .eq("juror_id", selectedRole)
        .single();
      if (data) setJurorData(data.payload);
      else setJurorData(createInitialJurorState());
    }
  };

  const handleSave = async () => {
    const finalData = { ...jurorData, submitted: true };
    setJurorData(finalData);
    await syncToSupabase(finalData);
    alert("¡Resultados enviados con éxito!");
  };

  const handleReset = async () => {
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
  };

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
        setData={(d) => {
          setJurorData(d);
          syncToSupabase(d);
        }}
        onSave={handleSave}
        onBack={() => setRole(null)}
        isSyncing={isSyncing}
      />
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      <GlobalHeader />
      <div className="flex-grow-1">{content}</div>
      <GlobalFooter />
    </div>
  );
};

// --- COMPONENTES ---
const RoleSelection = ({ onSelect, config }) => (
  <div className="container d-flex align-items-center justify-content-center min-vh-100">
    <div
      className="card shadow-lg p-5 text-center border-0"
      style={{ maxWidth: "600px", width: "100%", borderRadius: "24px" }}
    >
      <h1 className="fw-bold text-primary mb-4">Jornadas Estudiantiles 2026</h1>
      <div className="row g-3">
        {["juror1", "juror2", "juror3"].map((id) => (
          <div className="col-12" key={id}>
            <button
              className="btn btn-outline-primary btn-lg w-100 py-3 fw-bold"
              onClick={() => onSelect(id)}
            >
              Acceso {config.jurors[id]}
            </button>
          </div>
        ))}
        <div className="col-12 mt-3">
          <button
            className="btn btn-dark btn-lg w-100 py-3 fw-bold shadow"
            onClick={() => onSelect("admin")}
          >
            🛡️ Administrador
          </button>
        </div>
      </div>
    </div>
  </div>
);

const JurorView = ({
  role,
  data,
  config,
  setData,
  onSave,
  onBack,
  isSyncing,
}) => {
  const calc = useMemo(() => calculateFinal(data), [data]);

  const handleScoreChange = (section, team, criterion, value, max) => {
    if (value === "" || (Number(value) >= 1 && Number(value) <= max)) {
      setData({
        ...data,
        [section]: {
          ...data[section],
          [team]: { ...data[section][team], [criterion]: value },
        },
      });
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100 pb-5">
      <div className="card d-flex flex-row justify-content-between align-items-center mb-4 p-3 border-0">
        <button
          className="btn btn-sm btn-outline-light opacity-75"
          onClick={onBack}
        >
          <span className="me-1">←</span> Volver
        </button>
        <h5 className="m-0 fw-bold text-uppercase tracking-wider">
          <span className="text-primary">Planilla</span> {config.jurors[role]}
        </h5>
        <div className="badge bg-success">
          {isSyncing ? "Sincronizando..." : "Conectado"}
        </div>
      </div>

      <header
        className="card border-0 mb-4 p-4 text-white"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(186, 139, 2, 0.15))",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="row g-4 align-items-end text-center">
          <div className="col-md-2">
            <label className="form-label small text-uppercase fw-bold opacity-75 mb-1">
              Encuentro
            </label>
            <div className="h3 m-0 fw-bold">#{config.matchNo}</div>
          </div>
          <div className="col-md-5">
            <label className="form-label small text-uppercase fw-bold opacity-75 mb-1">
              Equipo A
            </label>
            <div className="h3 m-0 fw-bold">{config.teamA}</div>
          </div>
          <div className="col-md-5">
            <label className="form-label small text-uppercase fw-bold opacity-75 mb-1">
              Equipo B
            </label>
            <div className="h3 m-0 fw-bold">{config.teamB}</div>
          </div>
        </div>
      </header>

      <main className="row g-4">
        {/* JUEGOS */}
        <section className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white fw-bold">
              JUEGOS (6 pts c/u)
            </div>
            <div className="card-body p-0">
              <table className="table table-bordered text-center m-0">
                <thead>
                  <tr>
                    <th>Juego</th>
                    <th>{config.teamA}</th>
                    <th>{config.teamB}</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2].map((i) => (
                    <tr key={i}>
                      <td>#{i + 1}</td>
                      <td>
                        <button
                          className={`btn btn-lg ${data.juegos[i] === "A" ? "btn-success" : "btn-light"}`}
                          onClick={() => {
                            const n = [...data.juegos];
                            n[i] = n[i] === "A" ? null : "A";
                            setData({ ...data, juegos: n });
                          }}
                        >
                          X
                        </button>
                      </td>
                      <td>
                        <button
                          className={`btn btn-lg ${data.juegos[i] === "B" ? "btn-success" : "btn-light"}`}
                          onClick={() => {
                            const n = [...data.juegos];
                            n[i] = n[i] === "B" ? null : "B";
                            setData({ ...data, juegos: n });
                          }}
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        {/* POPURRI */}
        <section className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white fw-bold">
              POPURRÍ ALTERNATIVO (4 pts)
            </div>
            <div className="card-body p-0 overflow-auto">
              <table className="table table-bordered text-center m-0">
                <thead>
                  <tr>
                    <th>Equipo</th>
                    {[...Array(10)].map((_, i) => (
                      <th key={i}>{i + 1}</th>
                    ))}
                    <th>Ganador Popurrí Alternativo</th>
                  </tr>
                </thead>
                <tbody>
                  {["A", "B"].map((team) => (
                    <tr key={team}>
                      <td>{team === "A" ? config.teamA : config.teamB}</td>
                      {data.popurri.map((v, i) => (
                        <td key={i}>
                          <button
                            className={`btn btn-sm ${v === team ? "btn-primary" : "btn-light"}`}
                            style={{ width: "30px" }}
                            onClick={() => {
                              const n = [...data.popurri];
                              n[i] = n[i] === team ? null : team;
                              setData({ ...data, popurri: n });
                            }}
                          >
                            X
                          </button>
                        </td>
                      ))}
                      <td className="fw-bold">
                        {team === "A" ? calc.prizePopA : calc.prizePopB}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* POPURRI ALTERNATIVO DE LA MASCOTA */}
        <section className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white fw-bold">
              POPURRÍ ALTERNATIVO DE LA MASCOTA (3 pts)
            </div>
            <div className="card-body p-0 overflow-auto">
              <table className="table table-bordered text-center m-0">
                <thead>
                  <tr>
                    <th>Equipo</th>
                    {[...Array(4)].map((_, i) => (
                      <th key={i}>{i + 1}</th>
                    ))}
                    <th>Ganador Popurrí Mascota</th>
                  </tr>
                </thead>
                <tbody>
                  {["A", "B"].map((team) => (
                    <tr key={team}>
                      <td>{team === "A" ? config.teamA : config.teamB}</td>
                      {data.mascota.map((v, i) => (
                        <td key={i}>
                          <button
                            className={`btn btn-sm ${v === team ? "btn-primary" : "btn-light"}`}
                            style={{ width: "30px" }}
                            onClick={() => {
                              const n = [...data.mascota];
                              n[i] = n[i] === team ? null : team;
                              setData({ ...data, mascota: n });
                            }}
                          >
                            X
                          </button>
                        </td>
                      ))}
                      <td className="fw-bold">
                        {team === "A" ? calc.prizeMasA : calc.prizeMasB}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        {/* RITMOS (DOS TABLAS) */}
        {["ritmo1", "ritmo2"].map((rit, idx) => (
          <section className="col-lg-6" key={rit}>
            <div className="card shadow-sm border-0">
              <div className="card-header text-white fw-bold">
                POPURRÍ ALTERNATIVO RITMO {idx + 1} (1-5 pts | 4 pts)
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {["A", "B"].map((team) => (
                    <div className="col-6" key={team}>
                      <h6 className="small text-uppercase fw-bold opacity-75">
                        {team === "A" ? config.teamA : config.teamB}
                      </h6>
                      <table className="table table-sm table-bordered text-center">
                        <tbody>
                          {[
                            "vestimenta",
                            "originalidad",
                            "desplazamiento",
                            "coordinacion",
                            "conexion en pareja",
                          ].map((c) => (
                            <tr key={c}>
                              <td className="text-start small opacity-75">
                                {c}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-center mx-auto"
                                  value={data[rit][team][c]}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      rit,
                                      team,
                                      c,
                                      e.target.value,
                                      5,
                                    )
                                  }
                                />
                              </td>
                            </tr>
                          ))}
                          <tr className="table-warning">
                            <td>Suma</td>
                            <td>
                              {Object.values(data[rit][team]).reduce(
                                (a, v) => a + (Number(v) || 0),
                                0,
                              )}
                            </td>
                          </tr>
                          <tr className="table-success">
                            <td>Ganador Ritmo {idx + 1}</td>
                            <td>
                              {team === "A"
                                ? idx === 0
                                  ? calc.prizeR1A
                                  : calc.prizeR2A
                                : idx === 0
                                  ? calc.prizeR1B
                                  : calc.prizeR2B}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
        {/* VIDEOCLIP */}
        <section className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white fw-bold">
              VIDEOCLIP (1-8 pts | 15 pts)
            </div>
            <div className="card-body">
              <div className="row g-4">
                {["A", "B"].map((team) => (
                  <div className="col-md-6" key={team}>
                    <h6>{team === "A" ? config.teamA : config.teamB}</h6>
                    <table className="table table-sm table-bordered text-center">
                      <tbody>
                        {[
                          {
                            k: "cordinacion coreografica",
                            l: "Coordinación coreográfica",
                          },
                          {
                            k: "composicion coreografica",
                            l: "composicion coreografica",
                          },
                          {
                            k: "adaptacion al tiempo musical",
                            l: "Adaptación al tiempo musical",
                          },
                          { k: "uso del espacio", l: "Uso del espacio" },
                          { k: "impacto visual", l: "Impacto visual" },
                          { k: "carisma", l: "Carisma" },
                        ].map((c) => (
                          <tr key={c.k}>
                            <td className="text-start small">{c.l}</td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm text-center mx-auto"
                                value={data.videoclip[team][c.k]}
                                onChange={(e) =>
                                  handleScoreChange(
                                    "videoclip",
                                    team,
                                    c.k,
                                    e.target.value,
                                    8,
                                  )
                                }
                              />
                            </td>
                          </tr>
                        ))}
                        <tr className="table-warning">
                          <td>Suma</td>
                          <td>{team === "A" ? calc.sumVidA : calc.sumVidB}</td>
                        </tr>
                        <tr className="table-success">
                          <td>Ganador Video Clip</td>
                          <td>
                            {team === "A" ? calc.prizeVidA : calc.prizeVidB}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed-bottom py-3 px-4">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex gap-4 align-items-center">
            <div className="text-center">
              <div
                className="small text-uppercase opacity-50 fw-bold"
                style={{ fontSize: "0.65rem" }}
              >
                {config.teamA}
              </div>
              <div className="h5 m-0 fw-bold text-primary">{calc.totalA}</div>
            </div>
            <div className="vr h-100 opacity-25"></div>
            <div className="text-center">
              <div
                className="small text-uppercase opacity-50 fw-bold"
                style={{ fontSize: "0.65rem" }}
              >
                {config.teamB}
              </div>
              <div className="h5 m-0 fw-bold text-primary">{calc.totalB}</div>
            </div>
          </div>
          <button
            className="btn btn-success px-5 py-2 fw-bold shadow-sm"
            onClick={onSave}
          >
            🚀 ENVIAR RESULTADOS
          </button>
        </div>
      </footer>
    </div>
  );
};

const CategoryWinnerCard = ({ label, a, b, teamA, teamB }) => {
  const winner = a === b ? (a > 0 ? "EMPATE" : null) : a > b ? teamA : teamB;
  return (
    <div
      className="card border-0 shadow-lg text-white mb-3"
      style={{
        background: "linear-gradient(135deg, #2c3e50, #000000)",
        borderRadius: "20px",
        overflow: "hidden",
        minHeight: "180px",
      }}
    >
      <div className="card-body p-3 d-flex flex-column justify-content-between text-center">
        <div
          className="small text-uppercase opacity-75 fw-bold mb-2"
          style={{ fontSize: "0.7rem", letterSpacing: "1px" }}
        >
          {label}
        </div>

        <div className="d-flex align-items-center justify-content-around my-2">
          <div>
            <div className="h2 m-0 fw-bold" style={{ color: "#ff9800" }}>
              {a}
            </div>
            <div
              className="small opacity-50 fw-bold"
              style={{ fontSize: "0.6rem" }}
            >
              {teamA}
            </div>
          </div>
          <div className="opacity-25 fw-bold small">VS</div>
          <div>
            <div className="h2 m-0 fw-bold" style={{ color: "#ff9800" }}>
              {b}
            </div>
            <div
              className="small opacity-50 fw-bold"
              style={{ fontSize: "0.6rem" }}
            >
              {teamB}
            </div>
          </div>
        </div>

        <div className="mt-2">
          {winner ? (
            <div
              className="py-1 px-2 rounded-pill shadow-sm d-inline-block w-100"
              style={{
                background: "linear-gradient(to right, #ba8b02, #ffd700)",
                color: "#000",
                fontSize: "0.75rem",
                fontWeight: "900",
              }}
            >
              🏆 {winner === "EMPATE" ? "EMPATE" : `GANADOR: ${winner}`}
            </div>
          ) : (
            <div
              className="py-1 px-2 rounded-pill border border-secondary opacity-25 d-inline-block w-100"
              style={{ fontSize: "0.75rem" }}
            >
              PENDIENTE
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminView = ({ db, onBack, onReset, config }) => {
  const teamA = config.teamA;
  const teamB = config.teamB;
  const jurors = [
    { id: "juror1", label: config.jurors.juror1 },
    { id: "juror2", label: config.jurors.juror2 },
    { id: "juror3", label: config.jurors.juror3 },
  ];

  const [editConfig, setEditConfig] = useState(config);
  const [isSaving, setIsSaving] = useState(false);
  const { totalA, totalB, breakdown } = calculateConsensus(db, jurors);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    await supabase
      .from("jornadas_scores")
      .upsert({
        juror_id: "config",
        payload: editConfig,
        updated_at: new Date(),
      });
    setIsSaving(false);
    alert("Configuración actualizada y sincronizada.");
  };

  const generatePDF = () => {
    console.log("Iniciando generación de PDF...");
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 40);
      doc.text("Jornadas Estudiantiles 2026", 105, 20, { align: "center" });

      doc.setFontSize(14);
      doc.text(
        `Comprobante de Resultados - Encuentro #${config.matchNo}`,
        105,
        30,
        { align: "center" },
      );
      doc.line(20, 35, 190, 35);

      // Match Info
      doc.setFontSize(12);
      doc.text(`Encuentro: #${config.matchNo}`, 20, 45);
      doc.text(
        `Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        130,
        45,
      );

      doc.setFontSize(16);
      doc.text(`${teamA} vs ${teamB}`, 105, 55, { align: "center" });

      // Individual Juror Table
      const jurorRows = jurors.map((j) => {
        const results = db[j.id] ? calculateFinal(db[j.id]) : null;
        return [
          j.label,
          results ? results.totalA : "-",
          results ? results.totalB : "-",
          db[j.id]?.submitted ? "ENVIADO" : "PENDIENTE",
        ];
      });

      autoTable(doc, {
        startY: 65,
        head: [["Jurado", `Puntos ${teamA}`, `Puntos ${teamB}`, "Estado"]],
        body: jurorRows,
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      const consensus = calculateConsensus(db, jurors);
      const winner =
        consensus.totalA === consensus.totalB
          ? "EMPATE"
          : consensus.totalA > consensus.totalB
            ? teamA
            : teamB;
      const nextY =
        doc.lastAutoTable && doc.lastAutoTable.finalY
          ? doc.lastAutoTable.finalY + 15
          : 120;

      autoTable(doc, {
        startY: nextY,
        head: [["RESULTADO FINAL (CONSENSO)", teamA, teamB, "GANADOR"]],
        body: [
          [
            "PUNTAJE FINAL VALIDADO",
            consensus.totalA.toString(),
            consensus.totalB.toString(),
            {
              content: winner,
              styles: { fontStyle: "bold", textColor: [39, 174, 96] },
            },
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [44, 62, 80], textColor: 255 },
        styles: { fontSize: 14 },
      });

      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        "Este documento es un comprobante digital generado por el sistema de puntuación.",
        105,
        280,
        { align: "center" },
      );
      doc.save(
        `Resultado_Encuentro_${config.matchNo}_${teamA}_vs_${teamB}.pdf`,
      );
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      alert("Hubo un error al generar el PDF.");
    }
  };

  // Removed duplicate declarations here

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>
          Volver
        </button>
        <div className="d-flex gap-2">
          <button
            className="btn btn-info btn-sm text-white fw-bold px-3"
            onClick={generatePDF}
          >
            📥 Descargar Comprobante PDF
          </button>
          <button className="btn btn-danger btn-sm" onClick={onReset}>
            🧹 Limpiar Evento
          </button>
        </div>
      </div>

      <div
        className="card shadow-sm border-0 p-4 mb-5"
        style={{ borderRadius: "20px", background: "rgba(255,255,255,0.05)" }}
      >
        <h4 className="fw-bold mb-4 text-primary">⚙️ Ajustes del Encuentro</h4>
        <div className="row g-3">
          <div className="col-md-2">
            <label className="form-label small fw-bold">N° Encuentro</label>
            <input
              type="text"
              className="form-control"
              value={editConfig.matchNo}
              onChange={(e) =>
                setEditConfig({ ...editConfig, matchNo: e.target.value })
              }
            />
          </div>
          <div className="col-md-5">
            <label className="form-label small fw-bold">Nombre Equipo A</label>
            <input
              type="text"
              className="form-control"
              value={editConfig.teamA}
              onChange={(e) =>
                setEditConfig({ ...editConfig, teamA: e.target.value })
              }
            />
          </div>
          <div className="col-md-5">
            <label className="form-label small fw-bold">Nombre Equipo B</label>
            <input
              type="text"
              className="form-control"
              value={editConfig.teamB}
              onChange={(e) =>
                setEditConfig({ ...editConfig, teamB: e.target.value })
              }
            />
          </div>
          {["juror1", "juror2", "juror3"].map((id, i) => (
            <div className="col-md-4" key={id}>
              <label className="form-label small fw-bold">
                Nombre Jurado {i + 1}
              </label>
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
              onClick={handleSaveConfig}
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "💾 Guardar y Sincronizar Nombres"}
            </button>
          </div>
        </div>
      </div>

      <h2 className="text-center fw-bold mb-5 text-uppercase tracking-tighter">
        Tablero de Resultados: {teamA} vs {teamB}
      </h2>

      {/* Visual Cards Grid - Vertical List */}
      <div className="row justify-content-center mb-5">
        <div className="col-lg-6 col-md-8">
          {(breakdown.individualGames || []).map((win, i) => (
            <div className="mb-4" key={`card-juego-${i}`}>
              <CategoryWinnerCard
                label={`Juego #${i + 1}`}
                a={win === "A" ? 6 : 0}
                b={win === "B" ? 6 : 0}
                teamA={teamA}
                teamB={teamB}
              />
            </div>
          ))}
          {[
            {
              label: "Popurrí Alternativo",
              a: breakdown.popA,
              b: breakdown.popB,
            },
            { label: "Popurrí Mascota", a: breakdown.masA, b: breakdown.masB },
            { label: "Ritmo 1", a: breakdown.r1A, b: breakdown.r1B },
            { label: "Ritmo 2", a: breakdown.r2A, b: breakdown.r2B },
            { label: "Video Clip", a: breakdown.vidA, b: breakdown.vidB },
          ].map((cat, i) => (
            <div className="mb-4" key={`card-cat-${i}`}>
              <CategoryWinnerCard
                label={cat.label}
                a={cat.a}
                b={cat.b}
                teamA={teamA}
                teamB={teamB}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-lg-8">
          <div
            className="card shadow border-0 h-100"
            style={{ borderRadius: "20px", overflow: "hidden" }}
          >
            <div className="card-header bg-primary text-white py-3 fw-bold text-center text-uppercase tracking-wider">
              Puntaje en Vivo por Categoría
            </div>
            <div className="card-body p-0">
              <table className="table table-hover m-0 align-middle text-center">
                <thead className="table-light">
                  <tr>
                    <th className="text-start ps-4">Categoría</th>
                    <th>{teamA}</th>
                    <th>{teamB}</th>
                    <th>Ganador</th>
                  </tr>
                </thead>
                <tbody className="fw-bold">
                  {[
                    {
                      label: "Juegos",
                      a: breakdown.juegosA,
                      b: breakdown.juegosB,
                    },
                    {
                      label: "Ganador Popurrí Alternativo",
                      a: breakdown.popA,
                      b: breakdown.popB,
                    },
                    {
                      label: "Ganador Popurrí Mascota",
                      a: breakdown.masA,
                      b: breakdown.masB,
                    },
                    {
                      label: "Ganador Ritmo 1",
                      a: breakdown.r1A,
                      b: breakdown.r1B,
                    },
                    {
                      label: "Ganador Ritmo 2",
                      a: breakdown.r2A,
                      b: breakdown.r2B,
                    },
                    {
                      label: "Ganador Video Clip",
                      a: breakdown.vidA,
                      b: breakdown.vidB,
                    },
                  ].map((row, i) => {
                    const rowWinner =
                      row.a === row.b
                        ? row.a > 0
                          ? "EMPATE"
                          : "-"
                        : row.a > row.b
                          ? teamA
                          : teamB;
                    return (
                      <tr key={i}>
                        <td className="text-start ps-4 opacity-75">
                          {row.label}
                        </td>
                        <td style={{ color: "#ffb74d" }}>{row.a}</td>
                        <td style={{ color: "#ffb74d" }}>{row.b}</td>
                        <td>
                          <span
                            className={`badge ${rowWinner === teamA || rowWinner === teamB ? "bg-success" : "bg-secondary"} px-3`}
                          >
                            {rowWinner}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="table-dark">
                  <tr>
                    <td className="text-start ps-4">TOTAL ACUMULADO</td>
                    <td className="h4 m-0" style={{ color: "#ff9800" }}>
                      {totalA}
                    </td>
                    <td className="h4 m-0" style={{ color: "#ff9800" }}>
                      {totalB}
                    </td>
                    <td className="text-info">
                      {totalA === totalB
                        ? "EMPATE"
                        : totalA > totalB
                          ? teamA
                          : teamB}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="d-flex flex-column gap-3 h-100">
            {jurors.map((j) => (
              <div
                key={j.id}
                className={`card shadow-sm border-0 p-3 text-center flex-grow-1 d-flex flex-column justify-content-center ${db[j.id]?.submitted ? "border-start border-success border-5" : "opacity-50"}`}
              >
                <h6 className="mb-1">{j.label}</h6>
                <div className="small text-uppercase opacity-50 mb-2">
                  {db[j.id]?.submitted ? "✅ Recibido" : "⏳ Pendiente"}
                </div>
                <b className="h5 mb-0">
                  {teamA}: {db[j.id] ? calculateFinal(db[j.id]).totalA : "-"} |{" "}
                  {teamB}: {db[j.id] ? calculateFinal(db[j.id]).totalB : "-"}
                </b>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="card shadow-lg bg-dark bg-opacity-75 text-white p-5 text-center border-0 backdrop-blur"
        style={{
          borderRadius: "30px",
          background: "linear-gradient(135deg, #1a1a1a, #2c3e50)",
        }}
      >
        <div className="row justify-content-center align-items-center">
          <div className="col-md-5">
            <div className="display-1 fw-bold" style={{ color: "#ff9800" }}>
              {totalA}
            </div>
            <h4 className="text-uppercase">{teamA}</h4>
          </div>
          <div className="col-md-2 display-4 opacity-25">VS</div>
          <div className="col-md-5">
            <div className="display-1 fw-bold" style={{ color: "#ff9800" }}>
              {totalB}
            </div>
            <h4 className="text-uppercase">{teamB}</h4>
          </div>
        </div>
        <div className="mt-5">
          <div className="winner-badge shadow-lg">
            <h2 className="m-0 fw-bolder text-uppercase tracking-tighter">
              🏆 GANADOR:{" "}
              {totalA === totalB ? "EMPATE" : totalA > totalB ? teamA : teamB}
            </h2>
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;
