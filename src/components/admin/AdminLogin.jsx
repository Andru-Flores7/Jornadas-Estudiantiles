import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const AdminLogin = ({ onLoginSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('Credenciales inválidas. Verifica tu correo y contraseña.');
        } else {
          setErrorMsg(error.message);
        }
        return;
      }

      if (data?.session) {
        onLoginSuccess(data.session);
      }
    } catch (err) {
      setErrorMsg('Error de conexión o configuración. Inténtalo nuevamente.');
      console.error('Error logging in:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100 py-4">
      <div
        className="card shadow-lg p-4 p-md-5 border-0"
        style={{
          maxWidth: '460px',
          width: '100%',
          borderRadius: '24px',
          background: 'var(--bs-body-bg, #ffffff)',
        }}
      >
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3"
            style={{ width: '70px', height: '70px', fontSize: '2rem' }}
          >
            🛡️
          </div>
          <h2 className="fw-bold mb-1">Acceso Administrador</h2>
          <p className="text-muted small">
            Ingresa tus credenciales de Supabase para gestionar el evento
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center">
            <span className="me-2">⚠️</span>
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold small text-secondary">
              Correo Electrónico
            </label>
            <input
              type="email"
              className="form-control form-control-lg fs-6"
              placeholder="admin@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold small text-secondary">
              Contraseña
            </label>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control form-control-lg fs-6"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-primary btn-lg fw-bold shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
            <button
              type="button"
              className="btn btn-light btn-lg text-secondary fw-semibold mt-1"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar y volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
