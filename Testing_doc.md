# Pruebas y Validación

Este documento es la sección oficial de **Pruebas y Validación** para el proyecto. Contiene el detalle de las pruebas planificadas e implementadas (unitarias, de integración y de sistema/E2E), criterios de aceptación y ejemplos de resultados esperados. Está pensado para pegarse tal cual en la documentación del proyecto.

## Resumen ejecutivo

- Alcance: cubre lógica crítica (helpers), flujos de subida y sincronización (Siberia / sync-counter) y la interacción del scanner/manual-entry.
- Herramientas: `vitest` (unit + integración), `@testing-library/react` (componentes), `msw` (mocks HTTP), `playwright` (E2E).


## Metodología

- Unitarias: pruebas aisladas de funciones puras, sin DOM ni red.
- Integración: componentes React renderizados en `jsdom`, con mocks de red (MSW) para simular Supabase Functions y Storage.
- Sistema (E2E): flujos completos ejecutados por Playwright contra un entorno `dev` o `staging` controlado; validar subida de imágenes, inserción en BD y UI final.


## Detalle de pruebas realizadas y resultados obtenidos

> Nota: las siguientes entradas describen las pruebas recomendadas, los criterios de aceptación y ejemplos de resultados esperados para que puedan incorporarse directamente a la documentación oficial. Los bloques de "Resultado obtenido" son ejemplos ilustrativos — reemplázalos por salidas reales tras ejecutar los tests en tu entorno.


### 1) Pruebas Unitarias

- Objetivo: validar funciones puras en `src/lib/utils` y pequeñas utilidades.
- Herramienta: `vitest`.
- Ejemplos de pruebas:

  - `formatoFechaISO(date: Date) -> string` — comprobar que elimina milisegundos.
  - `compressImage(file: File) -> Promise<File>` — validar salida como `File` con `type: 'image/jpeg'` y tamaño menor que el original (mockear canvas en tests unitarios si es necesario).

- Criterios de aceptación:
  - Todas las pruebas unitarias deben pasar (exit code 0).
  - Cobertura mínima sugerida en utilidades críticas: 80%.

- Resultado esperado (ejemplo):

```
PASS src/lib/__tests__/utils.spec.ts (5 tests, 0 failed)
Coverage: 86% (utils)
```


### 2) Pruebas de Integración

- Objetivo: validar componentes y su interacción con supabase functions/storage mediante mocks.
- Herramientas: `vitest` + `@testing-library/react` + `msw`.
- Casos claves:
  - `CounterPage` → llamada a `sync-counter` (mockear endpoint y verificar payload/formato y UI de confirmación).
  - `SiberiaPage` → compresión + subida a `storage` (mockear Storage API), y manejo de fallo en insert en BD (verificar cleanup).
  - `ScannerView` + `ManualCodeModal` → flujo scanner → modal → envío.

- Criterios de aceptación:
  - Cuando el endpoint simulado devuelve 200, la UI muestra confirmación y no hay errores en consola.
  - Si el insert en BD falla, el objeto subido en Storage debe eliminarse (mockear y comprobar llamada `remove`).

- Resultado esperado (ejemplo de salida de test de integración):

```
PASS src/components/__tests__/CounterPage.spec.tsx (3 tests, 0 failed)
PASS src/pages/__tests__/Siberia.spec.tsx (4 tests, 0 failed)
```


### 3) Pruebas de Sistema (E2E)

- Objetivo: validar el flujo completo en entorno de staging/dev: login (si aplica), subida de foto, persistencia y navegación.
- Herramienta: `playwright`.
- Escenarios recomendados:
  1. Subida exitosa: usuario sube imagen, se comprime, se sube a bucket `siberia`, se inserta la fila en la tabla `siberia` y la UI muestra "Registro creado".
  2. Falla en BD: la subida a Storage se realiza, pero el insert en la BD falla; el test valida que el archivo se elimine del bucket y que la UI muestre error.

- Criterios de aceptación E2E:
  - Flujo 1: se observa registro en UI y (opcional) entrada en DB de staging.
  - Flujo 2: el archivo no persiste en Storage tras el fallo y la UI muestra el error esperado.

- Resultado esperado (ejemplo formateado):

```
1 passed (upload.spec.ts) — archivo subido y registro creado (staging DB)
1 passed (cleanup.spec.ts) — backup file removed after DB error
```


## Fragmentos de tests (piezas importantes)

- Unitario (ejemplo):

```ts
// src/lib/__tests__/utils.spec.ts
import { describe, it, expect } from 'vitest'
import { formatoFechaISO } from '@/lib/utils'

describe('formatoFechaISO', () => {
  it('remueve ms de la fecha', () => {
    const d = new Date('2025-01-02T03:04:05.678Z')
    expect(formatoFechaISO(d)).toBe('2025-01-02T03:04:05Z')
  })
})
```

- Integración (esquema):

```ts
// tests/sync-counter.spec.ts (esquema)
import { handler } from '../../supabase/functions/sync-counter/index'
import { describe, it, expect } from 'vitest'

describe('sync-counter function', () => {
  it('responde 200 con payload válido', async () => {
    const req = new Request('https://example.com', { method: 'POST', body: JSON.stringify({ records: [] }) })
    const res = await handler(req)
    expect(res.status).toBe(200)
  })
})
```

- E2E (esquema Playwright):

```ts
// e2e/tests/upload.spec.ts
import { test, expect } from '@playwright/test'

test('sube imagen y crea registro en siberia', async ({ page }) => {
  await page.goto('/')
  await page.click('nav >> text=Siberia')
  const filePath = 'tests/fixtures/photo-small.jpg'
  await page.setInputFiles('input[type=file]', filePath)
  await page.click('button:has-text("Enviar")')
  await expect(page.locator('text=Registro creado')).toBeVisible()
})
```


## Criterios de aceptación y formato de resultados

- Formato sugerido para los resultados que se agreguen al documento oficial (tras ejecutar):

```
<tipo> | <archivo test> | status | duration | notas
Unit  | src/lib/__tests__/utils.spec.ts | PASS | 20ms  | Cobertura 86%
Int   | src/components/__tests__/CounterPage.spec.tsx | PASS | 120ms | Mock MSW
E2E   | e2e/tests/upload.spec.ts | PASS | 3.2s | Staging DB
```


## Resultados de Pruebas de Sistema

La siguiente sección documenta los casos de prueba de sistema (E2E) ejecutados, los pasos para reproducirlos y los resultados obtenidos. Los resultados incluidos abajo son ejemplos formateados que deberías reemplazar por las salidas reales tras ejecutar los tests en tu entorno de staging/CI.


### Ambiente de ejecución (ejemplo)

- App: `pnpm dev` (Vite) corriendo en `http://localhost:5173`.
- Playwright: `@playwright/test` (Chromium headless) en la versión instalada en el proyecto.
- Base de datos: instancia de staging con RLS configurada para permitir cuentas de test.
- Storage: bucket `siberia` en Supabase staging.


### Caso E2E 1 — Subida exitosa (E2E-UPLOAD-01)

- Objetivo: validar subida de imagen completa y persistencia en BD.
- Pasos:
  1. Levantar app: `pnpm dev`.
  2. Abrir la URL base y navegar a la página `Siberia`.
  3. Adjuntar `tests/fixtures/photo-small.jpg` en el input file.
  4. Pulsar `Enviar`.
  5. Verificar UI muestra "Registro creado" y (opcional) verificar fila en DB staging.
- Resultado esperado: UI confirma la creación; archivo presente en Storage; fila creada en la tabla `siberia`.
- Resultado obtenido (ejemplo):

```
> Running 1 test using 1 worker
  ✓ e2e/tests/upload.spec.ts:5:1 › sube imagen y crea registro en siberia (3s)

1 passed (3s)

Artifacts:
 - playwright-report/index.html
 - e2e/results/upload.spec.ts/screenshot-1.png

DB check (ejemplo):
SELECT id, imagen_url, usuario, fecha_hora FROM siberia WHERE imagen_url LIKE '%photo-small.jpg%';
-- Resultado esperado: una fila retornada con `imagen_url` apuntando al objeto en Storage.
```

Observaciones: confirmar que `imagen_url` es accesible si se usa `getPublicUrl` o usar `createSignedUrl` para comprobar la descarga.


### Caso E2E 2 — Falla en insert en BD y cleanup (E2E-UPLOAD-02)

- Objetivo: comprobar que si el insert en la BD falla, el archivo subido se elimina del bucket para evitar archivos huérfanos.
- Pasos:
  1. Preparar entorno donde la API/DB devuelva error (puede simularse en staging o interceptando la request con `page.route` para devolver 500).
  2. Repetir pasos de Subida exitosa.
  3. Validar que la UI muestra error y que el objeto ya no existe en Storage.
- Resultado esperado: UI muestra error; Storage no contiene el archivo.
- Resultado obtenido (ejemplo):

```
> Running 1 test using 1 worker
  ✓ e2e/tests/cleanup.spec.ts:5:1 › elimina archivo en fallo de BD (2.8s)

1 passed (2.8s)

Artifacts:
 - playwright-report/index.html
 - e2e/results/cleanup.spec.ts/screenshot-error.png

Storage check (ejemplo - usando supabase-js o CLI):
// lista objetos en el prefijo
await supabase.storage.from('siberia').list('uploads/2025-11-19/')
// Resultado esperado: array vacio
```

Observaciones: para este flujo es útil instrumentar la API (logs) y conservar el `requestId` para auditar eliminación.


### Registro y conservación de artefactos

- Playwright: habilitar reporter HTML y conservar la carpeta `playwright-report/` como artefacto de CI.
- Capturas y videos: guardar capturas en `e2e/results/` y videos si se habilitan en Playwright.
- Cobertura y reportes: ejecutar `vitest --coverage` y subir el JSON/HTML al job de CI.


### Cómo obtener resultados reales (comandos)

```bash
# Levantar dev server
pnpm dev

# Ejecutar E2E (headless)
pnpm test:e2e

# Ejecutar E2E (headed, para depuración)
pnpm test:e2e:headed

# Ejecutar tests unit/integración
pnpm test

# Generar cobertura
pnpm test:coverage
```

Para verificar en DB (ejemplo usando psql o un cliente):

```sql
SELECT id, imagen_url, usuario, fecha_hora FROM siberia WHERE imagen_url LIKE '%photo-small.jpg%';
```


---
**Notas finales:**

- Los snippets de resultados incluidos son ejemplos formateados; reemplázalos por las salidas reales tras ejecutar los tests en tu entorno. Si quieres, genero los tests y los ejecuto localmente para adjuntar salidas reales y capturas.
**Testing — Resumen y Guía Rápida**

Este documento describe una propuesta práctica para cubrir las tres capas principales de pruebas en la aplicación: pruebas unitarias, pruebas de integración (componentes + librerías) y pruebas end-to-end (E2E) con Playwright. Incluye comandos, estructura sugerida y snippets de ejemplo — solo documentación, no implementaciones.

**Recomendación general:** mantener carpetas separadas: `src/__tests__` (unit + integration) y `e2e/` (Playwright). Usar `vitest` para unit/integration y `@testing-library/react` para pruebas de componentes. Para E2E usar `playwright` con la app corriendo en modo `dev` o en un entorno de staging.

**Setup Rápido**

- **Instalar dependencias:**

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw playwright @playwright/test
```

- **Scripts sugeridos en `package.json`:**

```json
"scripts": {
	"test": "vitest",
	"test:ui": "vitest --ui",
	"test:coverage": "vitest --coverage",
	"test:e2e": "playwright test",
	"test:e2e:headed": "playwright test --headed",
	"test:ci": "vitest --run --reporter dot && playwright test --project=chromium"
}
```


**1 Pruebas Unitarias (Vitest)**

- **Objetivo:** comprobar lógica pura (helpers, utilidades, funciones puras) sin DOM ni red.
- **Ubicación sugerida:** `src/lib/__tests__/utils.spec.ts` o `src/__tests__/utils.spec.ts`.
- **Snippet ejemplo (helper):**

```ts
// src/lib/__tests__/utils.spec.ts
import { describe, it, expect } from 'vitest'
import { formatoFechaISO } from '@/lib/utils'

describe('formatoFechaISO', () => {
	it('convierte Date a ISO sin milisegundos', () => {
		const d = new Date('2025-01-02T03:04:05.678Z')
		expect(formatoFechaISO(d)).toBe('2025-01-02T03:04:05Z')
	})
})
```

- **Consejos:**
	- Mockear solo módulos externos (p. ej. `fetch`) cuando sea necesario usando `vi.stubGlobal` o `vi.mock`.
	- Mantener tests pequeños y deterministas.


**2) Pruebas de Integración (Vitest + Testing Library)**

- **Objetivo:** probar componentes React en aislamiento con DOM simulado, interacciones y efectos secundarios controlados (mock de red).
- **Ubicación sugerida:** `src/components/__tests__/MyComponent.spec.tsx`.
- **Herramientas de ayuda:** `@testing-library/react`, `@testing-library/user-event`, `msw` para mock de API (recomendado).
- **Snippet ejemplo (componente con supabase functions):**

```tsx
// src/components/__tests__/CounterPage.spec.tsx
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import CounterPage from '@/pages/CounterPage'

const server = setupServer(
	rest.post('https://your-supabase-func.example/sync-counter', (req, res, ctx) => {
```
# Pruebas y Validación

  Este documento es la sección oficial de **Pruebas y Validación** para el proyecto. Contiene el detalle de las pruebas planificadas e implementadas (unitarias, de integración y de sistema/E2E), criterios de aceptación y ejemplos de resultados esperados. Está pensado para pegarse tal cual en la documentación del proyecto.

  ## Resumen ejecutivo

  - Alcance: cubre lógica crítica (helpers), flujos de subida y sincronización (Siberia / sync-counter) y la interacción del scanner/manual-entry.
  - Herramientas: `vitest` (unit + integración), `@testing-library/react` (componentes), `msw` (mocks HTTP), `playwright` (E2E).


  ## Metodología

  - Unitarias: pruebas aisladas de funciones puras, sin DOM ni red.
  - Integración: componentes React renderizados en `jsdom`, con mocks de red (MSW) para simular Supabase Functions y Storage.
  - Sistema (E2E): flujos completos ejecutados por Playwright contra un entorno `dev` o `staging` controlado; validar subida de imágenes, inserción en BD y UI final.


		## Detalle de pruebas realizadas y resultados obtenidos

		> Nota: las siguientes entradas describen las pruebas recomendadas, los criterios de aceptación y ejemplos de resultados esperados para que puedan incorporarse directamente a la documentación oficial. Si quieres que ejecute y añada salidas reales, puedo generar los tests y ejecutarlos localmente (necesito permiso para crear/ejecutar archivos y comando para correr en tu entorno).


		### 1) Pruebas Unitarias

		- Objetivo: validar funciones puras en `src/lib/utils` y pequeñas utilidades.
		- Herramienta: `vitest`.
		- Ejemplos de pruebas:

		  - `formatoFechaISO(date: Date) -> string` — comprobar que elimina milisegundos.
		  - `compressImage(file: File) -> Promise<File>` — validar salida como `File` con `type: 'image/jpeg'` y tamaño menor que el original (mockear canvas en tests unitarios si es necesario).

		- Criterios de aceptación:
		  - Todas las pruebas unitarias deben pasar (exit code 0).
		  - Cobertura mínima sugerida en utilidades críticas: 80%.

		- Resultado esperado (ejemplo):

		```
		PASS src/lib/__tests__/utils.spec.ts (5 tests, 0 failed)
		Coverage: 86% (utils)
		```


		### 2 Pruebas de Integración

		- Objetivo: validar componentes y su interacción con supabase functions/storage mediante mocks.
		- Herramientas: `vitest` + `@testing-library/react` + `msw`.
		- Casos claves:
		  - `CounterPage` → llamada a `sync-counter` (mockear endpoint y verificar payload/formato y UI de confirmación).
		  - `SiberiaPage` → compresión + subida a `storage` (mockear Storage API), y manejo de fallo en insert en BD (verificar cleanup).
		  - `ScannerView` + `ManualCodeModal` → flujo scanner → modal → envío.

		- Criterios de aceptación:
		  - Cuando el endpoint simulado devuelve 200, la UI muestra confirmación y no hay errores en consola.
		  - Si el insert en BD falla, el objeto subido en Storage debe eliminarse (mockear y comprobar llamada `remove`).

		- Resultado esperado (ejemplo de salida de test de integración):

		```
		PASS src/components/__tests__/CounterPage.spec.tsx (3 tests, 0 failed)
		PASS src/pages/__tests__/Siberia.spec.tsx (4 tests, 0 failed)
		```


		### 3) Pruebas de Sistema (E2E)

		- Objetivo: validar el flujo completo en entorno de staging/dev: login (si aplica), subida de foto, persistencia y navegación.
		- Herramienta: `playwright`.
		- Escenarios recomendados:
		  1. Subida exitosa: usuario sube imagen, se comprime, se sube a bucket `siberia`, se inserta la fila en la tabla `siberia` y la UI muestra "Registro creado".
		  2. Falla en BD: la subida a Storage se realiza, pero el insert en la BD falla; el test valida que el archivo se elimine del bucket y que la UI muestre error.

		- Criterios de aceptación E2E:
		  - Flujo 1: se observa registro en UI y (opcional) entrada en DB de staging.
		  - Flujo 2: el archivo no persiste en Storage tras el fallo y la UI muestra el error esperado.

		- Resultado esperado (ejemplo formateado):

		```
		1 passed (upload.spec.ts) — archivo subido y registro creado (staging DB)
		1 passed (cleanup.spec.ts) — backup file removed after DB error
		```


		## Fragmentos de tests (piezas importantes)

		- Unitario (ejemplo):

		```ts
		// src/lib/__tests__/utils.spec.ts
		import { describe, it, expect } from 'vitest'
		import { formatoFechaISO } from '@/lib/utils'

		describe('formatoFechaISO', () => {
		  it('remueve ms de la fecha', () => {
		    const d = new Date('2025-01-02T03:04:05.678Z')
		    expect(formatoFechaISO(d)).toBe('2025-01-02T03:04:05Z')
		  })
		})
		```

		- Integración (esquema):

		```ts
		// tests/sync-counter.spec.ts (esquema)
		import { handler } from '../../supabase/functions/sync-counter/index'
		import { describe, it, expect } from 'vitest'

		describe('sync-counter function', () => {
		  it('responde 200 con payload válido', async () => {
		    const req = new Request('https://example.com', { method: 'POST', body: JSON.stringify({ records: [] }) })
		    const res = await handler(req)
		    expect(res.status).toBe(200)
		  })
		})
		```

		- E2E (esquema Playwright):

		```ts
		// e2e/tests/upload.spec.ts
		import { test, expect } from '@playwright/test'

		test('sube imagen y crea registro en siberia', async ({ page }) => {
		  await page.goto('/')
		  await page.click('nav >> text=Siberia')
		  const filePath = 'tests/fixtures/photo-small.jpg'
		  await page.setInputFiles('input[type=file]', filePath)
		  await page.click('button:has-text("Enviar")')
		  await expect(page.locator('text=Registro creado')).toBeVisible()
		})
		```


		## Criterios de aceptación y formato de resultados

		- Formato sugerido para los resultados que se agreguen al documento oficial (tras ejecutar):

		```
		<tipo> | <archivo test> | status | duration | notas
		Unit  | src/lib/__tests__/utils.spec.ts | PASS | 20ms  | Cobertura 86%
		Int   | src/components/__tests__/CounterPage.spec.tsx | PASS | 120ms | Mock MSW
		E2E   | e2e/tests/upload.spec.ts | PASS | 3.2s | Staging DB
		```


