import React, { useState, useMemo } from "react";
import { supabase } from "../supabase";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import confetti from "canvas-confetti";
import { calculateConsensus, calculateFinal, calculateJurorProgress } from "../utils/scoring";
import CategoryWinnerCard from "./CategoryWinnerCard";

const AdminView = ({ db, onBack, onReset, config }) => {
  const teamA = config.teamA;
  const teamB = config.teamB;

  // Memoize jurors so it doesn't re-create the array on every render
  const jurors = useMemo(() => [
    { id: "juror1", label: config.jurors.juror1 },
    { id: "juror2", label: config.jurors.juror2 },
    { id: "juror3", label: config.jurors.juror3 },
  ], [config.jurors]);

  const [editConfig, setEditConfig] = useState(config);
  const [isSaving, setIsSaving] = useState(false);
  const [viewTab, setViewTab] = useState("results"); // "results" or "live"
  const [expandedJuror, setExpandedJuror] = useState({ juror1: false, juror2: false, juror3: false });

  // Memoize consensus calculation — only recomputes when db or jurors change
  const { totalA, totalB, breakdown } = useMemo(
    () => calculateConsensus(db, jurors),
    [db, jurors]
  );

  // Memoize per-juror results — avoids calling calculateFinal on every render
  const jurorResults = useMemo(
    () => jurors.map((j) => ({ id: j.id, result: db[j.id] ? calculateFinal(db[j.id]) : null })),
    [db, jurors]
  );

  // Memoize juror progress metrics
  const jurorProgressData = useMemo(() => {
    return jurors.map((j) => {
      const progress = calculateJurorProgress(db[j.id]);
      return {
        id: j.id,
        label: j.label,
        progress,
        updatedAt: db[j.id]?.updated_at ? new Date(db[j.id].updated_at).toLocaleTimeString() : null,
      };
    });
  }, [db, jurors]);

  const allVoted = jurors.every((j) => db[j.id]?.submitted);


  const handleSaveConfig = async () => {
    setIsSaving(true);
    await supabase.from("jornadas_scores").upsert({
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
      // Lanzar confeti para celebrar la generación del acta oficial
      try {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.warn("Confetti error:", err);
      }

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

      // Individual Juror Table — use memoized results
      const jurorRows = jurorResults.map((jr) => {
        const j = jurors.find((x) => x.id === jr.id);
        return [
          j.label,
          jr.result ? jr.result.totalA : "-",
          jr.result ? jr.result.totalB : "-",
          db[jr.id]?.submitted ? "ENVIADO" : "PENDIENTE",
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

  const renderDots = (arr, total) => {
    const dots = [];
    for (let i = 0; i < total; i++) {
      const val = arr && arr[i];
      dots.push(
        <span
          key={i}
          className="d-inline-flex align-items-center justify-content-center fw-bold rounded-circle shadow-sm"
          style={{
            width: "20px",
            height: "20px",
            fontSize: "9px",
            background: val === "A" ? "#ff9800" : val === "B" ? "#2196f3" : "rgba(255,255,255,0.15)",
            color: val ? "#000" : "rgba(255,255,255,0.4)",
            border: val ? "none" : "1px solid rgba(255,255,255,0.1)",
            transition: "all 0.3s ease",
          }}
          title={`Ronda ${i + 1}: ${val ? (val === "A" ? teamA : teamB) : "Pendiente"}`}
        >
          {val || "-"}
        </span>
      );
    }
    return <div className="d-flex gap-1 flex-wrap justify-content-center">{dots}</div>;
  };

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

      <h2 className="text-center fw-bold mb-4 text-uppercase tracking-tighter">
        Tablero de Resultados: {teamA} vs {teamB}
      </h2>

      {/* Selector de pestañas */}
      <div className="d-flex justify-content-center mb-5">
        <div className="btn-group p-1" style={{ background: "rgba(255,255,255,0.08)", borderRadius: "16px" }}>
          <button
            className={`btn px-4 py-2 ${viewTab === "results" ? "btn-primary shadow-sm" : "btn-link text-white text-decoration-none"}`}
            style={{ borderRadius: "12px", border: "none" }}
            onClick={() => setViewTab("results")}
          >
            📊 Resultados Consolidados
          </button>
          <button
            className={`btn px-4 py-2 ${viewTab === "live" ? "btn-primary shadow-sm" : "btn-link text-white text-decoration-none"}`}
            style={{ borderRadius: "12px", border: "none" }}
            onClick={() => setViewTab("live")}
          >
            🟢 Monitoreo de Jurados en Vivo
          </button>
        </div>
      </div>

      {viewTab === "results" ? (
        <>
          {/* Visual Cards Grid - Vertical List */}
          <div className="row justify-content-center mb-5">
            <div className="col-lg-6 col-md-8">
              {(breakdown.individualGames || []).map((win, i) => (
                <div className="mb-4" key={`card-juego-${i}`}>
                  <CategoryWinnerCard
                    label={`Juego #${i + 1}`}
                    a={allVoted ? (win === "A" ? 6 : 0) : "-"}
                    b={allVoted ? (win === "B" ? 6 : 0) : "-"}
                    teamA={teamA}
                    teamB={teamB}
                    hasData={allVoted}
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
                {
                  label: "Popurrí Seleccionado Ritmo 1",
                  a: breakdown.r1A,
                  b: breakdown.r1B,
                },
                {
                  label: "Popurrí Seleccionado Ritmo 2",
                  a: breakdown.r2A,
                  b: breakdown.r2B,
                },
                { label: "Video Clip", a: breakdown.vidA, b: breakdown.vidB },
              ].map((cat, i) => (
                <div className="mb-4" key={`card-cat-${i}`}>
                  <CategoryWinnerCard
                    label={cat.label}
                    a={allVoted ? cat.a : "-"}
                    b={allVoted ? cat.b : "-"}
                    teamA={teamA}
                    teamB={teamB}
                    hasData={allVoted}
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
                          label: "Ganador Popurrí Selec. Ritmo 1",
                          a: breakdown.r1A,
                          b: breakdown.r1B,
                        },
                        {
                          label: "Ganador Popurrí Selec. Ritmo 2",
                          a: breakdown.r2A,
                          b: breakdown.r2B,
                        },
                        {
                          label: "Ganador Video Clip",
                          a: breakdown.vidA,
                          b: breakdown.vidB,
                        },
                      ].map((row, i) => {
                        const rowWinner = !allVoted
                          ? "PENDIENTE"
                          : row.a === row.b
                            ? "EMPATE"
                            : row.a > row.b
                              ? teamA
                              : teamB;
                        return (
                          <tr key={i}>
                            <td className="text-start ps-4 opacity-75">
                              {row.label}
                            </td>
                            <td style={{ color: "#ffb74d" }}>
                              {allVoted ? row.a : "-"}
                            </td>
                            <td style={{ color: "#ffb74d" }}>
                              {allVoted ? row.b : "-"}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  rowWinner === teamA || rowWinner === teamB
                                    ? "bg-success"
                                    : rowWinner === "EMPATE"
                                      ? "bg-warning text-dark"
                                      : "bg-secondary"
                                } px-3`}
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
                          {allVoted ? totalA : "-"}
                        </td>
                        <td className="h4 m-0" style={{ color: "#ff9800" }}>
                          {allVoted ? totalB : "-"}
                        </td>
                        <td
                          className={`fw-bold ${allVoted && totalA === totalB ? "text-warning" : "text-info"}`}
                        >
                          {!allVoted
                            ? "PENDIENTE"
                            : totalA === totalB
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
                {jurorProgressData.map((jp) => {
                  const submitted = jp.progress.submitted;
                  const percent = jp.progress.pct;
                  const result = jurorResults.find((r) => r.id === jp.id)?.result;
                  return (
                    <div
                      key={jp.id}
                      className={`card shadow-sm border-0 p-3 text-center flex-grow-1 d-flex flex-column justify-content-center ${
                        submitted
                          ? "border-start border-success border-5"
                          : jp.progress.isStarted
                            ? "border-start border-warning border-5"
                            : "opacity-50"
                      }`}
                    >
                      <h6 className="mb-1">{jp.label}</h6>
                      <div className="small text-uppercase opacity-75 mb-2 d-flex justify-content-center align-items-center gap-2">
                        {submitted ? (
                          <span className="badge bg-success">✅ Recibido</span>
                        ) : jp.progress.isStarted ? (
                          <span className="badge bg-warning text-dark">
                            ✍️ Votando ({percent}%)
                          </span>
                        ) : (
                          <span className="badge bg-secondary">⏳ Pendiente</span>
                        )}
                      </div>
                      <div className="progress mb-2" style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px" }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${percent}%`, transition: "width 0.4s ease" }}
                        ></div>
                      </div>
                      <b className="h5 mb-0">
                        {teamA}: {result ? result.totalA : "-"} |{" "}
                        {teamB}: {result ? result.totalB : "-"}
                      </b>
                      {jp.updatedAt && (
                        <div className="small opacity-50 text-end mt-2" style={{ fontSize: "0.7rem" }}>
                          Sinc: {jp.updatedAt}
                        </div>
                      )}
                    </div>
                  );
                })}
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
                  {allVoted ? totalA : "-"}
                </div>
                <h4 className="text-uppercase">{teamA}</h4>
              </div>
              <div className="col-md-2 display-4 opacity-25">VS</div>
              <div className="col-md-5">
                <div className="display-1 fw-bold" style={{ color: "#ff9800" }}>
                  {allVoted ? totalB : "-"}
                </div>
                <h4 className="text-uppercase">{teamB}</h4>
              </div>
            </div>
            <div className="mt-5">
              <div className="winner-badge shadow-lg">
                <h2 className="m-0 fw-bolder text-uppercase tracking-tighter">
                  {!allVoted
                    ? "⏳ ESPERANDO JURADOS..."
                    : totalA === totalB
                      ? "⚖️ EMPATE"
                      : `🏆 GANADOR: ${totalA > totalB ? teamA : teamB}`}
                </h2>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Live Monitor View */}
          <div className="row g-4 mb-5">
            {jurorProgressData.map((jp) => {
              const dataObj = db[jp.id];
              const isStarted = jp.progress.isStarted;
              const submitted = jp.progress.submitted;
              const pct = jp.progress.pct;
              const isExpanded = expandedJuror[jp.id];
              const result = jurorResults.find((r) => r.id === jp.id)?.result;

              return (
                <div key={jp.id} className="col-lg-4 col-md-12">
                  <div
                    className={`card shadow border-0 h-100 p-4 d-flex flex-column justify-content-between ${
                      submitted
                        ? "border-top border-success border-5"
                        : isStarted
                          ? "border-top border-warning border-5"
                          : "opacity-75"
                    }`}
                  >
                    <div>
                      {/* Cabecera */}
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold m-0 text-white">{jp.label}</h5>
                        {submitted ? (
                          <span className="badge bg-success">Enviado</span>
                        ) : isStarted ? (
                          <span className="badge bg-warning text-dark">Votando {pct}%</span>
                        ) : (
                          <span className="badge bg-secondary">Pendiente</span>
                        )}
                      </div>

                      {/* Barra de progreso */}
                      <div className="mb-4">
                        <div className="d-flex justify-content-between small opacity-75 mb-1" style={{ fontSize: "0.75rem" }}>
                          <span>Progreso de Planilla</span>
                          <span>{jp.progress.totalFilled} / 51 campos</span>
                        </div>
                        <div className="progress" style={{ height: "10px", borderRadius: "5px", background: "rgba(255,255,255,0.1)" }}>
                          <div
                            className={`progress-bar ${submitted ? "bg-success" : "bg-warning"}`}
                            role="progressbar"
                            style={{ width: `${pct}%`, transition: "width 0.4s ease" }}
                            aria-valuenow={pct}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>

                      {/* Puntajes Provisionales */}
                      <div className="d-flex justify-content-around align-items-center py-2 mb-4 bg-dark bg-opacity-25 rounded border border-white border-opacity-10">
                        <div className="text-center">
                          <div className="small text-uppercase opacity-50" style={{ fontSize: "0.65rem" }}>{teamA}</div>
                          <div className="h4 m-0 fw-bold" style={{ color: "#ff9800" }}>{result ? result.totalA : 0}</div>
                        </div>
                        <div className="vr h-100 opacity-25" style={{ minHeight: "30px" }}></div>
                        <div className="text-center">
                          <div className="small text-uppercase opacity-50" style={{ fontSize: "0.65rem" }}>{teamB}</div>
                          <div className="h4 m-0 fw-bold" style={{ color: "#ff9800" }}>{result ? result.totalB : 0}</div>
                        </div>
                      </div>

                      {/* Desglose visual */}
                      <div className="d-flex flex-column gap-3 my-4">
                        {/* Juegos */}
                        <div>
                          <div className="small opacity-75 fw-bold mb-1" style={{ fontSize: "0.75rem" }}>
                            Juegos ({jp.progress.juegos.filled}/3):
                          </div>
                          {renderDots(dataObj?.juegos, 3)}
                        </div>

                        {/* Popurrí */}
                        <div>
                          <div className="small opacity-75 fw-bold mb-1" style={{ fontSize: "0.75rem" }}>
                            Popurrí Alternativo ({jp.progress.popurri.filled}/11):
                          </div>
                          {renderDots(dataObj?.popurri, 11)}
                        </div>

                        {/* Mascota */}
                        <div>
                          <div className="small opacity-75 fw-bold mb-1" style={{ fontSize: "0.75rem" }}>
                            Popurrí Mascota ({jp.progress.mascota.filled}/5):
                          </div>
                          {renderDots(dataObj?.mascota, 5)}
                        </div>

                        {/* Ritmo 1 y 2 */}
                        <div className="row g-2">
                          <div className="col-6">
                            <div className="small opacity-75 fw-bold" style={{ fontSize: "0.75rem" }}>Ritmo 1</div>
                            <div className="badge bg-dark w-100 text-center border border-white border-opacity-10 py-2">
                              {jp.progress.ritmo1.filled} / 10
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="small opacity-75 fw-bold" style={{ fontSize: "0.75rem" }}>Ritmo 2</div>
                            <div className="badge bg-dark w-100 text-center border border-white border-opacity-10 py-2">
                              {jp.progress.ritmo2.filled} / 10
                            </div>
                          </div>
                        </div>

                        {/* Video clip */}
                        <div>
                          <div className="small opacity-75 fw-bold" style={{ fontSize: "0.75rem" }}>Video Clip</div>
                          <div className="badge bg-dark w-100 text-center border border-white border-opacity-10 py-2">
                            {jp.progress.videoclip.filled} / 12 campos
                          </div>
                        </div>
                      </div>

                      {/* Detalle ampliado collapsible */}
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-dark bg-opacity-50 rounded shadow-inner" style={{ fontSize: "0.82rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <div className="row g-3">
                            <div className="col-6 border-end border-secondary border-opacity-25">
                              <h6 className="text-warning text-uppercase mb-2" style={{ fontSize: "0.7rem", fontWeight: "700" }}>{teamA}</h6>
                              <div className="d-flex flex-column gap-2">
                                <div>
                                  <div className="text-muted fw-bold mb-1" style={{ fontSize: "0.65rem" }}>Ritmo 1:</div>
                                  {Object.entries(dataObj?.ritmo1?.A || {}).map(([k, v]) => (
                                    <div key={k} className="d-flex justify-content-between pe-2 lh-sm my-1">
                                      <span className="opacity-75 text-capitalize" style={{ fontSize: "0.65rem" }}>{k}:</span>
                                      <span className="fw-bold">{v || "-"}</span>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <div className="text-muted fw-bold mb-1" style={{ fontSize: "0.65rem" }}>Ritmo 2:</div>
                                  {Object.entries(dataObj?.ritmo2?.A || {}).map(([k, v]) => (
                                    <div key={k} className="d-flex justify-content-between pe-2 lh-sm my-1">
                                      <span className="opacity-75 text-capitalize" style={{ fontSize: "0.65rem" }}>{k}:</span>
                                      <span className="fw-bold">{v || "-"}</span>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <div className="text-muted fw-bold mb-1" style={{ fontSize: "0.65rem" }}>Video Clip:</div>
                                  {Object.entries(dataObj?.videoclip?.A || {}).map(([k, v]) => (
                                    <div key={k} className="d-flex justify-content-between pe-2 lh-sm my-1">
                                      <span className="opacity-75 text-capitalize" style={{ fontSize: "0.63rem" }}>{k}:</span>
                                      <span className="fw-bold">{v || "-"}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="col-6">
                              <h6 className="text-info text-uppercase mb-2" style={{ fontSize: "0.7rem", fontWeight: "700" }}>{teamB}</h6>
                              <div className="d-flex flex-column gap-2">
                                <div>
                                  <div className="text-muted fw-bold mb-1" style={{ fontSize: "0.65rem" }}>Ritmo 1:</div>
                                  {Object.entries(dataObj?.ritmo1?.B || {}).map(([k, v]) => (
                                    <div key={k} className="d-flex justify-content-between lh-sm my-1">
                                      <span className="opacity-75 text-capitalize" style={{ fontSize: "0.65rem" }}>{k}:</span>
                                      <span className="fw-bold">{v || "-"}</span>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <div className="text-muted fw-bold mb-1" style={{ fontSize: "0.65rem" }}>Ritmo 2:</div>
                                  {Object.entries(dataObj?.ritmo2?.B || {}).map(([k, v]) => (
                                    <div key={k} className="d-flex justify-content-between lh-sm my-1">
                                      <span className="opacity-75 text-capitalize" style={{ fontSize: "0.65rem" }}>{k}:</span>
                                      <span className="fw-bold">{v || "-"}</span>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <div className="text-muted fw-bold mb-1" style={{ fontSize: "0.65rem" }}>Video Clip:</div>
                                  {Object.entries(dataObj?.videoclip?.B || {}).map(([k, v]) => (
                                    <div key={k} className="d-flex justify-content-between lh-sm my-1">
                                      <span className="opacity-75 text-capitalize" style={{ fontSize: "0.63rem" }}>{k}:</span>
                                      <span className="fw-bold">{v || "-"}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botón expander / Sincronización */}
                    <div className="mt-4 border-top border-white border-opacity-10 pt-3">
                      <button
                        className="btn btn-outline-primary btn-sm w-100 fw-bold"
                        onClick={() => setExpandedJuror((prev) => ({ ...prev, [jp.id]: !prev[jp.id] }))}
                        disabled={!isStarted}
                      >
                        {isExpanded ? "🔼 Ocultar Detalles" : "🔽 Ver Planilla Detallada"}
                      </button>
                      {jp.updatedAt ? (
                        <div className="text-end small opacity-50 mt-2" style={{ fontSize: "0.65rem" }}>
                          Sincronizado: {jp.updatedAt}
                        </div>
                      ) : (
                        <div className="text-end small opacity-25 mt-2" style={{ fontSize: "0.65rem" }}>
                          Sin actividad en vivo
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Voting Matrix Table */}
          <div className="card shadow border-0 mt-5 mb-4" style={{ borderRadius: "20px", overflow: "hidden" }}>
            <div className="card-header bg-primary text-white py-3 fw-bold text-center text-uppercase tracking-wider">
              📊 Matriz Comparativa de Votos en Vivo
            </div>
            <div className="card-body p-0 table-responsive">
              <table className="table table-hover m-0 align-middle text-center responsive-table-admin">
                <thead className="table-light">
                  <tr>
                    <th className="text-start ps-4">Categoría / Ítem</th>
                    {jurors.map((j) => (
                      <th key={j.id}>{j.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="fw-bold">
                  {/* Juegos */}
                  {[0, 1, 2].map((idx) => (
                    <tr key={`juego-${idx}`}>
                      <td className="text-start ps-4 opacity-75">Juego #{idx + 1}</td>
                      {jurors.map((j) => {
                        const val = db[j.id]?.juegos?.[idx];
                        return (
                          <td key={j.id}>
                            {val ? (
                              <span className={`badge ${val === "A" ? "bg-warning text-dark" : "bg-primary"} px-3`}>
                                {val === "A" ? teamA : teamB}
                              </span>
                            ) : (
                              <span className="text-muted opacity-50 small">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Popurrí */}
                  <tr>
                    <td className="text-start ps-4 opacity-75">Popurrí Alternativo</td>
                    {jurors.map((j) => {
                      const arr = db[j.id]?.popurri || [];
                      const filled = arr.filter(x => x !== null && x !== "").length;
                      const aCount = arr.filter(x => x === "A").length;
                      const bCount = arr.filter(x => x === "B").length;
                      return (
                        <td key={j.id}>
                          {filled > 0 ? (
                            <span className="text-white">
                              {filled}/11 <span className="text-muted small">({teamA}: {aCount} | {teamB}: {bCount})</span>
                            </span>
                          ) : (
                            <span className="text-muted opacity-50 small">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Mascota */}
                  <tr>
                    <td className="text-start ps-4 opacity-75">Popurrí Mascota</td>
                    {jurors.map((j) => {
                      const arr = db[j.id]?.mascota || [];
                      const filled = arr.filter(x => x !== null && x !== "").length;
                      const aCount = arr.filter(x => x === "A").length;
                      const bCount = arr.filter(x => x === "B").length;
                      return (
                        <td key={j.id}>
                          {filled > 0 ? (
                            <span className="text-white">
                              {filled}/5 <span className="text-muted small">({teamA}: {aCount} | {teamB}: {bCount})</span>
                            </span>
                          ) : (
                            <span className="text-muted opacity-50 small">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Ritmo 1 A */}
                  <tr>
                    <td className="text-start ps-4 opacity-75">Ritmo 1: {teamA}</td>
                    {jurors.map((j) => {
                      const obj = db[j.id]?.ritmo1?.A || {};
                      const filled = Object.values(obj).filter(x => x !== "").length;
                      const sum = Object.values(obj).reduce((acc, v) => acc + (Number(v) || 0), 0);
                      return (
                        <td key={j.id}>
                          {filled > 0 ? (
                            <span className="text-warning">{sum} pts <span className="text-muted small">({filled}/5)</span></span>
                          ) : (
                            <span className="text-muted opacity-50 small">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Ritmo 1 B */}
                  <tr>
                    <td className="text-start ps-4 opacity-75">Ritmo 1: {teamB}</td>
                    {jurors.map((j) => {
                      const obj = db[j.id]?.ritmo1?.B || {};
                      const filled = Object.values(obj).filter(x => x !== "").length;
                      const sum = Object.values(obj).reduce((acc, v) => acc + (Number(v) || 0), 0);
                      return (
                        <td key={j.id}>
                          {filled > 0 ? (
                            <span className="text-info">{sum} pts <span className="text-muted small">({filled}/5)</span></span>
                          ) : (
                            <span className="text-muted opacity-50 small">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Ritmo 2 A */}
                  <tr>
                    <td className="text-start ps-4 opacity-75">Ritmo 2: {teamA}</td>
                    {jurors.map((j) => {
                      const obj = db[j.id]?.ritmo2?.A || {};
                      const filled = Object.values(obj).filter(x => x !== "").length;
                      const sum = Object.values(obj).reduce((acc, v) => acc + (Number(v) || 0), 0);
                      return (
                        <td key={j.id}>
                          {filled > 0 ? (
                            <span className="text-warning">{sum} pts <span className="text-muted small">({filled}/5)</span></span>
                          ) : (
                            <span className="text-muted opacity-50 small">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Ritmo 2 B */}
                  <tr>
                    <td className="text-start ps-4 opacity-75">Ritmo 2: {teamB}</td>
                    {jurors.map((j) => {
                      const obj = db[j.id]?.ritmo2?.B || {};
                      const filled = Object.values(obj).filter(x => x !== "").length;
                      const sum = Object.values(obj).reduce((acc, v) => acc + (Number(v) || 0), 0);
                      return (
                        <td key={j.id}>
                          {filled > 0 ? (
                            <span className="text-info">{sum} pts <span className="text-muted small">({filled}/5)</span></span>
                          ) : (
                            <span className="text-muted opacity-50 small">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Videoclip A */}
                  <tr>
                    <td className="text-start ps-4 opacity-75">Videoclip: {teamA}</td>
                    {jurors.map((j) => {
                      const obj = db[j.id]?.videoclip?.A || {};
                      const filled = Object.values(obj).filter(x => x !== "").length;
                      const sum = Object.values(obj).reduce((acc, v) => acc + (Number(v) || 0), 0);
                      return (
                        <td key={j.id}>
                          {filled > 0 ? (
                            <span className="text-warning">{sum} pts <span className="text-muted small">({filled}/6)</span></span>
                          ) : (
                            <span className="text-muted opacity-50 small">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Videoclip B */}
                  <tr>
                    <td className="text-start ps-4 opacity-75">Videoclip: {teamB}</td>
                    {jurors.map((j) => {
                      const obj = db[j.id]?.videoclip?.B || {};
                      const filled = Object.values(obj).filter(x => x !== "").length;
                      const sum = Object.values(obj).reduce((acc, v) => acc + (Number(v) || 0), 0);
                      return (
                        <td key={j.id}>
                          {filled > 0 ? (
                            <span className="text-info">{sum} pts <span className="text-muted small">({filled}/6)</span></span>
                          ) : (
                            <span className="text-muted opacity-50 small">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminView;
