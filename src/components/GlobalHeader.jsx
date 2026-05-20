import logoLeft from '../assets/1000760758-removebg-preview.png';
import logoRight from '../assets/logo.png';
const GlobalHeader = () => {
  return (
    <header 
      className="py-3 px-4 backdrop-blur shadow-sm sticky-top"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1050
      }}
    >
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Logo Izquierdo */}
        <div className="d-flex  align-items-center" style={{ width: '150px' }}>
          <img 
            src={logoLeft} 
            alt="Logo Primario" 
            style={{ height: '75px', width: 'auto', objectFit: 'contain' }}
            className="img-fluid"
          />
        </div>

        {/* Título / Branding Central */}
        <div className="text-center flex-grow-1">
          <h2 className="m-0 fw-bold text-uppercase tracking-tighter" style={{ fontSize: '1.25rem', letterSpacing: '1.5px' }}>
            <span className="text-white" style={{ fontSize: '22px' }}>Jornadas</span>{' '}
            <span style={{ color: '#ba8b02' , fontSize: '22px' }}>Estudiantiles</span>{' '}
            <span className="text-white opacity-75" style={{ fontStyle: '24px' }}>2026</span>
          </h2>
        </div>

        {/* Logo Derecho  */}
      
          <div className="d-flex align-items-center" style={{ width: '85px' }}>
          <img 
            src={logoRight} 
            alt="Logo Primario" 
            style={{ height: '85px', width: 'auto', objectFit: 'contain' }}
            className="img-fluid"
          />
        
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
