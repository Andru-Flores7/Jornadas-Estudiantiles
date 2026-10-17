/**
 * generatePDF — Genera y descarga el comprobante oficial de resultados en PDF.
 *
 * Función pura separada del componente para facilitar pruebas y mantenimiento.
 *
 * @param {{ db, jurors, config, jurorResults, calculateConsensus }} options
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import confetti from 'canvas-confetti';
import { calculateConsensus } from '../../utils/scoring';

export const generatePDF = ({ db, jurors, config, jurorResults }) => {
  console.log('Iniciando generación de PDF...');
  try {
    try {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    } catch (err) {
      console.warn('Confetti error:', err);
    }

    const { teamA, teamB, matchNo } = config;
    const doc = new jsPDF();

    // ── Encabezado ──────────────────────────────────────────────────────
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('Jornadas Estudiantiles 2026', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.text(`Comprobante de Resultados - Encuentro #${matchNo}`, 105, 30, { align: 'center' });
    doc.line(20, 35, 190, 35);

    doc.setFontSize(12);
    doc.text(`Encuentro: #${matchNo}`, 20, 45);
    doc.text(
      `Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      130, 45,
    );

    doc.setFontSize(16);
    doc.text(`${teamA} vs ${teamB}`, 105, 55, { align: 'center' });

    // ── Tabla por jurado ─────────────────────────────────────────────────
    const jurorRows = jurorResults.map((jr) => {
      const j = jurors.find((x) => x.id === jr.id);
      return [
        j.label,
        jr.result ? jr.result.totalA : '-',
        jr.result ? jr.result.totalB : '-',
        db[jr.id]?.submitted ? 'ENVIADO' : 'PENDIENTE',
      ];
    });

    autoTable(doc, {
      startY: 65,
      head: [['Jurado', `Puntos ${teamA}`, `Puntos ${teamB}`, 'Estado']],
      body: jurorRows,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    // ── Tabla de resultado final (consenso) ──────────────────────────────
    const consensus = calculateConsensus(db, jurors);
    const winner =
      consensus.totalA === consensus.totalB
        ? 'EMPATE'
        : consensus.totalA > consensus.totalB
        ? teamA
        : teamB;

    const nextY =
      doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : 120;

    autoTable(doc, {
      startY: nextY,
      head: [['RESULTADO FINAL (CONSENSO)', teamA, teamB, 'GANADOR']],
      body: [[
        'PUNTAJE FINAL VALIDADO',
        consensus.totalA.toString(),
        consensus.totalB.toString(),
        { content: winner, styles: { fontStyle: 'bold', textColor: [39, 174, 96] } },
      ]],
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], textColor: 255 },
      styles: { fontSize: 14 },
    });

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      'Este documento es un comprobante digital generado por el sistema de puntuación.',
      105, 280,
      { align: 'center' },
    );

    doc.save(`Resultado_Encuentro_${matchNo}_${teamA}_vs_${teamB}.pdf`);
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    alert('Hubo un error al generar el PDF.');
  }
};
