# Portal Deportivo Personal

Portal multipagina en Next.js, desplegado en Vercel y listo para conectarse a cuotas reales.

## Stack actual

- Next.js 16
- React 19
- App Router
- Historial persistido en `localStorage`
- Feed server-side en `/api/feed`

## Datos reales

La primera integracion real usa `The Odds API` para agenda, estados y cuotas de competencias configuradas.

Variables de entorno:

```bash
ODDS_API_KEY=
ODDS_API_REGIONS=eu
ODDS_API_MARKETS=h2h,spreads,totals
ODDS_API_SPORT_KEYS=soccer_argentina_primera_division,soccer_conmebol_copa_libertadores,soccer_uefa_champs_league,soccer_epl,basketball_nba
```

Si falta la clave, la app vuelve automaticamente al modo demo con datos mock.

## Desarrollo local

```bash
npm install
npm run dev
```

## Produccion

Cada push a `main` genera deploy automatico en Vercel.

## Siguiente paso recomendado

1. Guardar historial en base de datos.
2. Agregar autenticacion privada.
3. Enriquecer el modelo propio para picks destacados.
4. Sumar un segundo proveedor de fixtures si queres detalle adicional por liga.
