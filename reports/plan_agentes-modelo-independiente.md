# Plan: Homogeneización de Agentes para Independencia de Modelo

> **Generado:** 2026-07-29
> **Proyecto:** TrimFlow
> **Stack:** TypeScript, Node.js, NestJS, Next.js, PostgreSQL
> **Riesgo:** BAJO
> **Modo de ejecución:** AUTO
> **Fuente de verdad:** .docs/

---

## Objetivo

Modificar los 5 archivos de agente en `.opencode/agents/` para que su comportamiento sea idéntico independientemente del modelo que los ejecute (DeepSeek, GPT, Claude, Gemini), dentro del runtime OpenCode.

## Referencias en .docs

- `PROJECT.md`: Stack, arquitectura, contexto del proyecto
- `reports/plan_agentes-modelo-independiente.md`: Este plan
- Archivos destino: `.opencode/agents/{Orchestrator,Architect,Planner,Executor,Auditor}-agent.md`

## Pasos

### Paso 1 — Cambiar temperature en frontmatter de los 5 archivos

Cambiar `temperature: 0.2` a `temperature: 0.0` en Orchestrator-agent.md, Architect-agent.md, Planner-agent.md.
Cambiar `temperature: 0.1` a `temperature: 0.0` en Executor-agent.md, Auditor-agent.md.

**Detalle por archivo:**

| Archivo | Línea | Cambio |
|---------|-------|--------|
| Orchestrator-agent.md | 4 | `temperature: 0.2` → `temperature: 0.0` |
| Architect-agent.md | 4 | `temperature: 0.2` → `temperature: 0.0` |
| Planner-agent.md | 4 | `temperature: 0.2` → `temperature: 0.0` |
| Executor-agent.md | 4 | `temperature: 0.1` → `temperature: 0.0` |
| Auditor-agent.md | 4 | `temperature: 0.1` → `temperature: 0.0` |

### Paso 2 — Reemplazar flag de comunicación Orchestrator → Executor (Orchestrator-agent.md)

**Archivo:** Orchestrator-agent.md

**Contexto:** El Orquestador usa el string literal `[Mensaje enviado por el Agente Orquestador]` (líneas 243 y 249) como señal para que el Executor active modo auto. Este string literal es frágil porque:
- Depende de un texto en español que no es semánticamente parseable
- Modelos diferentes podrían alterar el texto al generar el prompt
- No hay estructura parseable que garantice detección robusta

**Cambio:** Reemplazar el string literal por un flag estructurado en el formato `TRIGGER=ORCHESTRATOR` y `MODE=AUTO` en cabecera del prompt.

**Línea 243 (dentro de la lista de contenido del prompt):**
```
- Una línea que indique que proviene del Orquestador para activar MODO AUTO:
  `[Mensaje enviado por el Agente Orquestador]`
```
→
```
- Una cabecera estructurada que indique que proviene del Orquestador en MODO AUTO:
  `TRIGGER=ORCHESTRATOR MODE=AUTO`
```

**Líneas 248-249 (ejemplo de prompt):**
```
> *"[Mensaje enviado por el Agente Orquestador] Ejecuta este plan completo. Usa .docs como fuente de verdad. Persiste el estado en reports/[fecha]_[slug]_iter[N].md. Opera en modo automático: no esperes confirmación entre pasos salvo errores bloqueantes."*
```
→
```
> *"TRIGGER=ORCHESTRATOR MODE=AUTO Ejecuta este plan completo. Usa .docs como fuente de verdad. Persiste el estado en reports/[fecha]_[slug]_iter[N].md. Opera en modo automático: no esperes confirmación entre pasos salvo errores bloqueantes."*
```

### Paso 3 — Reemplazar detección de flag en Executor-agent.md

**Archivo:** Executor-agent.md

**Contexto:** El Executor detecta el modo auto verificando si el primer mensaje contiene `/modo:auto` o fue enviado por el Orquestador (línea 50-53). El comando `/modo:auto` también aparece en la tabla de comandos (línea 224).

**Cambios:**

**Línea 50:**
```
¿El primer mensaje de esta sesión contiene `/modo:auto` o fue enviado por el Agente Orquestador?
```
→
```
¿El primer mensaje de esta sesión contiene el flag estructurado `TRIGGER=ORCHESTRATOR MODE=AUTO`?
```

**Líneas 224-225 (tabla de comandos):**
```
| `/modo:auto` | Activa modo automático. Solo válido al inicio de sesión |
| `/modo:manual` | Activa modo manual (default). Solo válido al inicio de sesión |
```
→
```
| `MODE=AUTO` | Activa modo automático. Debe incluirse con `TRIGGER=ORCHESTRATOR` al inicio del prompt |
| `MODE=MANUAL` | Activa modo manual (default). Ausencia de flag = manual |
```

### Paso 4 — Reestructurar instrucciones en capas para todos los archivos

El principio de capas: lo esencial primero (reglas globales, restricciones absolutas), detalle después (protocolos, formatos). Esto asegura que cualquier modelo capte lo crítico primero, incluso si tiene context window limitado o atiende mejor el inicio del prompt.

**Para los 5 archivos**, la estructura debe ser:

```
─── CAPA 1: IDENTIDAD Y REGLA FUNDAMENTAL (primeras líneas después del frontmatter) ───
"Eres el agente de [rol]..."
"REGLAS GLOBALES (breves, sin ejemplos extensos)"

─── CAPA 2: RESTRICCIONES ABSOLUTAS ───
Lista de NUNCA / SIEMPRE en formato de checklist conciso

─── CAPA 3: FLUJO PRINCIPAL ───
Protocolo de inicio → flujo de trabajo → entregas

─── CAPA 4: DETALLE (formatos, comandos, relaciones) ───
Formatos de entregables, tablas de comandos, relación con otros agentes
```

**Cambios concretos por archivo:**

#### 4a. Orchestrator-agent.md
- Mover "REGLA GLOBAL DE DOCUMENTACIÓN" (líneas 19-30) inmediatamente después del primer párrafo de identidad (línea 13-15), ANTES de "RESTRICCIONES ABSOLUTAS"
- Mantener "RESTRICCIONES ABSOLUTAS" como Capa 2
- El resto permanece como Capa 3 y 4

#### 4b. Architect-agent.md
- Mover "REGLA GLOBAL DE DOCUMENTACIÓN" (líneas 17-28) después del párrafo de identidad (línea 13), antes de "PROPIEDAD EXCLUSIVA"
- "PROPIEDAD EXCLUSIVA" + "RESTRICCIONES ABSOLUTAS" como Capa 2
- El resto como Capa 3 y 4

#### 4c. Planner-agent.md
- Mover "REGLA GLOBAL DE DOCUMENTACIÓN" (líneas 17-28) después del párrafo de identidad (línea 13), antes de "RESTRICCIONES ABSOLUTAS"
- "RESTRICCIONES ABSOLUTAS" como Capa 2
- El resto como Capa 3 y 4

#### 4d. Executor-agent.md
- Mover "REGLA GLOBAL DE DOCUMENTACIÓN" (líneas 17-28) después del párrafo de identidad (línea 13), antes de "RESTRICCIONES ABSOLUTAS"
- "RESTRICCIONES ABSOLUTAS" como Capa 2
- El resto como Capa 3 y 4

#### 4e. Auditor-agent.md
- Mover "REGLA GLOBAL DE DOCUMENTACIÓN" (líneas 17-28) después del párrafo de identidad (línea 13), antes de "RESTRICCIONES ABSOLUTAS"
- "RESTRICCIONES ABSOLUTAS" como Capa 2
- El resto como Capa 3 y 4

### Paso 5 — Eliminar lenguaje que asuma comportamiento específico de modelo

No hay ejemplos obvios de asunciones de modelo (ej: "como modelo de lenguaje,...", "recuerda que eres un LLM..."), pero se deben verificar patrones como:

- Referencias a "context window" o "memoria": **No se encontraron en ningún archivo.**
- Instrucciones que dependan de capacidades específicas de un modelo: **No se encontraron.**
- Lenguaje que asuma cierta longitud de output: **No se encontró.**

**Sin cambios necesarios para este paso.** Los archivos ya son mayoritariamente modelo-independientes en su redacción. La temperatura 0.0 y la estructura en capas son las medidas principales.

### Paso 6 — Verificar consistencia del protocolo completo

Validar que:
- El Orchestator genera `TRIGGER=ORCHESTRATOR MODE=AUTO` en el prompt al Executor
- El Executor detecta `TRIGGER=ORCHESTRATOR MODE=AUTO` para activar modo auto
- Todos los agentes tienen temperature 0.0
- Todos los agentes tienen estructura en capas (regla global → restricciones → flujo → detalle)
- Ningún agente referencia el string literal antiguo `[Mensaje enviado por el Agente Orquestador]` ni `/modo:auto`
- El Auditor puede verificar estos cambios

---

## Archivos involucrados

| Archivo | Rol | Cambio principal |
|---------|-----|------------------|
| `.opencode/agents/Orchestrator-agent.md` | Coordinación | temperature 0.0, flag ORCHESTRATOR, capas |
| `.opencode/agents/Architect-agent.md` | Arquitectura | temperature 0.0, capas |
| `.opencode/agents/Planner-agent.md` | Planificación | temperature 0.0, capas |
| `.opencode/agents/Executor-agent.md` | Ejecución | temperature 0.0, flag MODE=AUTO, capas |
| `.opencode/agents/Auditor-agent.md` | Auditoría | temperature 0.0, capas |

---

## Riesgos identificados

- **Riesgo BAJO:** Los cambios son puramente en prompts/documentación de agentes, no en código de aplicación. No hay scripts que compilen, tests que fallen, ni dependencias que romper.
- **Precaución:** Si el Orchestrator o Executor están actualmente en una sesión activa, los cambios se reflejarán al reiniciar la sesión del agente, no en caliente. Esto es esperado y no problemático.

---

## Puntos de validación

1. **Frontmatter:** `grep "temperature:" .opencode/agents/*.md` → todos deben mostrar `temperature: 0.0`
2. **Flag antiguo Orchestrator:** `grep "Mensaje enviado por el Agente Orquestador" .opencode/agents/*.md` → 0 resultados
3. **Flag antiguo Executor:** `grep "/modo:auto" .opencode/agents/*.md` → 0 resultados
4. **Flag nuevo Orchestrator:** `grep "TRIGGER=ORCHESTRATOR" .opencode/agents/Orchestrator-agent.md` → 1+ resultados
5. **Flag nuevo Executor:** `grep "MODE=AUTO" .opencode/agents/Executor-agent.md` → 2+ resultados (detección y tabla)
6. **Estructura capas:** Cada archivo debe tener el orden: identidad → regla global → restricciones → flujo → detalle

---

## Checklist de trabajo

- [ ] `chore(agents): cambiar temperature a 0.0 en frontmatter de 5 agentes`
- [ ] `fix(agents): reemplazar flag frágil por TRIGGER=ORCHESTRATOR MODE=AUTO en Orchestrator-agent.md` depende de anterior
- [ ] `fix(agents): actualizar detección de flag en Executor-agent.md` depende de anterior
- [ ] `refactor(agents): reestructurar Orchestrator-agent.md en capas esencial→detalle` depende de anterior
- [ ] `refactor(agents): reestructurar Architect-agent.md en capas esencial→detalle` depende de anterior
- [ ] `refactor(agents): reestructurar Planner-agent.md en capas esencial→detalle` depende de anterior
- [ ] `refactor(agents): reestructurar Executor-agent.md en capas esencial→detalle` depende de anterior
- [ ] `refactor(agents): reestructurar Auditor-agent.md en capas esencial→detalle` depende de anterior
- [ ] `test(agents): validar que no existen referencias a flags antiguos ni temperaturas incorrectas` depende de anterior

---

## Manifiesto del plan

```
─────────────────────────────────────────
MANIFIESTO DEL PLAN
─────────────────────────────────────────
Proyecto  : TrimFlow
Stack     : TypeScript, Node.js, NestJS, Next.js, PostgreSQL
Objetivo  : Homogeneizar 5 agentes para independencia de modelo
Alcance   : 6 pasos · 9 commits estimados
Archivos  : .opencode/agents/{Orchestrator,Architect,Planner,Executor,Auditor}-agent.md
Riesgo    : BAJO
Bloqueos  : ninguno
Docs ref  : .opencode/agents/* (fuente directa)
─────────────────────────────────────────
```
