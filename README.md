# Jornadas Estudiantiles 2026 — Guía de Arquitectura

Sistema de puntuación en tiempo real para Jornadas Estudiantiles, construido con **React + Vite + Supabase**.

---

## Estructura del proyecto

```
src/
├── config/
│   └── constants.js          ← 📌 EMPIEZA AQUÍ si necesitas cambiar puntos o criterios
│
├── lib/
│   └── supabase.js           ← Cliente de Supabase (variables de entorno en .env)
│
├── hooks/
│   ├── useRealtimeDb.js      ← Carga inicial + suscripción realtime de Supabase
│   └── useSupabaseSync.js    ← Sync debounced de la planilla del jurado
│
├── utils/
│   └── scoring.js            ← Toda la lógica de cálculo de puntajes y consenso
│
├── components/
│   ├── layout/               ← Componentes estructurales de la app
│   │   ├── GlobalHeader.jsx
│   │   ├── GlobalFooter.jsx
│   │   └── ErrorBoundary.jsx
│   │
│   ├── ui/                   ← Componentes reutilizables pequeños (átomos)
│   │   ├── LoadingSpinner.jsx
│   │   └── VoteDot.jsx
│   │
│   ├── admin/                ← Vista de administrador (fragmentada)
│   │   ├── AdminView.jsx     ← Orquestador slim (~120 líneas)
│   │   ├── ConfigPanel.jsx   ← Panel de ajustes del encuentro
│   │   ├── ResultsTab.jsx    ← Pestaña "Resultados Consolidados"
│   │   ├── LiveMonitorTab.jsx← Pestaña "Monitoreo en Vivo"
│   │   ├── JurorProgressCard.jsx ← Tarjeta de progreso por jurado
│   │   └── generatePDF.js    ← Función pura para generar el PDF
│   │
│   ├── juror/
│   │   └── JurorView.jsx     ← Planilla de votación del jurado
│   │
│   ├── CategoryWinnerCard.jsx← Tarjeta visual de ganador por categoría
│   └── RoleSelection.jsx     ← Pantalla de selección de rol
│
├── App.jsx                   ← Orquestador raíz (rol, hooks, rutas)
├── main.jsx                  ← Entry point de React
├── index.css                 ← Estilos globales
└── App.css                   ← Estilos específicos de App
```

---

## Flujo de datos

```
Supabase DB
    │
    ├─► useRealtimeDb (hook) ──► db (estado), config (estado)
    │                                │
    │                                └─► AdminView / JurorView
    │
    └─► useSupabaseSync (hook) ◄── handleSetData (App.jsx)
              │ (debounce 700ms)
              └─► Supabase DB
```

---

## Cambios frecuentes

### Cambiar puntos de una categoría
Edita `src/config/constants.js` — todas las constantes están documentadas.

### Cambiar criterios de evaluación
Los arrays `RITMO_CRITERIA` y `VIDEOCLIP_CRITERIA` en `constants.js` controlan qué campos aparecen en la planilla y cuántos son.

### Cambiar lógica de cálculo
Todo el cálculo de puntajes está en `src/utils/scoring.js`:
- `calculateFinal(data)` → puntaje individual de un jurado
- `calculateConsensus(db, jurors)` → puntaje final por consenso
- `calculateJurorProgress(data)` → progreso de llenado de la planilla

### Agregar una categoría nueva
1. Agregar la constante de puntos en `constants.js`
2. Agregar el estado inicial en `createInitialJurorState()` en `scoring.js`
3. Agregar el cálculo en `calculateFinal()` y `calculateConsensus()` en `scoring.js`
4. Agregar la sección en `JurorView.jsx`
5. Agregar la categoría a los arrays de configuración en `ResultsTab.jsx`

---

## Variables de entorno

Crear un archivo `.env` en la raíz con:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

---

## Scripts

```bash
npm run dev    # Servidor de desarrollo
npm run build  # Build de producción
npm run lint   # ESLint
```
