# Contexto para Planner-agent — Plan de implementación ADR-015 (dark luxury)

TRIGGER=ORCHESTRATOR MODE=MANUAL

Actúas como el **Planner-agent** de TrimFlow. El Orquestador te invoca para generar el plan técnico de implementación de la nueva identidad **dark luxury** de la landing pública `/[slug]`, según el ADR-015 recién documentado.

## Tu rol

Genera un **plan técnico estructurado y accionable** para el Executor. NO escribas código. NO modifiques .docs. NO tomes decisiones arquitectónicas (el ADR-015 ya las fija). Tu entregable es el plan.

## Mapa de Intención (confirmado por el programador)

- **Objetivo**: Rediseñar la landing pública `/[slug]` con estética dark luxury (negro carbón + dorado old-gold), manteniendo intacta la lógica de reservas (BookingWizard en `/[slug]/reservar`) y la fuente de datos existente (`/v1/public/:slug`).
- **Criterios de éxito**: imagen "barbería premium, quiero reservar"; estructura Navbar/Hero/Stats/Servicios/Barberos/Galería/Reserva/Ubicación+Horarios/Footer; mobile 360/390/414px sin overflow; booking intacto; multi-tenant; sin hardcoding de "El Clásico"; lint/typecheck/build OK; Auditor aprueba.
- **Fuera de alcance**: backend, auth, appointments, schedule, disponibilidad, creación de citas, API pública.
- **Opción elegida**: A — nuevo ADR-015 documentado (ya creado por el Architect).

## Decisiones del ADR-015 que el plan DEBE respetar (fuente de verdad)

1. **Paleta** (6 tokens, mismo esquema ADR-013, sin migrar):
   - `--landing-bg` (asphalt) = `#0A0A0A` (fondo negro carbón)
   - `--landing-surface` (concrete) = `#111111` (superficie/tarjetas)
   - `--landing-fg` (bone) = `#F2EDE4` (texto marfil)
   - `--landing-muted` (smoke) = `#8A8178` (texto secundario)
   - `--landing-accent` (neon) = `#C9A227` (dorado old-gold)
   - `--landing-danger` (blood) = `#C0392B` (danger)
2. **Tipografía**: SE MANTIENEN Marcellus (display) / Spectral (body) / IBM Plex Mono (utility). Sin cambios en `layout.tsx` ni `fontFamily()`.
3. **Hero**: banda oscura + imagen velada (si `heroImageUrl`) + scrim; doble CTA (dorado primario + outline secundario a `#servicios`); indicador de scroll; marquee reskin.
4. **Navbar**: transparente → oscuro translúcido al scroll (umbral ~32-48px, backdrop-blur); hamburguesa <md; CTA "Reservar cita"; motivo dorado para indicador activo.
5. **Secciones**: bandas oscuras alternadas; tarjetas premium con hairline dorado (40% reposo, pleno hover); botón "RESERVAR" por tarjeta → `/[slug]/reservar` (sin preselección de servicio); slots condicionales para imagen/"MÁS ELEGIDO"/especialidad (ocultos si no hay dato).
6. **Galería y Stats**: capas frontend preparadas (`LandingGallery.tsx`, `LandingStats.tsx`) que NO se renderizan por defecto (no hay dato). Footer extraído a `LandingFooter.tsx`.
7. **Firma visual**: barber-pole → motivo gold-hairline (`.landing-pole` redefinido en globals.css; 3 usos conservados).
8. **Animaciones**: sutiles, gated por `prefers-reduced-motion`, sin deps pesadas (reuso Reveal/IntersectionObserver).
9. **NO inventar datos**: dirección, teléfono, horarios, cifras, redes, "MÁS ELEGIDO", especialidades. Neutralizar copy hardcodeado "Lunes a Domingo".
10. **Multi-tenancy**: dark luxury es el nuevo default (LANDING_DEFAULTS backend + frontend); tenants con config guardada conservan su paleta hasta "Restaurar default".
11. **WIZARD_TOKENS** de `ReservationPage.tsx`: revisar contraste sobre fondo oscuro sin tocar lógica del BookingWizard.

## Archivos que el plan debe cubrir (según ADR-015 "Impacto en código")

- `backend/src/modules/landing/landing-config.ts` — SOLO `LANDING_DEFAULTS.palette` (hexes nuevos)
- `frontend/src/types/landing.ts` — `LANDING_DEFAULTS.palette` (mismo hex) + nota
- `frontend/src/components/landing/landing-theme.ts` — vars `--landing-hero-*` derivadas de paleta
- `frontend/src/components/landing/LandingHero.tsx` — scrim + doble CTA + indicador scroll + marquee reskin
- `frontend/src/components/landing/LandingNav.tsx` — scroll transparente→oscuro + hamburguesa + motivo dorado
- `frontend/src/components/landing/LandingSections.tsx` — tarjetas premium + botón RESERVAR + slots condicionales + bandas dark
- NUEVOS: `LandingGallery.tsx`, `LandingStats.tsx`, `LandingFooter.tsx`
- `frontend/src/components/landing/LandingCTA.tsx` — CTA dorado + escuadra dorada
- `frontend/src/components/landing/LandingState.tsx` — fallback oscuro
- `frontend/src/components/landing/LandingPage.tsx` — integración Gallery/Stats/Footer
- `frontend/src/app/[slug]/page.tsx` y `[slug]/reservar/page.tsx` — skeletons a tokens
- `frontend/src/components/booking/ReservationPage.tsx` — revisión visual WIZARD_TOKENS (sin lógica)
- `frontend/src/app/globals.css` — `.landing-pole` dorado, strop caret dorado, marquee, scroll indicator, navbar
- `app/layout.tsx` — SIN cambios
- `app/(dashboard)/admin/landing/page.tsx` — SIN cambios de esquema

## Restricciones del ciclo

- El plan debe ser paso a paso, verificable, con orden de ejecución (backend defaults → frontend types → theme → componentes → css → verificación).
- Incluir pasos de verificación: lint (`npm run lint`), typecheck (`npx tsc --noEmit` o equivalente), build (`npm run build`), y verificación manual de responsive/booking.
- Incluir nota de que el Executor debe ejecutar `graphify update .` al final.
- El plan NO debe incluir cambios a: backend de reservas, auth, appointments, schedule, disponibilidad, API pública, BookingWizard lógica.

## Formato de respuesta

Devuelve el plan técnico completo en markdown, con:
- Resumen del objetivo
- Pasos numerados con archivos exactos y cambios concretos
- Orden de ejecución
- Pasos de verificación
- Riesgos y notas para el Executor