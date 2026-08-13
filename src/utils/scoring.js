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
      "impacto visual": "",
      carisma: "",
      escenografia: "",
    },
    B: {
      "cordinacion coreografica": "",
      "composicion coreografica": "",
      "adaptacion al tiempo musical": "",
      "uso del espacio": "",
      "impacto visual": "",
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

  // Napolitana: el ganador suma 4 puntos
  const napWinner = data.napolitana || null;
  const prizeNapA = napWinner === "A" ? 4 : 0;
  const prizeNapB = napWinner === "B" ? 4 : 0;

  const countPopA = data.popurri.filter((v) => v === "A").length,
    countPopB = data.popurri.filter((v) => v === "B").length;
  const prizePopA = countPopA > countPopB ? 4 : countPopB > countPopA ? 0 : (countPopA > 0 ? 2 : 0);
  const prizePopB = countPopB > countPopA ? 4 : countPopA > countPopB ? 0 : (countPopB > 0 ? 2 : 0);

  const countMasA = data.mascota.filter((v) => v === "A").length,
    countMasB = data.mascota.filter((v) => v === "B").length;
  const prizeMasA = countMasA > countMasB ? 3 : countMasB > countMasA ? 0 : (countMasA > 0 ? 1.5 : 0);
  const prizeMasB = countMasB > countMasA ? 3 : countMasA > countMasB ? 0 : (countMasB > 0 ? 1.5 : 0);

  const sumR1A = Object.values(data.ritmo1.A).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const sumR1B = Object.values(data.ritmo1.B).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const prizeR1A = sumR1A > sumR1B ? 4 : sumR1B > sumR1A ? 0 : (sumR1A > 0 ? 2 : 0);
  const prizeR1B = sumR1B > sumR1A ? 4 : sumR1A > sumR1B ? 0 : (sumR1B > 0 ? 2 : 0);

  const sumR2A = Object.values(data.ritmo2.A).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const sumR2B = Object.values(data.ritmo2.B).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const prizeR2A = sumR2A > sumR2B ? 4 : sumR2B > sumR2A ? 0 : (sumR2A > 0 ? 2 : 0);
  const prizeR2B = sumR2B > sumR2A ? 4 : sumR2A > sumR2B ? 0 : (sumR2B > 0 ? 2 : 0);

  const sumR3A = Object.values(data.ritmo3.A).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const sumR3B = Object.values(data.ritmo3.B).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const prizeR3A = sumR3A > sumR3B ? 4 : sumR3B > sumR3A ? 0 : (sumR3A > 0 ? 2 : 0);
  const prizeR3B = sumR3B > sumR3A ? 4 : sumR3A > sumR3B ? 0 : (sumR3B > 0 ? 2 : 0);

  const sumVidA = Object.values(data.videoclip.A).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const sumVidB = Object.values(data.videoclip.B).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );
  const prizeVidA = sumVidA > sumVidB ? 15 : sumVidB > sumVidA ? 0 : (sumVidA > 0 ? 7.5 : 0);
  const prizeVidB = sumVidB > sumVidA ? 15 : sumVidA > sumVidB ? 0 : (sumVidB > 0 ? 7.5 : 0);

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
    totalA:
      ptsJuegosA + prizeNapA + prizePopA + prizeMasA + prizeR1A + prizeR2A + prizeR3A + prizeVidA,
    totalB:
      ptsJuegosB + prizeNapB + prizePopB + prizeMasB + prizeR1B + prizeR2B + prizeR3B + prizeVidB,
  };
};

export const isJurorCategoryComplete = (data, category) => {
  if (!data) return false;
  if (!data.submitted) return false;
  if (!category) return true;

  if (category === "juegos") {
    return Array.isArray(data.juegos) && data.juegos.length === 3 && data.juegos.every((v) => v === "A" || v === "B");
  }
  if (category.startsWith("juego-")) {
    const idx = parseInt(category.split("-")[1], 10);
    return Array.isArray(data.juegos) && (data.juegos[idx] === "A" || data.juegos[idx] === "B");
  }
  if (category === "napolitana") {
    return data.napolitana === "A" || data.napolitana === "B";
  }
  if (category === "popurri") {
    return Array.isArray(data.popurri) && data.popurri.length === 11 && data.popurri.every((v) => v === "A" || v === "B");
  }
  if (category === "mascota") {
    return Array.isArray(data.mascota) && data.mascota.length === 5 && data.mascota.every((v) => v === "A" || v === "B");
  }
  if (category === "ritmo1") {
    const r1A = Object.values(data.ritmo1?.A || {}).filter((v) => v !== "" && v !== null && v !== undefined).length;
    const r1B = Object.values(data.ritmo1?.B || {}).filter((v) => v !== "" && v !== null && v !== undefined).length;
    return r1A === 6 && r1B === 6;
  }
  if (category === "ritmo2") {
    const r2A = Object.values(data.ritmo2?.A || {}).filter((v) => v !== "" && v !== null && v !== undefined).length;
    const r2B = Object.values(data.ritmo2?.B || {}).filter((v) => v !== "" && v !== null && v !== undefined).length;
    return r2A === 6 && r2B === 6;
  }
  if (category === "ritmo3") {
    const r3A = Object.values(data.ritmo3?.A || {}).filter((v) => v !== "" && v !== null && v !== undefined).length;
    const r3B = Object.values(data.ritmo3?.B || {}).filter((v) => v !== "" && v !== null && v !== undefined).length;
    return r3A === 6 && r3B === 6;
  }
  if (category === "videoclip") {
    const vidA = Object.values(data.videoclip?.A || {}).filter((v) => v !== "" && v !== null && v !== undefined).length;
    const vidB = Object.values(data.videoclip?.B || {}).filter((v) => v !== "" && v !== null && v !== undefined).length;
    return vidA === 7 && vidB === 7;
  }

  return false;
};

export const isCategoryFullyVoted = (db, jurors, category) => {
  if (!db || !jurors || jurors.length === 0) return false;
  return jurors.every((j) => {
    const jurorData = db[j.id];
    if (!jurorData || !jurorData.submitted) return false;
    return isJurorCategoryComplete(jurorData, category);
  });
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
        db[id]?.submitted === true &&
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
      const gameWinner = votesA > votesB ? "A" : votesB > votesA ? "B" : (votesA > 0 && votesA === votesB ? "EMPATE" : null);
      if (gameWinner === "A") juegosA += 6;
      else if (gameWinner === "B") juegosB += 6;
      else if (gameWinner === "EMPATE") {
        juegosA += 3;
        juegosB += 3;
      }
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
    if (winA > 0 && winA === winB) return { a: points / 2, b: points / 2 };
    return { a: 0, b: 0 };
  };

  const nap = getConsensusPrize("prizeNapA", "prizeNapB", 4, "napolitana");
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
    napA: nap.a,
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
    totalA: juegosA + nap.a + pop.a + mas.a + r1.a + r2.a + r3.a + breakdown.vidA,
    totalB: juegosB + nap.b + pop.b + mas.b + r1.b + r2.b + r3.b + breakdown.vidB,
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
