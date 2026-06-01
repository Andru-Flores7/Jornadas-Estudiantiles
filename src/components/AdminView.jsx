import React, { useState, useMemo } from "react";
import { supabase } from "../supabase";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import confetti from "canvas-confetti";
import { calculateConsensus, calculateFinal } from "../utils/scoring";
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
            {jurorResults.map((jr) => {
              const j = jurors.find((x) => x.id === jr.id);
              return (
                <div
                  key={jr.id}
                  className={`card shadow-sm border-0 p-3 text-center flex-grow-1 d-flex flex-column justify-content-center ${db[jr.id]?.submitted ? "border-start border-success border-5" : "opacity-50"}`}
                >
                  <h6 className="mb-1">{j.label}</h6>
                  <div className="small text-uppercase opacity-50 mb-2">
                    {db[jr.id]?.submitted ? "✅ Recibido" : "⏳ Pendiente"}
                  </div>
                  <b className="h5 mb-0">
                    {teamA}: {jr.result ? jr.result.totalA : "-"} |{" "}
                    {teamB}: {jr.result ? jr.result.totalB : "-"}
                  </b>
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
    </div>
  );
};

export default AdminView;
