# Mejoras de UX — Completados

_Ítems del sprint de mejoras de experiencia de usuario, completados._

---

**BK-20 — [Diseñador] Diseño: modal del formulario de registro**
Descripción: Definir y documentar en `docs/design/screens.md` el wireframe detallado de la ventana modal que contiene el formulario de nueva medición: overlay, animación de apertura/cierre, comportamiento bottom-sheet en móvil (< 640 px), posición y estilo del botón de cierre (✕), focus trap y estados (abierta / cerrando / error de validación).
Prioridad: Alta
Estado: Hecho — wireframes desktop y bottom-sheet móvil, animaciones de apertura/cierre, estado enviando, estado error de validación, especificaciones visuales (overlay, contenedor, botón ✕), order de tabulación del focus trap, tabla de interacciones y accesibilidad WCAG AA. Flujo actualizado en `ux-flow.md`.
Rol: Diseñador UX/UI
Referencia: US-13

---

**BK-21 — [Diseñador] Diseño: layout gráfica + historial en columnas (≥ 768 px)**
Descripción: Definir y documentar en `docs/design/screens.md` el wireframe del layout de dos columnas para pantallas anchas: proporciones de columna (sugerido 55 % gráfica / 45 % historial o 50/50), comportamiento sticky de la gráfica, scroll independiente del historial, breakpoints exactos y degradación a columna única en móvil. Incluir especificaciones de espaciado y alineación entre columnas.
Prioridad: Alta
Estado: Hecho — Wireframes columna única (< 768 px) y dos columnas (≥ 768 px), proporciones 55 %/45 %, gap 24 px, sticky con `top: calc(var(--header-height) + 8px)`, historial scrollable con `max-height` basado en variables CSS, estados intermedios (0 mediciones → columna única, 1 medición → skeleton + historial, ≥ 2 mediciones → gráfica + historial), tabla de espaciado, accesibilidad WCAG AA y notas de implementación para BK-23. Flujo responsivo añadido en `ux-flow.md`.
Rol: Diseñador UX/UI
Referencia: US-14

---

**BK-22 — [Frontend Dev] Implementar modal del formulario de registro**
Descripción: Introducir un componente `Modal` genérico y reutilizable, y usarlo como contenedor de `MeasurementForm`. `MeasurementForm` no debe ser modificado para incluir comportamiento de modal; debe seguir siendo un componente de formulario puro. La composición se gestiona en `HomeView`.

Resultado: `Modal.js` + `Modal.css` en `apps/frontend/src/components/Modal/` y `apps/frontend/public/styles/components/`; `HomeView.js` actualizado para componer Modal + MeasurementForm; 21 tests unitarios en `Modal.test.js`; suite completa 247 tests pasando (sin regresiones).
Prioridad: Alta
Estado: Hecho
Rol: Frontend Dev
Referencia: US-13, BK-20

---

**BK-23 — [Frontend Dev] Implementar layout gráfica + historial en columnas**
Descripción: Cambiar el layout de `HomeView` para que en pantallas ≥ 768 px la gráfica y el historial aparezcan en dos columnas (gráfica sticky a la izquierda 55 %, historial scrollable a la derecha 45 %). En < 768 px o con 0 mediciones se usa siempre columna única.

Resultado: `HomeLayout.css` en `apps/frontend/public/styles/components/`; variables CSS `--header-height` y `--btn-nueva-height` añadidas a `:root` en `main.css`; `HomeView.js` actualizado con `div.dashboard-content#dashboard-content` y toggle de clase `dashboard-content--columnas`; 10 tests unitarios en `HomeView.test.js`; 6 casos E2E en `layout-columnas.spec.js`; suite completa 257 tests pasando (sin regresiones).
Prioridad: Alta
Estado: Hecho
Rol: Frontend Dev
Referencia: US-14, BK-21
