import geekLogo from '../assets/GEEK STORE LOGO.png';

const GlobalFooter = () => {
  return (
    <footer className="d-flex  mt-auto py-1 text-center bg-dark text-white bg-opacity-10">
      <div className="container border-top border-secondary border-opacity-25 pt-5">
        <img
          src={geekLogo}
          alt="Geek Store"
          style={{ 
            height: "70px", 
            marginBottom: "15px", 
            filter: "drop-shadow(0 0 15px rgba(255,152,0,0.4))",
            transition: "transform 0.3s ease"
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        />
        
        <div className="text-uppercase fw-bold tracking-widest small mb-1 opacity-75" style={{letterSpacing: '2px'}}>
          Sistema de Gestión Digital - <span style={{color: '#ff9800'}}>Jornadas Estudiantiles 2026</span>
        </div>
        
        <div className="small opacity-50 mb-2 d-flex align-items-center justify-content-center gap-2">
          <span>Versión 1.0</span>
          <span className="opacity-25">|</span>
         
        </div>
        
        <div className="mx-auto my-2" style={{ height: '1px', width: '60px', background: 'linear-gradient(to right, transparent, #ff9800, transparent)' }}></div>
        
        <div className="fw-bold mb-1" style={{fontSize: '0.9rem'}}>© 2026 GEEK STORE "Creative Tech Solutions"</div>
        <div className="small opacity-50">
          Soporte Técnico: <a href="mailto:geekstoretech@gmail.com" className="text-decoration-none" style={{color: '#ffb74d'}}>geekstoretech@gmail.com</a>
        </div>
      </div>
    </footer>
  );
};

export default GlobalFooter;
