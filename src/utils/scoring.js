// --- INITIAL STATE ---
export const createInitialJurorState = () => ({
  submitted: false,
  header: { jury: "", matchNo: "", teamA: "Equipo A", teamB: "Equipo B" },
  juegos: Array(3).fill(null),
  napolitana: null,
  popurri: Array(11).fill(null),
  mascota: Array(5).fill(null),
  ritmo1: {
    A: {
      vestimenta: "",
      originalidad: "",
      desplazamiento: "",
      coordinacion: "",
      "conexion en pareja": "",
      escenografia: "",
    },
    B: {
      vestimenta: "",
      originalidad: "",
      desplazamiento: "",
      coordinacion: "",
      "conexion en pareja": "",
      escenografia: "",
    },
  },
  ritmo2: {
    A: {
      vestimenta: "",
      originalidad: "",
      desplazamiento: "",
      coordinacion: "",
      "conexion en pareja": "",
      escenografia: "",
    },
    B: {
      vestimenta: "",
      originalidad: "",
      desplazamiento: "",
      coordinacion: "",
      "conexion en pareja": "",
      escenografia: "",
    },
  },
  ritmo3: {
    A: {
      vestimenta: "",
      originalidad: "",
      desplazamiento: "",
      coordinacion: "",
      "conexion en pareja": "",
      escenografia: "",
    },
    B: {
      vestimenta: "",
      originalidad: "",
      desplazamiento: "",
      coordinacion: "",
      "conexion en pareja": "",
      escenografia: "",
    },
  },
  videoclip: {
    A: {
      "cordinacion coreografica": "",
      "composicion coreografica": "",
      "adaptacion al tiempo musical": "",
      "uso del espacio": "",
      "trabajo en equipo": "",
      carisma: "",
      escenografia: "",
    },
    B: {
      "cordinacion coreografica": "",
      "composicion coreografica": "",
      "adaptacion al tiempo musical": "",
      "uso del espacio": "",
      "trabajo en equipo": "",
      carisma: "",
      escenografia: "",
    },
  },
});

export const normalizePayload = (payload) => {
  if (!payload) return payload;
  
  const newPayload = {
    ...payload,
    juegos: Array.isArray(payload.juegos) ? [...payload.juegos] : Array(3).fill(null),
    popurri: Array.isArray(payload.popurri) ? [...payload.popurri] : Array(11).fill(null),
  };

  if (payload.mascota && Array.isArray(payload.mascota)) {
    const newMascota = [...payload.mascota];
    while (newMascota.length < 5) {
      newMascota.push(null);
    }
    newPayload.mascota = newMascota.slice(0, 5);
  } else {
    newPayload.mascota = Array(5).fill(null);
  }
  
  return newPayload;
};

export const initialConfig = {
  teamA: "Equipo A",
  teamB: "Equipo B",
  matchNo: "1",
  jurors: {
    juror1: "Jurado 1",
    juror2: "Jurado 2",
    juror3: "Jurado 3",
    juror4: "Jurado 4",
  },
};

export const calculateFinal = (data) => {
  if (!data) return { a: 0, b: 0 };
  // Cada juego ganado otorga 6 puntos (acumulativo, máximo 18 pts)
  const ptsJuegosA = data.juegos.filter((v) => v === "A").length * 6;
  const ptsJuegosB = data.juegos.filter((v) => v === "B").length * 6;

  // Napolitana: solo declara ganador, no suma puntos
  const napWinner = data.napolitana || null;
  const prizeNapA = napWinner === "A" ? 1 : 0; // 1 = ganó (simbólico, no suma al total)
  const prizeNapB = napWinner === "B" ? 1 : 0;

  const countPopA = data.popurri.filter((v) => v === "A").length,
    countPopB = data.popurri.filter((v) => v === "B").length;
  const prizePopA = countPopA > countPopB && countPopA > 0 ? 4 : 0;
  const prizePopB = countPopB > countPopA && countPopB > 0 ? 4 : 0;

  const countMasA = data.mascota.filter((v) => v === "A").length,
    countMasB = data.mascota.filter((v) => v === "B").length;
  const prizeMasA = countMasA > countMasB && countMasA > 0 ? 3 : 0;
  const prizeMasB = countMasB > countMasA && countMasB > 0 ? 3 : 0;

  const sumR1A = Object.values(data.ritmo1.A).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const sumR1B = Object.values(data.ritmo1.B).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const prizeR1A = sumR1A > sumR1B && sumR1A > 0 ? 4 : 0;
  const prizeR1B = sumR1B > sumR1A && sumR1B > 0 ? 4 : 0;

  const sumR2A = Object.values(data.ritmo2.A).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const sumR2B = Object.values(data.ritmo2.B).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const prizeR2A = sumR2A > sumR2B && sumR2A > 0 ? 4 : 0;
  const prizeR2B = sumR2B > sumR2A && sumR2B > 0 ? 4 : 0;

  const sumR3A = Object.values(data.ritmo3.A).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const sumR3B = Object.values(data.ritmo3.B).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const prizeR3A = sumR3A > sumR3B && sumR3A > 0 ? 4 : 0;
  const prizeR3B = sumR3B > sumR3A && sumR3B > 0 ? 4 : 0;

  const sumVidA = Object.values(data.videoclip.A).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const sumVidB = Object.values(data.videoclip.B).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const prizeVidA = sumVidA > sumVidB && sumVidA > 0 ? 15 : 0;
  const prizeVidB = sumVidB > sumVidA && sumVidB > 0 ? 15 : 0;

  return {
    ptsJuegosA,
    ptsJuegosB,
    prizeNapA,
    prizeNapB,
    prizePopA,
    prizePopB,
    prizeMasA,
    prizeMasB,
    prizeR1A,
    prizeR1B,
    prizeR2A,
    prizeR2B,
    prizeR3A,
    prizeR3B,
    sumVidA,
    sumVidB,
    prizeVidA,
    prizeVidB,
    // napolitana no suma al total
    totalA:
      ptsJuegosA + prizePopA + prizeMasA + prizeR1A + prizeR2A + prizeR3A + prizeVidA,
    totalB:
      ptsJuegosB + prizePopB + prizeMasB + prizeR1B + prizeR2B + prizeR3B + prizeVidB,
  };
};

export const isCategoryFullyVoted = (db, jurors, category) => {
  if (!db) return false;
  return jurors.every((j) => db[j.id]?.submitted === true);
};

export const calculateConsensus = (db, jurors) => {
  const jurorIds = jurors.map((j) => j.id);
  const individualResults = jurorIds.map((id) => calculateFinal(db[id]));

  // 1. Juegos: Cada juego ganado por consenso otorga 6 puntos (acumulativo)
  let juegosA = 0, juegosB = 0;
  const individualGames = [];
  for (let i = 0; i < 3; i++) {
    const gameFinished = jurorIds.every(
      (id) =>
        db[id]?.juegos?.[i] !== null &&
        db[id]?.juegos?.[i] !== undefined &&
        db[id]?.juegos?.[i] !== ""
    );
    if (gameFinished) {
      let votesA = 0,
        votesB = 0;
      jurorIds.forEach((id) => {
        if (db[id]?.juegos?.[i] === "A") votesA++;
        if (db[id]?.juegos?.[i] === "B") votesB++;
      });
      const gameWinner = votesA > votesB ? "A" : votesB > votesA ? "B" : null;
      if (gameWinner === "A") juegosA += 6;
      else if (gameWinner === "B") juegosB += 6;
      individualGames.push(gameWinner);
    } else {
      individualGames.push(null);
    }
  }

  // 2. Función genérica para premios por mayoría
  const getConsensusPrize = (keyA, keyB, points, categoryKey) => {
    if (!isCategoryFullyVoted(db, jurors, categoryKey)) {
      return { a: 0, b: 0 };
    }
    let winA = 0,
      winB = 0;
    individualResults.forEach((r, idx) => {
      if (db[jurorIds[idx]]) {
        if (r[keyA] > r[keyB]) winA++;
        else if (r[keyB] > r[keyA]) winB++;
      }
    });
    if (winA > winB) return { a: points, b: 0 };
    if (winB > winA) return { a: 0, b: points };
    return { a: 0, b: 0 };
  };

  const nap = getConsensusPrize("prizeNapA", "prizeNapB", 1, "napolitana"); // simbólico, no suma al total
  const pop = getConsensusPrize("prizePopA", "prizePopB", 4, "popurri");
  const mas = getConsensusPrize("prizeMasA", "prizeMasB", 3, "mascota");
  const r1 = getConsensusPrize("prizeR1A", "prizeR1B", 4, "ritmo1");
  const r2 = getConsensusPrize("prizeR2A", "prizeR2B", 4, "ritmo2");
  const r3 = getConsensusPrize("prizeR3A", "prizeR3B", 4, "ritmo3");
  const vidPrize = getConsensusPrize("prizeVidA", "prizeVidB", 15, "videoclip");

  const breakdown = {
    juegosA,
    juegosB,
    individualGames, // [A, B, null]
    napA: nap.a, // simbólico
    napB: nap.b,
    popA: pop.a,
    popB: pop.b,
    masA: mas.a,
    masB: mas.b,
    r1A: r1.a,
    r1B: r1.b,
    r2A: r2.a,
    r2B: r2.b,
    r3A: r3.a,
    r3B: r3.b,
    vidA: vidPrize.a,
    vidB: vidPrize.b,
  };

  return {
    // napolitana NO suma al total
    totalA: juegosA + pop.a + mas.a + r1.a + r2.a + r3.a + breakdown.vidA,
    totalB: juegosB + pop.b + mas.b + r1.b + r2.b + r3.b + breakdown.vidB,
    breakdown,
  };
};

export const calculateJurorProgress = (data) => {
  if (!data) {
    return {
      isStarted: false,
      submitted: false,
      juegos: { filled: 0, total: 3 },
      napolitana: { filled: 0, total: 1 },
      popurri: { filled: 0, total: 11 },
      mascota: { filled: 0, total: 5 },
      ritmo1: { filled: 0, total: 12 },
      ritmo2: { filled: 0, total: 12 },
      ritmo3: { filled: 0, total: 12 },
      videoclip: { filled: 0, total: 14 },
      totalFilled: 0,
      totalItems: 70,
      pct: 0,
    };
  }

  const juegosFilled = data.juegos ? data.juegos.filter(x => x !== null && x !== "").length : 0;
  const napolitanaFilled = (data.napolitana !== null && data.napolitana !== undefined && data.napolitana !== "") ? 1 : 0;
  const popurriFilled = data.popurri ? data.popurri.filter(x => x !== null && x !== "").length : 0;
  const mascotaFilled = data.mascota ? data.mascota.filter(x => x !== null && x !== "").length : 0;

  const ritmo1Filled = data.ritmo1
    ? (Object.values(data.ritmo1.A || {}).filter(x => x !== "").length + Object.values(data.ritmo1.B || {}).filter(x => x !== "").length)
    : 0;

  const ritmo2Filled = data.ritmo2
    ? (Object.values(data.ritmo2.A || {}).filter(x => x !== "").length + Object.values(data.ritmo2.B || {}).filter(x => x !== "").length)
    : 0;

  const ritmo3Filled = data.ritmo3
    ? (Object.values(data.ritmo3.A || {}).filter(x => x !== "").length + Object.values(data.ritmo3.B || {}).filter(x => x !== "").length)
    : 0;

  const videoclipFilled = data.videoclip
    ? (Object.values(data.videoclip.A || {}).filter(x => x !== "").length + Object.values(data.videoclip.B || {}).filter(x => x !== "").length)
    : 0;

  const totalFilled = juegosFilled + napolitanaFilled + popurriFilled + mascotaFilled + ritmo1Filled + ritmo2Filled + ritmo3Filled + videoclipFilled;
  const totalItems = 70;
  const pct = Math.round((totalFilled / totalItems) * 100);

  return {
    isStarted: totalFilled > 0 || !!data.submitted,
    submitted: !!data.submitted,
    juegos: { filled: juegosFilled, total: 3 },
    napolitana: { filled: napolitanaFilled, total: 1 },
    popurri: { filled: popurriFilled, total: 11 },
    mascota: { filled: mascotaFilled, total: 5 },
    ritmo1: { filled: ritmo1Filled, total: 12 },
    ritmo2: { filled: ritmo2Filled, total: 12 },
    ritmo3: { filled: ritmo3Filled, total: 12 },
    videoclip: { filled: videoclipFilled, total: 14 },
    totalFilled,
    totalItems,
    pct,
  };
};
