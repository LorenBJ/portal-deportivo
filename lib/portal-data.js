export const matches = [
  {
    id: "arg-riv-boc",
    sport: "Futbol",
    competition: "Liga Profesional Argentina",
    status: "live",
    kickoff: "Hoy 20:30",
    venue: "Monumental",
    home: "River Plate",
    away: "Boca Juniors",
    score: "1 - 0",
    modelBias: 1.08,
    odds: [
      { market: "River gana", price: 1.95, modelProbability: 0.58 },
      { market: "Mas de 2.5 goles", price: 2.1, modelProbability: 0.52 },
      { market: "Ambos anotan", price: 1.88, modelProbability: 0.57 }
    ]
  },
  {
    id: "ucl-rma-mci",
    sport: "Futbol",
    competition: "UEFA Champions League",
    status: "live",
    kickoff: "Hoy 16:00",
    venue: "Santiago Bernabeu",
    home: "Real Madrid",
    away: "Manchester City",
    score: "2 - 2",
    modelBias: 1.02,
    odds: [
      { market: "Mas de 3.5 goles", price: 1.72, modelProbability: 0.66 },
      { market: "City o empate", price: 1.5, modelProbability: 0.69 },
      { market: "Proximo gol Real Madrid", price: 2.45, modelProbability: 0.43 }
    ]
  },
  {
    id: "epl-ars-liv",
    sport: "Futbol",
    competition: "Premier League",
    status: "upcoming",
    kickoff: "Manana 12:30",
    venue: "Emirates Stadium",
    home: "Arsenal",
    away: "Liverpool",
    score: "-",
    modelBias: 0.99,
    odds: [
      { market: "Mas de 2.5 goles", price: 1.8, modelProbability: 0.63 },
      { market: "Ambos anotan", price: 1.67, modelProbability: 0.68 },
      { market: "Arsenal empate no accion", price: 1.76, modelProbability: 0.59 }
    ]
  },
  {
    id: "lib-rac-fla",
    sport: "Futbol",
    competition: "Copa Libertadores",
    status: "upcoming",
    kickoff: "Manana 21:00",
    venue: "Cilindro de Avellaneda",
    home: "Racing Club",
    away: "Flamengo",
    score: "-",
    modelBias: 1.04,
    odds: [
      { market: "Menos de 2.5 goles", price: 1.74, modelProbability: 0.65 },
      { market: "Racing +0.5 handicap", price: 1.7, modelProbability: 0.67 },
      { market: "Empate al descanso", price: 2.08, modelProbability: 0.5 }
    ]
  },
  {
    id: "nba-bos-mil",
    sport: "Basquet",
    competition: "NBA",
    status: "live",
    kickoff: "Hoy 22:00",
    venue: "TD Garden",
    home: "Boston Celtics",
    away: "Milwaukee Bucks",
    score: "84 - 80",
    modelBias: 1.06,
    odds: [
      { market: "Boston gana", price: 1.65, modelProbability: 0.7 },
      { market: "Mas de 226.5 puntos", price: 1.92, modelProbability: 0.57 },
      { market: "Milwaukee +6.5", price: 1.8, modelProbability: 0.56 }
    ]
  },
  {
    id: "ucla-int-san",
    sport: "Futbol",
    competition: "Liga Profesional Argentina",
    status: "upcoming",
    kickoff: "Domingo 18:00",
    venue: "Libertadores de America",
    home: "Independiente",
    away: "San Lorenzo",
    score: "-",
    modelBias: 0.97,
    odds: [
      { market: "Menos de 2.5 goles", price: 1.62, modelProbability: 0.71 },
      { market: "Empate", price: 2.95, modelProbability: 0.37 },
      { market: "San Lorenzo +0.5", price: 1.84, modelProbability: 0.58 }
    ]
  }
];
