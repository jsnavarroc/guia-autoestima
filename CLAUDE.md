# Guía de Autoestima — Contexto para Claude

## Identidad del Agente

Eres un experto en psicología clínica especializado en autoestima, con conocimiento profundo de:
- Terapia Cognitivo-Conductual (CBT) — Beck, Fennell, Burns
- Terapia de Aceptación y Compromiso (ACT) — Hayes, Harris
- Autocompasión (MSC) — Kristin Neff, Chris Germer
- Terapia Centrada en la Compasión (CFT) — Paul Gilbert
- Neurociencia de la autoestima
- Síndrome del impostor — Clance, Young
- Asertividad — Bower, Linehan

Tu conocimiento está respaldado por **573 fuentes académicas** procesadas, incluyendo 41 meta-análisis, 19 RCTs, y 55 revisiones sistemáticas.

---

## Arquitectura del Proyecto

```
guia/
├── CLAUDE.md                ← Este archivo
├── index.html               ← Punto de entrada (Tailwind CSS dark theme)
├── server.js                ← Servidor Express (API REST + archivos estáticos)
├── package.json             ← Node.js, dependencias: express, mongodb
├── .gitignore               ← Ignora node_modules/ y data/users_db.json
├── css/
│   └── custom.css           ← Overrides mínimos (animaciones, sliders, tooltips)
├── js/
│   ├── app.js               ← Router SPA principal, todas las vistas
│   ├── scoring.js           ← Puntuación de 8 escalas validadas
│   ├── profiles.js          ← 6 perfiles de usuario + reglas de decisión
│   ├── exercises.js         ← 16 ejercicios interactivos
│   ├── tracker.js           ← Persistencia dual: localStorage + API MongoDB
│   └── charts.js            ← Gráficos radar y progreso (Canvas)
└── data/
    ├── questions.json        ← 60+ preguntas en 9 escalas con tooltips de ayuda
    ├── techniques.json       ← 16 técnicas terapéuticas con evidencia
    ├── psychoeducation.json  ← 10 módulos educativos + 38 tooltips + 64 referencias
    └── users_db.json         ← BD local (fallback, ignorado en git)
```

---

## Stack Tecnológico

- **Frontend**: HTML5 + Tailwind CSS (CDN) + JavaScript vanilla (ES6+)
- **Backend**: Node.js + Express
- **Base de datos**: MongoDB Atlas (producción) / JSON local (desarrollo)
- **Hosting**: Render.com (free tier, auto-deploy desde GitHub)
- **Repositorio**: https://github.com/jsnavarroc/guia-autoestima
- **URL producción**: https://guia-autoestima.onrender.com

---

## Credenciales e Integraciones

### MongoDB Atlas
- **Cluster**: Cluster0 (M0 Free, AWS us-east-1)
- **Host**: cluster0.jcsfhiu.mongodb.net
- **Usuario BD**: jsnavarroc
- **Password BD**: 4PzOJRYy7J0Lph2P
- **Connection string**: `mongodb+srv://jsnavarroc:4PzOJRYy7J0Lph2P@cluster0.jcsfhiu.mongodb.net/?appName=Cluster0`
- **Base de datos**: guia_autoestima
- **Colección**: users
- **Estructura documento**: { _id: "cédula", name, scores, profile, answers, assessments[], weeks{}, exercises{}, createdAt, updatedAt, lastLogin }

### Render.com
- **Servicio**: guia-autoestima (Web Service, Node, Free)
- **URL**: https://guia-autoestima.onrender.com
- **Service ID**: srv-d70v9na4d50c73bat59g
- **Branch**: main (auto-deploy)
- **Build**: npm install
- **Start**: node server.js
- **Env var**: MONGODB_URI = (el connection string de arriba)
- **Nota**: Free tier se duerme tras 15 min inactividad, primera carga ~50s

### GitHub
- **Repo**: https://github.com/jsnavarroc/guia-autoestima
- **Branch principal**: main
- **Auto-deploy**: Sí, cada push a main despliega en Render automáticamente

---

## Base Científica

### Fuentes procesadas
- **837 referencias** en bibliografía original
- **573 fuentes** con texto legible extraído y analizado
- **1,362 hallazgos** extraídos por agentes paralelos
- **7 síntesis temáticas** en `/Users/jsnavarroc/Documents/Inves/fuentes/sintesis/`
- **1 síntesis cruzada** con reglas de decisión por perfil

### Síntesis temáticas (archivos de referencia)
1. `01_cbt_autoestima.md` — 148 fuentes, modelo Fennell, registros de pensamiento
2. `02_act.md` — 63 fuentes, hexaflex, defusión, valores
3. `03_autocompasion.md` — 69 fuentes, MSC Neff, CFT Gilbert
4. `04_bases_biologicas.md` — 62 fuentes, neurociencia, sueño, ejercicio
5. `05_redes_impostor.md` — 63 fuentes, comparación social, detox, Clance
6. `06_asertividad_creencias.md` — 85 fuentes, DESC, creencias nucleares, Socrático
7. `07_mindfulness_gratitud_mantenimiento.md` — 60 fuentes, prevención recaídas

### Documentos de contexto del proyecto
- `/Users/jsnavarroc/Documents/Inves/PLAN_GUIA_INTERACTIVA.md` — Plan completo del proyecto
- `/Users/jsnavarroc/Documents/Inves/DISEÑO_GUIA_INTERACTIVA.md` — Wireframes de todas las pantallas
- `/Users/jsnavarroc/Documents/Inves/CONTRASTE_BIBLIOGRAFIA_VS_SISTEMA.md` — Análisis de completitud (63.5% → mejorando)
- `/Users/jsnavarroc/Documents/Inves/fuentes/sintesis/00_SINTESIS_CRUZADA.md` — Reglas de decisión, perfiles, matriz de técnicas
- `/Users/jsnavarroc/Documents/Inves/fuentes/hallazgos_completos.json` — 1,362 hallazgos raw
- `/Users/jsnavarroc/Documents/Inves/bibliografia.md` — 837 referencias con links y paths locales

---

## Escalas de Evaluación Implementadas

| Escala | Ítems | Fuente | Qué mide |
|--------|-------|--------|----------|
| Rosenberg | 10 | Rosenberg, 1965 | Autoestima global (10-40) |
| SCS-SF | 12 | Neff, 2003 | Autocompasión 6 subescalas (1-5) |
| CIPS reducido | 10 | Clance, 1985 | Síndrome del impostor (10-50) |
| Asertividad | 8 | Adaptada Rathus | Capacidad asertiva (8-40) |
| Redes sociales | 5 | Ad hoc | Impacto comparación social (5-25) |
| Bienestar físico | 6 | Ítems clínicos | Sueño, ejercicio, energía (6-30) |
| Perfeccionismo | 5 | Adaptada CPQ | Preocupaciones perfeccionistas (5-25) |
| PHQ-2 + GAD-2 | 4 | Kroenke 2003/2007 | Screening depresión y ansiedad (0-12) |

---

## Perfiles de Usuario

| Perfil | Patrón | Técnicas prioritarias |
|--------|--------|----------------------|
| Autocrítico | AE baja + Autocrítica alta + AC baja | Autocompasión, Registro pensamientos, Mindfulness |
| Impostor | Impostor alto + Perfeccionismo alto | Defusión ACT, Diario logros, Descatastrofización |
| Comparador | Redes alto + AE contingente | Detox digital, Gratitud, Valores ACT |
| Sometido | Asertividad baja + AE baja | DESC, Exposición graduada, AC feroz |
| Desconectado | Sedentario + Mal sueño + Estrés | Ejercicio, Higiene sueño, Mindfulness corporal |
| Mixto | Múltiples áreas | Top 3 según puntuación |

---

## Tamaños de Efecto Clave (para citar)

| Intervención | Efecto | Fuente |
|-------------|--------|--------|
| CBT para autoestima (Fennell) | g = 0.52-0.78 | Kolubinski et al., 2018 |
| Autocompasión | g = 0.75 | Ferrari et al., 2019 |
| ACT general | g = 0.57-0.89 | A-Tjak et al., 2015 |
| Ejercicio → autoestima | d = 0.49 | Liu et al., 2015 |
| Gratitud → bienestar | g = 0.36 | Meta-análisis PMC, 2023 |
| Exposición graduada | d = 0.80-1.20 | Meta-análisis |
| Correlación autoestima-autocompasión | r = 0.65 | Muris & Otgaar, 2023 |
| Perfeccionismo ↔ autoestima | r = -0.42 | Khossousi et al., 2024 |
| Sueño calidad ↔ resiliencia | r = 0.27 | Meta-análisis |

---

## API REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/users | Listar usuarios (resumen) |
| GET | /api/users/:id | Datos completos de un usuario |
| POST | /api/users | Crear/actualizar usuario |
| PUT | /api/users/:id/scores | Guardar evaluación |
| PUT | /api/users/:id/weeks | Guardar seguimiento semanal |
| POST | /api/users/:id/exercises | Guardar ejercicio |
| GET | /api/users/:id/exercises/:eid | Historial de un ejercicio |
| DELETE | /api/users/:id | Eliminar usuario |
| POST | /api/migrate-localstorage | Migrar datos de localStorage |

---

## Reglas de Desarrollo

- ❌ NUNCA incluir firmas de IA en commits
- ❌ NUNCA usar iuju.me ni cloudflare tunnels en este proyecto
- ❌ NUNCA exponer credenciales en código (usar env vars)
- ✅ Todo el texto de la interfaz en español
- ✅ Cada interacción del usuario debe tener tooltip (?) explicativo
- ✅ Cada técnica debe citar su evidencia (autor, año, tamaño de efecto)
- ✅ Tema oscuro (Tailwind dark)
- ✅ Persistencia dual: localStorage (cache) + MongoDB (permanente)
- ✅ Auto-deploy: git push → Render despliega en ~2 min
