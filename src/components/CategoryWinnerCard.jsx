import React from "react";

const CategoryWinnerCard = ({ label, a, b, teamA, teamB, hasData }) => {
  const winner = !hasData ? null : a === b ? "EMPATE" : a > b ? teamA : teamB;
  return (
    <div
      className="card border-0 shadow-lg text-white mb-5"
      style={{
        background: "linear-gradient(135deg, #2c3e50, #000000)",
        borderRadius: "20px",
        overflow: "hidden",
        minHeight: "180px",
      }}
    >
      <div className="card-body p-3 d-flex flex-column justify-content-between text-center">
        <div
          className="text-uppercase opacity-75 fw-bold mb-3 mt-2"
          style={{
            fontSize: "clamp(1rem, 1.5vw, 1.4rem)",
            letterSpacing: "2px",
          }}
        >
          {label}
        </div>

        <div className="d-flex align-items-center justify-content-around my-3">
          <div className="text-center" style={{ flex: 1 }}>
            <div
              className="m-0 fw-bold"
              style={{
                color: "#ff9800",
                fontSize: "clamp(3rem, 5vw, 4.5rem)",
                lineHeight: "1",
              }}
            >
              {a}
            </div>
            <div
              className="opacity-75 fw-bold mt-2 px-2"
              style={{ fontSize: "clamp(0.85rem, 1vw, 1.1rem)" }}
            >
              {teamA}
            </div>
          </div>
          <div
            className="opacity-25 fw-bold mx-2"
            style={{ fontSize: "clamp(1.5rem, 2vw, 2rem)" }}
          >
            VS
          </div>
          <div className="text-center" style={{ flex: 1 }}>
            <div
              className="m-0 fw-bold"
              style={{
                color: "#ff9800",
                fontSize: "clamp(3rem, 5vw, 4.5rem)",
                lineHeight: "1",
              }}
            >
              {b}
            </div>
            <div
              className="opacity-75 fw-bold mt-2 px-2"
              style={{ fontSize: "clamp(0.85rem, 1vw, 1.1rem)" }}
            >
              {teamB}
            </div>
          </div>
        </div>

        <div className="mt-3 mb-2 px-2">
          {winner ? (
            <div
              className="py-2 px-3 rounded-pill shadow-sm d-inline-block w-100"
              style={{
                background: "linear-gradient(to right, #ba8b02, #ffd700)",
                color: "#000",
                fontSize: "clamp(0.9rem, 1.2vw, 1.2rem)",
                fontWeight: "900",
              }}
            >
              🏆 {winner === "EMPATE" ? "EMPATE" : `GANADOR: ${winner}`}
            </div>
          ) : (
            <div
              className="py-2 px-3 rounded-pill border border-secondary opacity-25 d-inline-block w-100"
              style={{ fontSize: "clamp(0.9rem, 1.2vw, 1.2rem)" }}
            >
              PENDIENTE
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryWinnerCard;
