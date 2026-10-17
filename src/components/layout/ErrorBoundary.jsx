import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center px-4"
          style={{ background: "linear-gradient(135deg, #1a1a1a, #2c3e50)" }}
        >
          <div
            className="card border-0 shadow-lg p-5"
            style={{ maxWidth: "500px", borderRadius: "24px", background: "rgba(255,255,255,0.05)" }}
          >
            <div style={{ fontSize: "4rem" }}>⚠️</div>
            <h3 className="text-white fw-bold mt-3">Algo salió mal</h3>
            <p className="text-white opacity-75 mb-4">
              Ocurrió un error inesperado. Por favor recarga la página.
            </p>
            <code
              className="d-block text-warning small mb-4 p-3 rounded"
              style={{ background: "rgba(0,0,0,0.3)", wordBreak: "break-word" }}
            >
              {this.state.error?.message}
            </code>
            <button
              className="btn btn-primary fw-bold"
              style={{ borderRadius: "12px" }}
              onClick={() => window.location.reload()}
            >
              🔄 Recargar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
