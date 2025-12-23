# Diagramas — Flujos y Casos de Uso (Usuarios finales)

Este documento contiene diagramas de flujo y diagramas de casos de uso orientados a usuarios finales. Los diagramas están en sintaxis Mermaid (para flujos y secuencias) y PlantUML (para diagramas de casos de uso). Puedes renderizarlos con herramientas compatibles (VS Code plugins, PlantUML server, Mermaid live editor, etc.).


## Índice

- Flujos principales (Mermaid)
  - Flujo: Captura y subida de foto (Siberia)
  - Flujo: Sincronización de registros (Counter / sync-counter)
  - Secuencia: Manual entry fallback (Counter)
- Casos de uso (PlantUML)
  - Diagrama: Casos de uso - Usuario final (Counter + Siberia)
  - Diagrama: Casos de uso - Operador (sync, storage)


---

## Flujos principales (Mermaid)

### 1) Flujo: Captura y subida de foto (Siberia)

```mermaid
flowchart TD
  U[Usuario abre página Siberia] --> Select[Selecciona o toma foto]
  Select --> Compress[compressImage (cliente)]
  Compress --> Upload[Upload a Storage (bucket siberia)]
  Upload --> GetUrl[Obtener public/signed URL]
  GetUrl --> Insert[Insertar registro en tabla `siberia` vía Function/DB]
  Insert --> Decision{Insert OK?}
  Decision -->|Sí| Success[Mostrar "Registro creado" en UI]
  Decision -->|No| Cleanup[Eliminar objeto de Storage]
  Cleanup --> Error[Mostrar error en UI]

  classDef userAction fill:#e2f7ff,stroke:#0366d6;
  class Select,Upload,Insert userAction;
```

Descripción rápida: el cliente comprime la imagen, sube al bucket `siberia`, obtiene la URL y envía los metadatos al backend para persistir; si la inserción falla se elimina el archivo.


### 2) Flujo: Sincronización de registros (Counter / sync-counter)

```mermaid
sequenceDiagram
  participant U as Usuario/Frontend
  participant F as Frontend (App)
  participant S as Supabase Functions (/sync-counter)
  participant DB as Postgres

  U->>F: Click "Sincronizar" / enviar registros desde Counter
  F->>S: POST /sync-counter { metadata, records }
  S->>DB: INSERT INTO counter (...) VALUES (...)
  DB-->>S: 200 OK / filas insertadas
  S-->>F: 200 OK { inserted: n }
  F-->>U: Mostrar mensaje de éxito / errores
```

Notas: en el frontend se recomienda enviar un token de sesión en `Authorization` y evitar exponer `service_role` en el cliente.


### 3) Secuencia: Fallback Manual (Counter - entrada manual de código)

```mermaid
sequenceDiagram
  participant User
  participant Scanner
  participant UI

  User->>Scanner: Intenta escanear código
  Scanner-->>UI: No detectado / tiempo agotado
  UI->>User: Mostrar botón "Manual"
  User->>UI: Abrir ManualCodeModal
  User->>UI: Introduce código (p. ej. 6 dígitos) y confirma
  UI->>App: Procesar código -> validar y añadir registro (misma lógica que scanner)
  App-->>User: Mostrar resultado (OK / error)
```

Este flujo asegura que el usuario tiene alternativa cuando el escaneo falla (botón Manual dentro de la vista ScannerView).


---

## Casos de uso (PlantUML)

> Nota: para renderizar PlantUML usa un plugin de PlantUML en tu editor o un servidor PlantUML.

### 1) Casos de uso — Usuario final (Counter + Siberia)

```plantuml
@startuml
left to right direction
actor "Usuario final" as User
rectangle Sistema {
  (Escanear código) as SC
  (Introducir código manual) as ME
  (Sincronizar registros) as SY
  (Capturar y subir foto) as UF
  (Ver registros) as VR
}
User --> SC
User --> ME
User --> UF
User --> VR
User --> SY
note right of UF: Subida + compresión client-side (Siberia)
note right of ME: Modal para introducir código manual (Counter)
note right of SY: Sincroniza registros locales con Supabase (sync-counter)
@enduml
```


### 2) Casos de uso — Operadores: Counter y Siberia

```plantuml
@startuml
left to right direction
actor "Operador Counter" as OpCounter
actor "Operador Siberia" as OpSiberia
rectangle Sistema {
  (Gestionar sincronización) as SR
  (Revisar logs Counter) as RLC
  (Gestionar bucket Storage) as GB
  (Revisar archivos huérfanos) as RAH
}
OpCounter --> SR
OpCounter --> RLC
OpSiberia --> GB
OpSiberia --> RAH
note right of SR: Invocación de Functions (sync-counter) o tareas batch
note right of GB: Revisar archivos huérfanos en `siberia` y políticas RLS
@enduml
```


---

## Cómo integrar estos diagramas en la documentación

- Para Mermaid: muchos renderizadores MkDocs/Docsify/VuePress soportan Mermaid nativamente; también puedes usar el plugin `markdown-it-mermaid`.
- Para PlantUML: usa PlantUML server o plugins (VSCode PlantUML) y embece las imágenes resultantes (PNG/SVG) en la documentación final.


---

Si quieres, puedo también generar archivos SVG/PNG de los diagramas (renderizados) o agregar estos diagramas dentro del README o Wiki del proyecto. ¿Deseas que los exporte como imágenes y los añada al repo? 
