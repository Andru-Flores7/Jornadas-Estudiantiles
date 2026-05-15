
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
  };
};

const mockData = {
  juegos: ["A", "A", "B"], // A: 12, B: 6
  popurri: Array(10).fill("A"), // A: 4
  mascota: Array(4).fill("A"), // A: 3
  ritmo1: { A: { v: 5 }, B: { v: 0 } }, // A: 4
  ritmo2: { A: { v: 5 }, B: { v: 0 } }, // A: 4
  videoclip: { A: { v: 5 }, B: { v: 0 } }, // A: 15
};

const res = calculateFinal(mockData);
console.log("Total A:", res.totalA);
console.log("Total B:", res.totalB);
console.log("Sum:", res.totalA + res.totalB);
