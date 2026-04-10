# Portal Deportivo Personal

Portal migrado a Next.js con enfoque multipagina para desplegar rapido en Vercel.

## Estructura actual

- `/`: portada simple con navegacion
- `/agenda`: filtros, partidos y picks destacados
- `/combinador`: seleccion de picks, stake y retorno potencial
- `/historial`: historial persistido en el navegador con acierto y ROI

## Stack

- Next.js 16
- React 19
- App Router
- Estado local persistido con `localStorage`

## Desarrollo local

Si tu terminal ya reconoce `node` y `npm`, usa:

```bash
npm install
npm run dev
```

Si en Windows recien lo instalaste y la terminal todavia no lo ve, cerra y vuelve a abrir Codex o una terminal nueva.

## Despliegue en Vercel

1. Subi el proyecto a GitHub.
2. Importa el repositorio en Vercel.
3. Vercel detecta Next.js automaticamente.
4. Cada push a la rama principal genera un nuevo deploy.

## Siguiente paso recomendado

1. Mover historial a una base real.
2. Agregar autenticacion privada.
3. Conectar una API de fixtures.
4. Conectar una API de cuotas en vivo.
5. Crear endpoints server-side para no exponer claves.

## Nota sobre esta maquina

El proyecto esta dentro de una carpeta de OneDrive. Durante la validacion local el `build` de Next fallo al renombrar archivos temporales dentro de `.next`, algo que suele pasar por bloqueo/sincronizacion del sistema de archivos. Si vuelve a pasar, la solucion mas estable es mover el repo fuera de OneDrive o compilar con permisos ampliados.
