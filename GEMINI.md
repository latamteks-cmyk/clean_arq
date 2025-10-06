# 🤖 Directivas de Arquitectura y Desarrollo para Gemini - Proyecto SmartEdify (v1.2)

**Propósito:** Este documento contiene las directivas operativas que yo, Gemini, seguiré para diseñar, desarrollar y mantener el código del proyecto SmartEdify. Mi objetivo es garantizar la implementación rigurosa de la estrategia de arquitectura definida.

---

### **Pilar 1: Contratos de API, Versionado y Pruebas**

1.  **Diseño Basado en OpenAPI:**
    -   Antes de implementar o modificar un endpoint, **debo** analizar el `openapi.yaml` del servicio.
    -   **Debo** usar un script del gestor de paquetes (ej: `npm run generate:api`) que invoque a `openapi-generator-cli` para generar DTOs y controladores, ubicándolos en `src/infrastructure/http/generated/`.
    -   La lógica de negocio se implementará fuera de la carpeta `generated/`.
    -   Cualquier PR que modifique la API **debe incluir** tanto los cambios en `openapi.yaml` como los archivos de código regenerados en el mismo commit para garantizar la consistencia.

2.  **Pruebas de Contrato (Pact):**
    -   Al modificar un servicio *proveedor*, **debo** ejecutar las pruebas de verificación de pactos para no romper las integraciones. Estas pruebas son obligatorias en el CI.

3.  **Versionado de API:**
    -   Para cambios disruptivos (breaking changes), **debo** crear una nueva versión en la URL (ej: `/api/v2/...`).

4.  **Validación en Runtime:**
    -   **Debo** configurar el middleware de validación según el entorno:
        -   `development/staging`: Modo **estricto**. Una desviación del contrato en la solicitud (`request`) resulta en un error `400`. Una desviación en la respuesta (`response`) resulta en un error `502 Bad Gateway`.
        -   `production`: Modo **pasivo**. Las desviaciones solo se registran (logs) y generan una métrica (`contract_deviation_total`) sin interrumpir la operación.

---

### **Pilar 2: Clean Architecture y Delegación de Reglas**

1.  **Estructura de Capas y Regla de Dependencia:**
    -   **Debo** adherirme a la estructura de capas (Domain, Application, Infrastructure) y a la regla de que las dependencias solo apuntan hacia adentro.

2.  **Delegación Obligatoria de Reglas de Negocio:**
    -   Toda lógica de negocio que dependa de una normativa o política configurable (ej: quórum, mayorías, etc.) **no debe** ser codificada (hardcoded).
    -   **Debo** implementar una llamada al `compliance-service` para obtener estas reglas en tiempo de ejecución.

---

### **Pilar 3: Workflow de Desarrollo**

1.  **Modelo de Ramas (GitFlow):**
    -   **Mi trabajo** se realizará en ramas `feature/*` a partir de `develop` y se entregará vía PR.

2.  **Calidad del Código y CI:**
    -   **No consideraré** una tarea completa hasta que el PR pase todas las comprobaciones del CI, incluyendo linting, pruebas unitarias, de integración, de contrato (Pact) y de seguridad (SAST).

---

### **Pilar 4: Entorno de Desarrollo Local**

1.  **Uso de Docker Compose con Perfiles:**
    -   Para pruebas locales, **utilizaré** `docker-compose.yml` con la bandera `--profile` para levantar solo el conjunto mínimo de servicios necesarios (ej: `core`, `governance`).

---

### **Pilar 5: Observabilidad por Diseño**

1.  **Requisito No Funcional Obligatorio:**
    -   En línea con la "Definition of Done" (DoD) del `SCOPE.md`, **es mi responsabilidad** instrumentar cada nueva funcionalidad con los tres pilares de la observabilidad.

2.  **Checklist de Observabilidad:**
    -   **Logs Estructurados (JSON):** Incluir siempre un `trace_id`.
    -   **Métricas (Prometheus):** Exponer métricas RED (Rate, Errors, Duration) para cada endpoint.
    -   **Trazas (OpenTelemetry):** Propagar el contexto de trazado en llamadas HTTP y eventos de Kafka.

---

### **Pilar 6: Seguridad Criptográfica y Cumplimiento P0**

1.  **Mandatos Criptográficos Inquebrantables:**
    -   Al trabajar con tokens, firmas o cualquier primitiva criptográfica, **debo** seguir rigurosamente los requisitos P0 definidos en el `SCOPE.md` y las especificaciones de servicio.

2.  **Checklist de Seguridad:**
    -   **Fuente Única de Verdad para Tokens:** **Solo el `identity-service` puede emitir tokens JWT/COSE de autenticación o contextuales.** Ningún otro servicio debe generar este tipo de credenciales.
    -   **Algoritmos:** **Solo debo** usar `ES256` o `EdDSA` para firmar tokens. El uso de `HS256` está **explícitamente prohibido**.
    -   **Identificador de Clave (`kid`):** **Debo** asegurar que cada token JWT o COSE emitido incluya el `kid` en su cabecera.
    -   **Proof-of-Possession (DPoP):** **Debo** requerir y validar pruebas DPoP en todos los endpoints que impliquen una escritura o una acción sensible.
    -   **PKCE:** **Debo** asegurar que todos los flujos de autorización OAuth 2.0 utilicen `Proof Key for Code Exchange` (PKCE).

---

### **Pilar 7: Gestión de Artefactos de Documentación**

1.  **Ubicación de Documentos No Definitivos:**
    -   **Debo** generar todos los documentos de trabajo, borradores o artefactos no finales (como PDRs en revisión) en el directorio `referencias/doc_secundarios/`.

---

**Conclusión:** Me comprometo a seguir estas **siete directivas** en todas mis contribuciones para asegurar que el desarrollo de SmartEdify sea consistente, de alta calidad, seguro y fiel a la visión arquitectónica del proyecto.

