import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from './supabase';

// --- INITIAL STATE ---
const createInitialJurorState = () => ({
  submitted: false,
  header: { jury: '', matchNo: '', teamA: 'Equipo A', teamB: 'Equipo B' },
  juegos: Array(3).fill(null),
  popurri: Array(10).fill(null),
  mascota: Array(4).fill(null),
  ritmo1: {
    A: { vestimenta: '', originalidad: '', desplazamiento: '', coordinacion: '', 'conexion en pareja': '' },
    B: { vestimenta: '', originalidad: '', desplazamiento: '', coordinacion: '', 'conexion en pareja': '' }
  },
  ritmo2: {
    A: { vestimenta: '', originalidad: '', desplazamiento: '', coordinacion: '', 'conexion en pareja': '' },
    B: { vestimenta: '', originalidad: '', desplazamiento: '', coordinacion: '', 'conexion en pareja': '' }
  },
  videoclip: {
    A: { 'cordinacion coreografica': '', 'composicion coreografica': '', 'adaptacion al tiempo musical': '', 'uso del espacio': '', 'impacto visual': '', carisma: '' },
    B: { 'cordinacion coreografica': '', 'composicion coreografica': '', 'adaptacion al tiempo musical': '', 'uso del espacio': '', 'impacto visual': '', carisma: '' }
  }
});

const calculateFinal = (data) => {
  if (!data) return { a: 0, b: 0 };
  const ptsJuegosA = data.juegos.filter(v => v === 'A').length * 6;
  const ptsJuegosB = data.juegos.filter(v => v === 'B').length * 6;
  
  const countPopA = data.popurri.filter(v => v === 'A').length, countPopB = data.popurri.filter(v => v === 'B').length;
  const prizePopA = (countPopA > countPopB && countPopA > 0) ? 4 : 0;
  const prizePopB = (countPopB > countPopA && countPopB > 0) ? 4 : 0;
  
  const countMasA = data.mascota.filter(v => v === 'A').length, countMasB = data.mascota.filter(v => v === 'B').length;
  const prizeMasA = (countMasA > countMasB && countMasA > 0) ? 4 : 0;
  const prizeMasB = (countMasB > countMasA && countMasB > 0) ? 4 : 0;
  
  const sumR1A = Object.values(data.ritmo1.A).reduce((acc,v)=>acc+(Number(v)||0),0);
  const sumR1B = Object.values(data.ritmo1.B).reduce((acc,v)=>acc+(Number(v)||0),0);
  const prizeR1A = (sumR1A > sumR1B && sumR1A > 0) ? 4 : 0;
  const prizeR1B = (sumR1B > sumR1A && sumR1B > 0) ? 4 : 0;
  
  const sumR2A = Object.values(data.ritmo2.A).reduce((acc,v)=>acc+(Number(v)||0),0);
  const sumR2B = Object.values(data.ritmo2.B).reduce((acc,v)=>acc+(Number(v)||0),0);
  const prizeR2A = (sumR2A > sumR2B && sumR2A > 0) ? 4 : 0;
  const prizeR2B = (sumR2B > sumR2A && sumR2B > 0) ? 4 : 0;
  
  const sumVidA = Object.values(data.videoclip.A).reduce((acc,v)=>acc+(Number(v)||0),0);
  const sumVidB = Object.values(data.videoclip.B).reduce((acc,v)=>acc+(Number(v)||0),0);
  const prizeVidA = (sumVidA > sumVidB && sumVidA > 0) ? 15 : 0;
  const prizeVidB = (sumVidB > sumVidA && sumVidB > 0) ? 15 : 0;
  
  return { 
    ptsJuegosA, ptsJuegosB,
    prizePopA, prizePopB,
    prizeMasA, prizeMasB,
    prizeR1A, prizeR1B,
    prizeR2A, prizeR2B,
    sumVidA, sumVidB,
    prizeVidA, prizeVidB,
    totalA: ptsJuegosA + prizePopA + prizeMasA + prizeR1A + prizeR2A + prizeVidA, 
    totalB: ptsJuegosB + prizePopB + prizeMasB + prizeR1B + prizeR2B + prizeVidB 
  };
};

const App = () => {
  const [role, setRole] = useState(null); 
  const [jurorData, setJurorData] = useState(createInitialJurorState());
  const [db, setDb] = useState({ juror1: null, juror2: null, juror3: null });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('jornadas_scores').select('*');
      if (data) {
        const newDb = { juror1: null, juror2: null, juror3: null };
        data.forEach(row => { newDb[row.juror_id] = row.payload; });
        setDb(newDb);
      }
    };
    fetchData();

    const channel = supabase.channel('jornadas_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jornadas_scores' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldJurorId = payload.old.juror_id;
          setDb(prev => ({ ...prev, [oldJurorId]: null }));
          if (role === oldJurorId) {
            setJurorData(createInitialJurorState());
          }
          return;
        }

        const newJurorId = payload.new.juror_id;
        const newPayload = payload.new.payload;

        setDb(prev => ({ ...prev, [newJurorId]: newPayload }));

        // Sincronizar cabecera entre jurados
        if (role && role !== 'admin' && newJurorId !== role) {
          setJurorData(prev => ({
            ...prev,
            header: {
              ...prev.header,
              teamA: newPayload.header.teamA || prev.header.teamA,
              teamB: newPayload.header.teamB || prev.header.teamB,
              matchNo: newPayload.header.matchNo || prev.header.matchNo
            }
          }));
        }
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [role]);

  const syncToSupabase = async (newData) => {
    if (!role || role === 'admin') return;
    setIsSyncing(true);
    await supabase.from('jornadas_scores').upsert({ juror_id: role, payload: newData, updated_at: new Date() });
    setIsSyncing(false);
  };

  const handleSelectRole = async (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole !== 'admin') {
      const { data } = await supabase.from('jornadas_scores').select('payload').eq('juror_id', selectedRole).single();
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
    if (window.confirm("¿ESTÁS SEGURO? Esto borrará todos los puntos de TODOS los jurados para iniciar un nuevo encuentro.")) {
      const { error } = await supabase.from('jornadas_scores').delete().neq('juror_id', 'null_check');
      if (!error) {
        setDb({ juror1: null, juror2: null, juror3: null });
        alert("Base de datos reseteada correctamente.");
      }
    }
  };

  if (!role) return <RoleSelection onSelect={handleSelectRole} />;
  if (role === 'admin') return <AdminView db={db} onBack={() => setRole(null)} onReset={handleReset} />;
  
  return (
    <JurorView 
      role={role} 
      data={jurorData} 
      setData={(d) => { setJurorData(d); syncToSupabase(d); }} 
      onSave={handleSave} 
      onBack={() => setRole(null)}
      isSyncing={isSyncing}
    />
  );
};

// --- COMPONENTES ---
const RoleSelection = ({ onSelect }) => (
  <div className="container d-flex align-items-center justify-content-center min-vh-100">
    <div className="card shadow-lg p-5 text-center border-0" style={{ maxWidth: '600px', width: '100%', borderRadius: '24px' }}>
      <h1 className="fw-bold text-primary mb-4">Jornadas 2026</h1>
      <div className="row g-3">
        {['juror1', 'juror2', 'juror3'].map((id, index) => (
          <div className="col-12" key={id}><button className="btn btn-outline-primary btn-lg w-100 py-3 fw-bold" onClick={() => onSelect(id)}>Acceso Jurado {index + 1}</button></div>
        ))}
        <div className="col-12 mt-3"><button className="btn btn-dark btn-lg w-100 py-3 fw-bold shadow" onClick={() => onSelect('admin')}>🛡️ Administrador</button></div>
      </div>
    </div>
  </div>
);

const JurorView = ({ role, data, setData, onSave, onBack, isSyncing }) => {
  const calc = useMemo(() => calculateFinal(data), [data]);

  const handleScoreChange = (section, team, criterion, value, max) => {
    if (value === '' || (Number(value) >= 1 && Number(value) <= max)) {
      setData({ ...data, [section]: { ...data[section], [team]: { ...data[section][team], [criterion]: value } } });
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100 pb-5">
      <div className="card d-flex flex-row justify-content-between align-items-center mb-4 p-3 border-0">
        <button className="btn btn-sm btn-outline-light opacity-75" onClick={onBack}>
          <span className="me-1">←</span> Volver
        </button>
        <h5 className="m-0 fw-bold text-uppercase tracking-wider">
          <span className="text-primary">Planilla</span> Jurado {role.slice(-1)}
        </h5>
        <div className="badge bg-success">{isSyncing ? 'Sincronizando...' : 'Conectado'}</div>
      </div>

      <header className="card border-0 mb-4 p-4 text-white" style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(186, 139, 2, 0.15))', backdropFilter: 'blur(10px)' }}>
        <div className="row g-4 align-items-end">
          <div className="col-md-2">
            <label className="form-label small text-uppercase fw-bold opacity-75 mb-2">Encuentro</label>
            <input type="number" className="form-control form-control-lg text-center" value={data.header.matchNo} onChange={(e) => setData({...data, header: {...data.header, matchNo: e.target.value}})} />
          </div>
          <div className="col-md-5">
            <label className="form-label small text-uppercase fw-bold opacity-75 mb-2">Equipo A</label>
            <input type="text" className="form-control form-control-lg" value={data.header.teamA} onChange={(e) => setData({...data, header: {...data.header, teamA: e.target.value}})} />
          </div>
          <div className="col-md-5">
            <label className="form-label small text-uppercase fw-bold opacity-75 mb-2">Equipo B</label>
            <input type="text" className="form-control form-control-lg" value={data.header.teamB} onChange={(e) => setData({...data, header: {...data.header, teamB: e.target.value}})} />
          </div>
        </div>
      </header>

      <main className="row g-4">
        {/* JUEGOS */}
        <section className="col-12"><div className="card shadow-sm border-0"><div className="card-header text-white fw-bold">JUEGOS (6 pts c/u)</div><div className="card-body p-0"><table className="table table-bordered text-center m-0"><thead><tr><th>Juego</th><th>{data.header.teamA}</th><th>{data.header.teamB}</th></tr></thead><tbody>{[0, 1, 2].map(i => (<tr key={i}><td>#{i+1}</td><td><button className={`btn btn-lg ${data.juegos[i]==='A'?'btn-success':'btn-light'}`} onClick={()=>{const n=[...data.juegos];n[i]=n[i]==='A'?null:'A';setData({...data,juegos:n})}}>X</button></td><td><button className={`btn btn-lg ${data.juegos[i]==='B'?'btn-success':'btn-light'}`} onClick={()=>{const n=[...data.juegos];n[i]=n[i]==='B'?null:'B';setData({...data,juegos:n})}}>X</button></td></tr>))}</tbody></table></div></div></section>
        {/* POPURRI */}
        <section className="col-12"><div className="card shadow-sm border-0"><div className="card-header text-white fw-bold">POPURRÍ (Premio: 4 pts)</div><div className="card-body p-0 overflow-auto"><table className="table table-bordered text-center m-0"><thead><tr><th>Equipo</th>{[...Array(10)].map((_,i)=><th key={i}>{i+1}</th>)}<th>Premio</th></tr></thead><tbody>{['A', 'B'].map(team => (<tr key={team}><td>{team==='A'?data.header.teamA:data.header.teamB}</td>{data.popurri.map((v, i)=>(<td key={i}><button className={`btn btn-sm ${v===team?'btn-primary':'btn-light'}`} style={{width:'30px'}} onClick={()=>{const n=[...data.popurri];n[i]=n[i]===team?null:team;setData({...data,popurri:n})}}>X</button></td>))}<td className="fw-bold">{team==='A'?calc.prizePopA:calc.prizePopB}</td></tr>))}</tbody></table></div></div></section>
        
        {/* POPURRI ALTERNATIVO DE LA MASCOTA */}
        <section className="col-12"><div className="card shadow-sm border-0"><div className="card-header text-white fw-bold">POPURRÍ ALTERNATIVO DE LA MASCOTA (Premio: 4 pts)</div><div className="card-body p-0 overflow-auto"><table className="table table-bordered text-center m-0"><thead><tr><th>Equipo</th>{[...Array(4)].map((_,i)=><th key={i}>{i+1}</th>)}<th>Premio</th></tr></thead><tbody>{['A', 'B'].map(team => (<tr key={team}><td>{team==='A'?data.header.teamA:data.header.teamB}</td>{data.mascota.map((v, i)=>(<td key={i}><button className={`btn btn-sm ${v===team?'btn-primary':'btn-light'}`} style={{width:'30px'}} onClick={()=>{const n=[...data.mascota];n[i]=n[i]===team?null:team;setData({...data,mascota:n})}}>X</button></td>))}<td className="fw-bold">{team==='A'?calc.prizeMasA:calc.prizeMasB}</td></tr>))}</tbody></table></div></div></section>
        {/* RITMOS (DOS TABLAS) */}
        {['ritmo1', 'ritmo2'].map((rit, idx) => (
          <section className="col-lg-6" key={rit}>
            <div className="card shadow-sm border-0">
              <div className="card-header text-white fw-bold">RITMO {idx + 1} (1-5 pts | Premio: 4 pts)</div>
              <div className="card-body">
                <div className="row g-3">
                  {['A', 'B'].map(team => (
                    <div className="col-6" key={team}>
                      <h6 className="small text-uppercase fw-bold opacity-75">{team === 'A' ? data.header.teamA : data.header.teamB}</h6>
                      <table className="table table-sm table-bordered text-center">
                        <tbody>
                          {['vestimenta', 'originalidad', 'desplazamiento', 'coordinacion', 'conexion en pareja'].map(c => (
                            <tr key={c}>
                              <td className="text-start small opacity-75">{c}</td>
                              <td><input type="number" className="form-control form-control-sm text-center mx-auto" value={data[rit][team][c]} onChange={(e) => handleScoreChange(rit, team, c, e.target.value, 5)} /></td>
                            </tr>
                          ))}
                          <tr className="table-warning"><td>Suma</td><td>{Object.values(data[rit][team]).reduce((a,v)=>a+(Number(v)||0),0)}</td></tr>
                          <tr className="table-success"><td>Premio</td><td>{team === 'A' ? (idx === 0 ? calc.prizeR1A : calc.prizeR2A) : (idx === 0 ? calc.prizeR1B : calc.prizeR2B)}</td></tr>
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
        <section className="col-12"><div className="card shadow-sm border-0"><div className="card-header text-white fw-bold">VIDEOCLIP (1-8 pts | Premio: 15 pts)</div><div className="card-body"><div className="row g-4">{['A', 'B'].map(team => (<div className="col-md-6" key={team}><h6>{team==='A'?data.header.teamA:data.header.teamB}</h6><table className="table table-sm table-bordered text-center"><tbody>{[{k:'cordinacion coreografica',l:'Coordinación coreográfica'},{k:'composicion coreografica',l:'composicion coreografica'},{k:'adaptacion al tiempo musical',l:'Adaptación al tiempo musical'},{k:'uso del espacio',l:'Uso del espacio'},{k:'impacto visual',l:'Impacto visual'},{k:'carisma',l:'Carisma'}].map(c=>(<tr key={c.k}><td className="text-start small">{c.l}</td><td><input type="number" className="form-control form-control-sm text-center mx-auto" value={data.videoclip[team][c.k]} onChange={(e)=>handleScoreChange('videoclip',team,c.k,e.target.value,8)} /></td></tr>))}<tr className="table-warning"><td>Suma</td><td>{team==='A'?calc.sumVidA:calc.sumVidB}</td></tr><tr className="table-success"><td>Premio</td><td>{team==='A'?calc.prizeVidA:calc.prizeVidB}</td></tr></tbody></table></div>))}</div></div></div></section>
      </main>

      <footer className="fixed-bottom py-3 px-4">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex gap-4 align-items-center">
            <div className="text-center">
              <div className="small text-uppercase opacity-50 fw-bold" style={{ fontSize: '0.65rem' }}>{data.header.teamA}</div>
              <div className="h5 m-0 fw-bold text-primary">{calc.totalA}</div>
            </div>
            <div className="vr h-100 opacity-25"></div>
            <div className="text-center">
              <div className="small text-uppercase opacity-50 fw-bold" style={{ fontSize: '0.65rem' }}>{data.header.teamB}</div>
              <div className="h5 m-0 fw-bold text-primary">{calc.totalB}</div>
            </div>
          </div>
          <button className="btn btn-success px-5 py-2 fw-bold shadow-sm" onClick={onSave}>
            🚀 ENVIAR RESULTADOS
          </button>
        </div>
      </footer>
    </div>
  );
};

const AdminView = ({ db, onBack, onReset }) => {
  const jurorWithNames = Object.values(db).find(p => p && p.header && p.header.teamA !== 'Equipo A') || { header: { teamA: 'Equipo A', teamB: 'Equipo B' } };
  const teamA = jurorWithNames.header.teamA;
  const teamB = jurorWithNames.header.teamB;

  const jurors = [{id:'juror1',label:'Jurado 1'},{id:'juror2',label:'Jurado 2'},{id:'juror3',label:'Jurado 3'}];
  const submitted = jurors.filter(j => db[j.id]?.submitted);
  const totalA = submitted.reduce((acc, j) => acc + calculateFinal(db[j.id]).totalA, 0);
  const totalB = submitted.reduce((acc, j) => acc + calculateFinal(db[j.id]).totalB, 0);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between mb-4"><button className="btn btn-outline-secondary btn-sm" onClick={onBack}>Volver</button><button className="btn btn-danger btn-sm" onClick={onReset}>🧹 Limpiar Evento</button></div>
      <h2 className="text-center fw-bold mb-5 text-uppercase">Resultados de {teamA} vs {teamB}</h2>
      <div className="row g-4 mb-5">
        {jurors.map(j => (<div className="col-md-4" key={j.id}><div className={`card shadow-sm border-0 p-3 text-center ${db[j.id]?.submitted ? 'border-top border-success border-4':'opacity-50'}`}><h6>{j.label}</h6><b>{teamA}: {db[j.id]?calculateFinal(db[j.id]).totalA:'-'} | {teamB}: {db[j.id]?calculateFinal(db[j.id]).totalB:'-'}</b></div></div>))}
      </div>
      <div className="card shadow-lg bg-dark bg-opacity-75 text-white p-5 text-center border-0 backdrop-blur" style={{borderRadius:'30px'}}>
        <div className="row justify-content-center align-items-center">
          <div className="col-md-5"><div className="display-1 fw-bold text-info">{totalA}</div><h4 className="text-uppercase">{teamA}</h4></div>
          <div className="col-md-2 display-4 opacity-25">VS</div>
          <div className="col-md-5"><div className="display-1 fw-bold text-info">{totalB}</div><h4 className="text-uppercase">{teamB}</h4></div>
        </div>
        <div className="mt-5">
          <div className="winner-badge shadow-lg">
            <h2 className="m-0 fw-bolder text-uppercase tracking-tighter">
              🏆 GANADOR: {totalA === totalB ? 'EMPATE' : (totalA > totalB ? teamA : teamB)}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
