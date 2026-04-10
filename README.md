# Portal Deportivo Personal

Portal multipagina en Next.js con feed de cuotas, motor propio de picks y analista conversacional.

## Stack

- Next.js 16
- React 19
- Feed server-side `/api/feed`
- Chat analyst `/api/analyst`
- Historial en `localStorage`

## Variables

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
OPENAI_REASONING_EFFORT=low
ODDS_API_KEY=
ODDS_API_REGIONS=eu
ODDS_API_MARKETS=h2h,spreads,totals
ODDS_API_SPORT_KEYS=soccer_argentina_primera_division,soccer_epl,soccer_spain_la_liga,soccer_germany_bundesliga,soccer_italy_serie_a,soccer_france_ligue_one,soccer_uefa_champs_league,soccer_conmebol_copa_libertadores,soccer_conmebol_copa_sudamericana,basketball_nba
```

## Motor v2

- parte del consenso de mercado
- agrega heuristicas por rating y localia
- penaliza outsiders extremos
- rankea por edge, confianza y estabilidad
- filtra picks aptos para agenda y combinador

## Chat

El analista usa el feed actual y el partido seleccionado. Si falta `OPENAI_API_KEY`, el chat no responde.
