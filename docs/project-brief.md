# Portal Deportivo Personal

## Objetivo del proyecto

Construir una plataforma personal de apoyo a decisiones para apuestas deportivas.

La idea no es solo mirar partidos y cuotas, sino centralizar en un solo lugar:

- agenda diaria de partidos
- oportunidades destacadas
- cuotas operables
- historial de apuestas
- rendimiento por liga, equipo y mercado
- análisis con IA para decisiones tácticas y estratégicas

El objetivo económico es probar si, con disciplina, automatización parcial y stakes bajos o controlados, es posible construir una ganancia mensual sostenible que al menos recupere la inversión del stack y, si el sistema demuestra edge real, supere ese umbral.

## Filosofía operativa

El proyecto está pensado como una "mesa de decisiones" o "cuerpo técnico" de apuestas:

- no depender de intuición aislada
- ordenar datos, contexto y ejecución
- reducir fricción operativa
- medir todo
- ajustar estrategia según resultados reales

La lógica general es conservadora:

- evitar recomendaciones absurdas o sin respaldo
- priorizar valor esperado, confianza y control de riesgo
- filtrar por ligas, cuotas, mercados y rendimiento histórico

## Qué existe hoy en la app

### 1. Agenda

Pantalla para ver partidos del feed actual, con:

- partidos del día o próximos
- filtros por competición, deporte y estado
- picks sugeridos y lectura base del modelo
- acceso directo al análisis por partido

### 2. Radar

Pantalla de auditoría competitiva, con:

- ranking de ligas por ROI, acierto, cobertura y score
- ranking interno de equipos por liga
- apoyo para decidir dónde aumentar o bajar exposición

### 3. Combinador

Herramienta para armar combinadas manuales:

- selección de picks
- stake
- retorno potencial
- guardado al historial

### 4. Historial

Registro de apuestas con:

- pendientes
- ganadas
- perdidas
- resumen general
- ROI y porcentaje de acierto

### 5. Bot

Mesa operativa de ejecución semi-automática:

- ofertas activas
- tickets aceptados
- edición manual de cuota y stake
- ofertas manuales personalizadas
- alertas por Telegram
- arbitraje encendido/apagado
- métricas de profit, drawdown, cuota promedio y seguimiento reciente

Importante: hoy la ejecución final sigue siendo humana. El sistema prepara, alerta y registra; el click final en la casa lo hace el usuario.

### 6. Cuerpo técnico

Nueva estructura de IA dividida en dos roles:

- Ayudante de campo:
  análisis de partido y mercados sobre un encuentro puntual

- Director técnico:
  análisis estratégico sobre un informe resumido del rendimiento del sistema

El Director técnico trabaja con un informe compacto para bajar consumo de tokens y poder responder cosas como:

- qué ligas bajar
- qué mercados sostener
- cómo ajustar stake
- si conviene achicar o ampliar el rango de cuotas

## Datos y stack actual

### Frontend / app

- Next.js
- React
- despliegue en Vercel

### Datos deportivos

- API-Football como proveedor principal

La app ya consume partidos y odds, aunque todavía hay que seguir afinando cobertura, rate limits y profundidad estadística según la liga.

### IA

- OpenAI API con modelo económico tipo `gpt-5.4-mini`

Se usa para:

- análisis de partido
- análisis de estrategia

La prioridad es mantener el costo bajo en tokens, por eso la parte estratégica no manda el historial completo sino un informe resumido y filtrado.

### Alertas

- Telegram bot para avisos operativos

## Objetivo táctico y objetivo económico

### Objetivo táctico

Detectar qué combinaciones de:

- liga
- tipo de mercado
- franja de cuotas
- stake

producen mejor rendimiento para este usuario, en esta plataforma y con este flujo operativo.

### Objetivo económico

Apuntar a:

1. recuperar el costo mensual del stack
2. validar si existe edge real
3. solo después escalar volumen o automatización

No se busca crecer por "pegar una bomba", sino por:

- disciplina
- volumen razonable
- buenas selecciones
- control del riesgo
- mejora continua

## Qué debería analizar otra IA al leer este proyecto

Una IA externa debería ayudar a responder:

- qué ligas conviene priorizar
- qué ligas conviene observar pero no tocar
- qué mercados están funcionando mejor
- qué bandas de cuotas son más rentables
- cuándo bajar stake
- cuándo cortar exposición
- cuándo ampliar o reducir volumen diario
- qué reglas nuevas conviene testear

También debería poder proponer:

- experimentos por semana
- cambios pequeños y medibles
- filtros nuevos para el bot
- nuevas formas de resumir el riesgo diario

## Restricciones y realidad del proyecto

- no hay ejecución automática oficial en casas de apuestas
- el flujo actual es semi-automático
- el click final sigue siendo manual
- las decisiones deben estar respaldadas por datos y métricas, no por intuiciones vacías

Además:

- el sistema todavía está en fase de experimentación
- los resultados pasados no prueban edge definitivo
- la meta es aprender, medir y corregir sin perder control

## Dirección deseada

La visión final es una plataforma personal donde el usuario entre todos los días y pueda:

- ver rápidamente qué partidos importan
- entender qué oportunidades hay
- decidir si hacer simples o combinadas
- recibir ayuda de IA para táctica y estrategia
- operar con baja fricción
- registrar todo
- aprender del desempeño real

En resumen:

este proyecto es una cabina personal de análisis, ejecución asistida y mejora continua para apuestas deportivas, con foco en ganar consistencia antes que volumen ciego.
