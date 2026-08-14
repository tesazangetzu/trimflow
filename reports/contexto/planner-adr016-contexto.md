# Contexto para Planner-agent — Plan de implementación ADR-016 (reconstrucción editorial)

TRIGGER=ORCHESTRATOR MODE=AUTO

Actúas como el **Planner-agent** de TrimFlow. El Orquestador te invoca para generar el plan técnico de la **reconstrucción editorial** de la landing pública `/[slug]`, según el ADR-016 recién documentado.

## Tu rol

Genera un **plan técnico estructurado y accionable** para el Executor. NO escribas código. NO modifiques .docs. NO tomes decisiones arquitectónicas (el ADR-016 ya las fija). Tu entregable es el plan.

## Mapa de Intención (confirmado por el programador)

- **Objetivo**: Reconstruir la composición visual de la landing pública `/[slug]` con estética editorial/premium/urbana/cinematográfica, eliminando la apariencia de "header + cards grises + fondo negro + botones amarillos" (dashboard/CRUD). Mantener intacta la lógica de negocio, datos y contratos.
- **Criterios de éxito**: visualmente distinta de la actual; datos reales del backend; sin hardcode de lo que viene del backend; hero como global defaults + tenant override; responsive explícito (desktop/tablet/mobile); microinteracciones sutiles; typecheck/lint/tests/build OK; Auditor aprueba.
- **Fuera de alcance**: API, backend de dominio, contratos, reservas, auth, multi-tenancy, modelo de datos, endpoints, disponibilidad, lógica de servicios/barberos/branches, BookingWizard.
- **Documentación**: ADR-015 se mantiene como identidad visual (paleta/tipografía). ADR-016 (NUEVO) es la decisión estructural.

## Fuente de verdad: ADR-016 (leer completo)

`.docs/decisions/ADR-016-reconstruccion-editorial-landing.md`

## Decisiones del ADR-016 que el plan DEBE respetar

1. **Estructura de 8 secciones**: HERO → INTRO → SERVICIOS → EQUIPO → EXPERIENCIA → HORARIOS+UBICACIÓN → CTA FINAL → FOOTER.
2. **HERO**: min-h-[100svh]; eyebrow = `presentation.tagline` + `shop.name`; headline = `presentation.heroTitle` || default `"EL CORTE QUE TE DEFINE."`; propuesta = `heroSubtitle`; CTA primario "RESERVAR CITA" → /[slug]/reservar; CTA secundario "VER SERVICIOS" → #servicios; scroll hint; imagen full-bleed+scrim si `heroImageUrl`, si no → fallback tipográfico/geométrico (sin URLs inventadas); marquesina como franja opcional sobria (sin overflow horizontal).
3. **INTRO**: "MÁS QUE UN CORTE. UNA EXPERIENCIA." — doble columna asimétrica texto+visual, sin tarjetas.
4. **SERVICIOS**: lista editorial numerada (01, 02...) con hairline separador; cada fila: número (mono muted), nombre (display fg), descripción (body muted), duración (mono muted), precio (mono MUTED, no dorado), acción RESERVAR → /[slug]/reservar (sin preselección). NO tarjetas, NO iconos dorados por fila.
5. **EQUIPO**: lista editorial con nombre fuerte (display), hairline, slot condicional de especialidad/foto (hoy no existen → nada). NO círculos de iniciales como diseño principal; fallback: monograma tipográfico o numeral de índice. CTA RESERVAR por barbero.
6. **EXPERIENCIA**: "CLÁSICO EN LA TÉCNICA. MODERNO EN EL ESTILO." — composición asimétrica, sin cards.
7. **HORARIOS+UBICACIÓN**: sección unificada; datos reales de `PublicBranch` (name, openingTime/closingTime, address, phone); eliminar copy genérico "Lunes a Domingo · Reserva con antelación".
8. **CTA FINAL**: "¿LISTO PARA TU PRÓXIMO CORTE?" + único botón "RESERVAR CITA" (sweep + hairline dorado).
9. **FOOTER**: marca (shop.name + Powered by TrimFlow), navegación, ubicación/horarios si existen, SIN redes (no hay datos).
10. **Principios**: editorial NO dashboard; jerarquía (kicker mono accent → titular display fg → cuerpo serif muted); ritmo/espaciado editorial; fotografía protagonista (full-bleed+scrim); dorado SOLO en CTAs/kickers/hairlines/estados activos; evitar cajas surface grises (fondo bg + whitespace + hairlines); responsive explícito sin overflow horizontal; microinteracciones sutiles gated por prefers-reduced-motion; contraste AA.
11. **Hero global defaults + tenant override**: reutilizar campos EXISTENTES de ADR-013 (tagline→eyebrow, heroTitle→título, heroSubtitle→descripción, heroImageUrl→imagen). CTA labels = constantes del componente (sin campo nuevo). NO añadir campos al esquema. Barbería El Clásico NO hardcodeado como global.
12. **Backend**: SOLO ajustar valores default de `presentation.heroTitle` (copy editorial) y `heroSubtitle` en `LANDING_DEFAULTS` (backend + espejo frontend). Sin cambios de interfaz/esquema/merge/migración.

## Archivos que el plan debe cubrir

- `backend/src/modules/landing/landing-config.ts` — SOLO valores default de heroTitle/heroSubtitle
- `frontend/src/types/landing.ts` — espejo de defaults sincronizado
- `frontend/src/components/landing/LandingHero.tsx` — reconstrucción editorial
- `frontend/src/components/landing/LandingSections.tsx` — lista servicios + equipo + intro + experiencia + horarios/ubicación
- `frontend/src/components/landing/LandingCTA.tsx` — CTA final editorial
- `frontend/src/components/landing/LandingFooter.tsx` — marca/nav/ubicación/horarios
- `frontend/src/components/landing/LandingNav.tsx` — estética editorial (mismo esqueleto)
- `frontend/src/components/landing/LandingPage.tsx` — orquestación 8 secciones + heroTitle default
- `frontend/src/app/globals.css` — clases editoriales nuevas, sin overflow horizontal, reducir .landing-card
- SE MANTIENEN: LandingGallery/LandingStats (capas null), Reveal, landing-theme, LandingState, ReservationPage/WIZARD_TOKENS, layout.tsx, admin/landing

## Restricciones del ciclo

- Plan paso a paso, verificable, con orden de ejecución (backend defaults → frontend types → componentes → css → verificación).
- Incluir pasos de verificación: lint, typecheck, build, responsive, CTA de reserva, datos reales, sin errores de consola.
- Incluir `graphify update .` al final.
- NO incluir cambios a: backend de reservas, auth, appointments, schedule, disponibilidad, API pública, BookingWizard, esquema ADR-013, admin/landing.

## Formato de respuesta

Devuelve el plan técnico completo en markdown, con:
- Resumen del objetivo
- Pasos numerados con archivos exactos y cambios concretos
- Orden de ejecución
- Pasos de verificación
- Riesgos y notas para el Executor