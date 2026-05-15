
const calculateFinal = (data) => {
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

  const sumR1A = Object.values(data.ritmo1.A).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const sumR1B = Object.values(data.ritmo1.B).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const prizeR1A = sumR1A > sumR1B && sumR1A > 0 ? 4 : 0;
  const prizeR1B = sumR1B > sumR1A && sumR1B > 0 ? 4 : 0;

  const sumR2A = Object.values(data.ritmo2.A).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const sumR2B = Object.values(data.ritmo2.B).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const prizeR2A = sumR2A > sumR2B && sumR2A > 0 ? 4 : 0;
  const prizeR2B = sumR2B > sumR2A && sumR2B > 0 ? 4 : 0;

  const sumVidA = Object.values(data.videoclip.A).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const sumVidB = Object.values(data.videoclip.B).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const prizeVidA = sumVidA > sumVidB && sumVidA > 0 ? 15 : 0;
  const prizeVidB = sumVidB > sumVidA && sumVidB > 0 ? 15 : 0;

  return {
    totalA: ptsJuegosA + prizePopA + prizeMasA + prizeR1A + prizeR2A + prizeVidA,
    totalB: ptsJuegosB + prizePopB + prizeMasB + prizeR1B + prizeR2B + prizeVidB,
    sumVidA, sumVidB, // for reference
    prizePopA, prizePopB, prizeMasA, prizeMasB, prizeR1A, prizeR1B, prizeR2A, prizeR2B, prizeVidA, prizeVidB
  };
};

const calculateConsensus = (db, jurors) => {
  const submittedIds = jurors.filter((j) => db[j.id]?.submitted).map((j) => j.id);
  
  if (submittedIds.length === 0) {
      return {
          totalA: 0, totalB: 0,
          breakdown: { individualGames: [null, null, null], popA: 0, popB: 0, masA: 0, masB: 0, r1A: 0, r1B: 0, r2A: 0, r2B: 0, vidA: 0, vidB: 0 }
      };
  }

  const individualResults = submittedIds.map((id) => calculateFinal(db[id]));

  let juegosA = 0, juegosB = 0;
  const individualGames = [];
  for (let i = 0; i < 3; i++) {
    let votesA = 0, votesB = 0;
    submittedIds.forEach((id) => {
      if (db[id].juegos[i] === "A") votesA++;
      if (db[id].juegos[i] === "B") votesB++;
    });
    const gameWinner = votesA > votesB ? "A" : votesB > votesA ? "B" : null;
    if (gameWinner === "A") juegosA += 6;
    else if (gameWinner === "B") juegosB += 6;
    individualGames.push(gameWinner);
  }

  const getConsensusPrize = (keyA, keyB, points) => {
    let winA = 0, winB = 0;
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
    juegosA, juegosB, individualGames,
    popA: pop.a, popB: pop.b,
    masA: mas.a, masB: mas.b,
    r1A: r1.a, r1B: r1.b,
    r2A: r2.a, r2B: r2.b,
    vidA: vidPrize.a, vidB: vidPrize.b,
  };

  return {
    totalA: juegosA + pop.a + mas.a + r1.a + r2.a + breakdown.vidA,
    totalB: juegosB + pop.b + mas.b + r1.b + r2.b + breakdown.vidB,
    breakdown,
  };
};

// --- TESTS ---

// 1. Empty State
const emptyDb = { juror1: null, juror2: null, juror3: null };
const jurors = [{id: 'juror1'}, {id: 'juror2'}, {id: 'juror3'}];
console.log("Empty State Test:", JSON.stringify(calculateConsensus(emptyDb, jurors).breakdown.individualGames));

// 2. Full Win A
const fullWinA = {
    submitted: true,
    juegos: ["A", "A", "A"],
    popurri: Array(10).fill("A"),
    mascota: Array(4).fill("A"),
    ritmo1: { A: { v: 5 }, B: { v: 0 } },
    ritmo2: { A: { v: 5 }, B: { v: 0 } },
    videoclip: { A: { v: 5 }, B: { v: 0 } },
};
const dbA = { juror1: fullWinA, juror2: fullWinA, juror3: fullWinA };
const resA = calculateConsensus(dbA, jurors);
console.log("Full Win A Total:", resA.totalA); // Should be 48
console.log("Full Win A Sum:", resA.totalA + resA.totalB); // Should be 48

// 3. Mixed Win
const juror1 = { ...fullWinA, juegos: ["A", "B", "A"], submitted: true };
const juror2 = { ...fullWinA, juegos: ["B", "A", "B"], submitted: true };
const juror3 = { ...fullWinA, juegos: ["A", "A", "B"], submitted: true };
// Majority for games: 
// G1: A (2 vs 1) -> 6 pts A
// G2: A (2 vs 1) -> 6 pts A
// G3: B (2 vs 1) -> 6 pts B
// Total Juegos: A: 12, B: 6. Sum: 18.
const resMixed = calculateConsensus({ juror1, juror2, juror3 }, jurors);
console.log("Mixed Games Sum:", resMixed.totalA + resMixed.totalB); // Should be 48
