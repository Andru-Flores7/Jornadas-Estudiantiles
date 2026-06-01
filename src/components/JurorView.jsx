import React, { useMemo } from "react";
import { calculateFinal } from "../utils/scoring";

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
    // Permitir vacío para borrar
    if (value === "") {
      setData({
        ...data,
        [section]: {
          ...data[section],
          [team]: { ...data[section][team], [criterion]: "" },
        },
      });
      return;
    }

    const val = parseInt(value, 10);
    if (!isNaN(val) && val >= 1 && val <= max) {
      setData({
        ...data,
        [section]: {
          ...data[section],
          [team]: { ...data[section][team], [criterion]: val.toString() },
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
          <span className="me-1">←</span> 
        </button>
        <h5 className="m-0 fw-bold text-uppercase tracking-wider" style={{ fontSize: '18px' }}>
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
                    {[...Array(11)].map((_, i) => (
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
                    {[...Array(5)].map((_, i) => (
                      <th key={i}>{i + 1}</th>
                    ))}
                    <th>Ganador Popurrí Mascota</th>
                  </tr>
                </thead>
                <tbody>
                  {["A", "B"].map((team) => {
                    const mascotaList = Array.isArray(data.mascota) ? [...data.mascota] : [];
                    while (mascotaList.length < 5) {
                      mascotaList.push(null);
                    }
                    const finalMascota = mascotaList.slice(0, 5);
                    return (
                      <tr key={team}>
                        <td>{team === "A" ? config.teamA : config.teamB}</td>
                        {finalMascota.map((v, i) => (
                          <td key={i}>
                            <button
                              className={`btn btn-sm ${v === team ? "btn-primary" : "btn-light"}`}
                              style={{ width: "30px" }}
                              onClick={() => {
                                const n = [...finalMascota];
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
                    );
                  })}
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
                POPURRÍ SELECCIONADO <em>RITMO {idx + 1}</em> (SE CALIFICA DEL 1 AL 5 CADA ITEM) | 4 pts
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
                            { key: "vestimenta", label: "Vestimenta" },
                            { key: "originalidad", label: "Originalidad" },
                            { key: "desplazamiento", label: "Desplazamiento" },
                            { key: "coordinacion", label: "Coordinacion" },
                            { key: "conexion en pareja", label: "Conexion en pareja" },
                          ].map((c) => (
                            <tr key={c.key}>
                              <td className="text-start small opacity-75">
                                {c.label}
                              </td>
                              <td>
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    className="form-control form-control-sm text-center mx-auto"
                                    value={data[rit][team][c.key]}
                                    onChange={(e) =>
                                      handleScoreChange(
                                        rit,
                                        team,
                                        c.key,
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
              VIDEOCLIP (SE CALIFICA DEL 1 AL 8 CADA ITEM) | 15 pts
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
                            l: "Composicion coreografica",
                          },
                          {
                            k: "adaptacion al tiempo musical",
                            l: "Adaptación al tiempo musical",
                          },
                          { k: "uso del espacio", l: "Uso del espacio" },
                          { k: "trabajo en equipo", l: "Trabajo en equipo" },
                          { k: "carisma", l: "Carisma" },
                        ].map((c) => (
                          <tr key={c.k}>
                            <td className="text-start small">{c.l}</td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                max="8"
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
            className="btn btn-success  fw-bold shadow-sm "
            style={{ borderRadius: "20px", overflow: "hidden",fontSize:"10px" }}
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
