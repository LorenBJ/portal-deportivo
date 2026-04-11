# Portal Deportivo Personal

Portal multipagina en Next.js con feed de futbol, motor propio de picks y analista conversacional.

## Stack

- Next.js 16
- React 19
- Feed server-side `/api/feed`
- Chat analyst `/api/analyst`
- Historial en `localStorage`
- Provider de futbol: API-Football

## Variables

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
OPENAI_REASONING_EFFORT=low
API_FOOTBALL_KEY=
API_FOOTBALL_TIMEZONE=America/Buenos_Aires
API_FOOTBALL_CACHE_MS=180000
API_FOOTBALL_LEAGUES=128:calendar,71:calendar,39:split,140:split,78:split,135:split,61:split,2:split,13:calendar,11:calendar
```

## Motor v2

- parte del consenso de mercado
- agrega heuristicas por rating y localia
- penaliza outsiders extremos
- rankea por edge, confianza y estabilidad
- filtra picks aptos para agenda y combinador

## Chat

El analista usa el feed actual y el partido seleccionado. Si falta `OPENAI_API_KEY`, el chat no responde.

## Ligas activas

- Liga Profesional Argentina
- Brasileirao Serie A
- Premier League
- La Liga
- Bundesliga
- Serie A
- Ligue 1
- UEFA Champions League
- Copa Libertadores
- Copa Sudamericana

## Notas de feed

- El proyecto ahora usa API-Football solo para futbol.
- NBA fue removida del feed principal.
- El feed usa cache corta para reducir consumo de requests.
