// --- INITIAL STATE ---
export const createInitialJurorState = () => ({
  submitted: false,
  header: { jury: "", matchNo: "", teamA: "Equipo A", teamB: "Equipo B" },
  juegos: Array(3).fill(null),
  popurri: Array(11).fill(null),
  mascota: Array(5).fill(null),
  ritmo1: {
    A: {
      vestimenta: "",
      originalidad: "",
      desplazamiento: "",
      coordinacion: "",
      "conexion en pareja": "",
    },
    B: {
      vestimenta: "",
      originalidad: "",
      desplazamiento: "",
      coordinacion: "",
      "conexion en pareja": "",
    },
  },
  ritmo2: {
    A: {
      vestimenta: "",
      originalidad: "",
      desplazamiento: "",
      coordinacion: "",
      "conexion en pareja": "",
    },
    B: {
      vestimenta: "",
      originalidad: "",
      desplazamiento: "",
      coordinacion: "",
      "conexion en pareja": "",
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
    },
    B: {
      "cordinacion coreografica": "",
      "composicion coreografica": "",
      "adaptacion al tiempo musical": "",
      "uso del espacio": "",
      "trabajo en equipo": "",
      carisma: "",
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
  },
};

export const calculateFinal = (data) => {
  if (!data) return { a: 0, b: 0 };
  const ptsJuegosA = data.juegos.filter((v) => v === "A").length * 6;
  const ptsJuegosB = data.juegos.filter((v) => v === "B").length * 6;

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
    prizePopA,
    prizePopB,
    prizeMasA,
    prizeMasB,
    prizeR1A,
    prizeR1B,
    prizeR2A,
    prizeR2B,
    sumVidA,
    sumVidB,
    prizeVidA,
    prizeVidB,
    totalA:
      ptsJuegosA + prizePopA + prizeMasA + prizeR1A + prizeR2A + prizeVidA,
    totalB:
      ptsJuegosB + prizePopB + prizeMasB + prizeR1B + prizeR2B + prizeVidB,
  };
};

export const calculateConsensus = (db, jurors) => {
  const submittedIds = jurors
    .filter((j) => db[j.id]?.submitted)
    .map((j) => j.id);
  if (submittedIds.length === 0)
    return {
      totalA: 0,
      totalB: 0,
      breakdown: {
        juegosA: 0,
        juegosB: 0,
        individualGames: [null, null, null],
        popA: 0,
        popB: 0,
        masA: 0,
        masB: 0,
        r1A: 0,
        r1B: 0,
        r2A: 0,
        r2B: 0,
        vidA: 0,
        vidB: 0,
      },
    };

  const individualResults = submittedIds.map((id) => calculateFinal(db[id]));

  // 1. Juegos (6 pts por juego, por mayoría)
  let juegosA = 0,
    juegosB = 0;
  const individualGames = [];
  for (let i = 0; i < 3; i++) {
    let votesA = 0,
      votesB = 0;
    submittedIds.forEach((id) => {
      if (db[id].juegos[i] === "A") votesA++;
      if (db[id].juegos[i] === "B") votesB++;
    });
    const gameWinner = votesA > votesB ? "A" : votesB > votesA ? "B" : null;
    if (gameWinner === "A") juegosA += 6;
    else if (gameWinner === "B") juegosB += 6;
    individualGames.push(gameWinner);
  }

  // 2. Función genérica para premios por mayoría
  const getConsensusPrize = (keyA, keyB, points) => {
    let winA = 0,
      winB = 0;
    individualResults.forEach((r) => {
      if (r[keyA] > r[keyB]) winA++;
      else if (r[keyB] > r[keyA]) winB++;
    });
    if (winA > winB) return { a: points, b: 0 };
    if (winB > winA) return { a: 0, b: points };
    return { a: 0, b: 0 };
  };

  const pop = getConsensusPrize("prizePopA", "prizePopB", 4);
  const mas = getConsensusPrize("prizeMasA", "prizeMasB", 3);
  const r1 = getConsensusPrize("prizeR1A", "prizeR1B", 4);
  const r2 = getConsensusPrize("prizeR2A", "prizeR2B", 4);
  const vidPrize = getConsensusPrize("prizeVidA", "prizeVidB", 15);

  const breakdown = {
    juegosA,
    juegosB,
    individualGames, // [A, B, null]
    popA: pop.a,
    popB: pop.b,
    masA: mas.a,
    masB: mas.b,
    r1A: r1.a,
    r1B: r1.b,
    r2A: r2.a,
    r2B: r2.b,
    vidA: vidPrize.a,
    vidB: vidPrize.b,
  };

  return {
    totalA: juegosA + pop.a + mas.a + r1.a + r2.a + breakdown.vidA,
    totalB: juegosB + pop.b + mas.b + r1.b + r2.b + breakdown.vidB,
    breakdown,
  };
};
