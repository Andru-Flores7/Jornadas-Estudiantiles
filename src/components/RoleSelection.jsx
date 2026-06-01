import React from "react";

const RoleSelection = ({ onSelect, config }) => (
  <div className="container d-flex align-items-center justify-content-center min-vh-100">
    <div
      className="card shadow-lg p-5 text-center border-0"
      style={{ maxWidth: "600px", width: "100%", borderRadius: "24px" }}
    >
      <h1 className="fw-bold text-primary mb-4">Jornadas Estudiantiles 2026</h1>
      <div className="row g-3">
        {["juror1", "juror2", "juror3"].map((id) => (
          <div className="col-12" key={id}>
            <button
              className="btn btn-outline-primary btn-lg w-100 py-3 fw-bold"
              onClick={() => onSelect(id)}
            >
              Acceso {config.jurors[id]}
            </button>
          </div>
        ))}
        <div className="col-12 mt-3">
          <button
            className="btn btn-dark btn-lg w-100 py-3 fw-bold shadow"
            onClick={() => onSelect("admin")}
          >
            🛡️ Administrador
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default RoleSelection;
