/**
 * VoteDot — Pequeño círculo de color que representa un voto individual.
 * Usado en la vista de monitoreo live del Admin para mostrar cada ítem votado.
 *
 * @param {{ value: 'A'|'B'|null, index: number, teamA: string, teamB: string }} props
 */
const VoteDot = ({ value, index, teamA, teamB }) => (
  <span
    className="d-inline-flex align-items-center justify-content-center fw-bold rounded-circle shadow-sm"
    style={{
      width: '20px',
      height: '20px',
      fontSize: '9px',
      background:
        value === 'A'
          ? '#ff9800'
          : value === 'B'
          ? '#2196f3'
          : 'rgba(255,255,255,0.15)',
      color: value ? '#000' : 'rgba(255,255,255,0.4)',
      border: value ? 'none' : '1px solid rgba(255,255,255,0.1)',
      transition: 'all 0.3s ease',
    }}
    title={`Ronda ${index + 1}: ${value ? (value === 'A' ? teamA : teamB) : 'Pendiente'}`}
  >
    {value || '-'}
  </span>
);

export default VoteDot;
