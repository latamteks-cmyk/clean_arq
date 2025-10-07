# 🧱 Architecture Decision Records (ADR) — Identity Service

## ADR-001 — Elección de OIDC/OAuth 2.1 como estándar de federación

**Fecha:** Octubre 2025
**Estado:** Aprobado

### Contexto

Se requiere interoperabilidad entre múltiples servicios internos y externos, garantizando autenticación segura, federada y verificable.

### Decisión

Adoptar **OpenID Connect (OIDC) + OAuth 2.1** como marco principal de autenticación y autorización, con flujos `authorization_code + PKCE` como únicos habilitados.

### Consecuencias

* Simplifica integración con otros microservicios.
* Flujos implícitos e híbridos quedan prohibidos.
* Mejora cumplimiento con estándares regulatorios (GDPR, LGPD).

---

## ADR-002 — Uso de WebAuthn/Passkeys como autenticación primaria

**Fecha:** Octubre 2025
**Estado:** Aprobado

### Contexto

Se busca eliminar contraseñas, aumentar seguridad y cumplir NIST AAL2/AAL3.

### Decisión

Usar **WebAuthn L3 / Passkeys** como método primario de autenticación para todos los usuarios humanos.

### Consecuencias

* Mejora UX y seguridad frente a phishing.
* Eliminación de contraseñas almacenadas.
* Fallback limitado a TOTP con aplicación autenticadora (no SMS).

---

## ADR-003 — Aislamiento criptográfico por tenant y región

**Fecha:** Octubre 2025
**Estado:** Aprobado

### Contexto

La plataforma es multi-tenant y multi-jurisdiccional, con requisitos legales diferenciados.

### Decisión

Implementar un **KMS jerárquico**:

* Nivel 1: Master key regional.
* Nivel 2: Subclave por tenant (`kid` único).
* Nivel 3: Rotación automática cada 90 días con rollover 7 días.

### Consecuencias

* Reducción del riesgo de compromiso global.
* Soporte legal a segmentación de datos (residencia regional).
* Cada tenant tiene su propio endpoint JWKS.

---

## ADR-004 — Distribución de políticas PBAC mediante OPA/Cedar bundles

**Fecha:** Octubre 2025
**Estado:** Aprobado

### Contexto

La autorización requiere combinar RBAC, ABAC y ReBAC en políticas auditables y centralizadas.

### Decisión

Adoptar **OPA/Cedar** como Policy Decision Point (PDP) distribuido.
Las políticas se distribuyen mediante **bundles firmados y replicados por CDN** (TTL ≤ 5 min).

### Consecuencias

* Evaluación local sin latencia cross-region.
* Auditoría y versionado de políticas.
* Fail-closed en caso de error de comunicación.

---

## ADR-005 — Uso exclusivo de algoritmos asimétricos (ES256 / EdDSA)

**Fecha:** Octubre 2025
**Estado:** Aprobado

### Contexto

Se busca prevenir vulnerabilidades derivadas de algoritmos simétricos (HS256).

### Decisión

Solo se permiten **ES256 o EdDSA** para firmar tokens JWT/COSE.
`HS256` queda **prohibido** en ejemplos, código o documentación.

### Consecuencias

* Mayor seguridad y no repudio.
* Compatibilidad con hardware HSM/FIPS.
* Requiere soporte de validadores multi-algoritmo.

---

## ADR-006 — Replicación asíncrona multi-región

**Fecha:** Octubre 2025
**Estado:** Aprobado

### Contexto

La autenticación no puede depender de llamadas cross-region (latencia y resiliencia).

### Decisión

Usar **Kafka o Pub/Sub** para replicación asíncrona de:

* JWKS (claves públicas)
* Revocaciones (`RevocationEvent`)
* Políticas OPA/Cedar (bundles)

Cada región mantiene validación local con consistencia eventual.

### Consecuencias

* Autenticación resiliente ante fallas de red.
* Sincronización global ≤5 min.
* Garantía de consistencia eventual.

---

## ADR-007 — Registro Delegado en User-Profiles-Service

**Fecha:** Octubre 2025
**Estado:** Aprobado

### Contexto

El registro de usuarios requiere control administrativo y trazabilidad legal.

### Decisión

Delegar el CRUD de usuarios a `user-profiles-service`.
`identity-service` solo gestiona activación y emisión de credenciales seguras.

### Consecuencias

* Mayor gobernanza y cumplimiento.
* Se evita duplicación de identidad.
* Registro por invitación (link firmado TTL 5 min, un solo uso).

---

## ADR-008 — Revocación Global Distribuida

**Fecha:** Octubre 2025
**Estado:** Aprobado

### Contexto

Se requiere revocación de sesiones en ≤60 s P95 en entornos multi-región.

### Decisión

Implementar **revocación distribuida por eventos Kafka + cache Redis local**.
Cada región invalida tokens localmente tras recibir `RevokeSession`.

### Consecuencias

* Cierre de sesión universal rápido.
* Consistencia eventual con auditoría WORM.
* Métricas observables (`revocation_latency_p95`).

---

## ADR-009 — QR Contextual Firmado (COSE/JWS)

**Fecha:** Octubre 2025
**Estado:** Aprobado

### Contexto

Se necesita identificar usuarios en asambleas o accesos físicos con validez jurídica.

### Decisión

`identity-service` es **único emisor y validador** de tokens QR contextuales COSE/JWS (TTL ≤300 s).

### Consecuencias

* No repudio y trazabilidad.
* Validación mediante `governance-service` y DPoP.
* Soporte legal y técnico de participación.

---

## ADR-010 — Cumplimiento DSAR en Tiempo de Ejecución

**Fecha:** Octubre 2025
**Estado:** Aprobado

### Contexto

Debe garantizarse derecho a portabilidad y eliminación (GDPR, LGPD).

### Decisión

Orquestar las solicitudes DSAR desde `identity-service` con ejecución distribuida por `compliance-service`.

### Consecuencias

* Idempotencia y trazabilidad total.
* Cumplimiento automatizado.
* Evidencia almacenada en logs WORM.

---

## ADR-011 — Monitoreo y Métricas Operativas

**Fecha:** Octubre 2025
**Estado:** Aprobado

### Contexto

Se requiere validar SLOs críticos (revocación, login, DSAR, disponibilidad).

### Decisión

Integrar observabilidad con **Prometheus + Grafana + OpenTelemetry**.
SLOs definidos:

* Revocación ≤60 s P95
* Login ≤3 s P95
* Disponibilidad ≥99.95%
* DSAR ≤72 h

### Consecuencias

* Trazabilidad total de desempeño.
* Cumplimiento con auditorías de SLA/SOC2.
* Alertas automatizadas.

---

## ADR-012 — Política de Rotación y Recuperación de Claves

**Fecha:** Octubre 2025
**Estado:** Aprobado

### Contexto

Necesidad de mantener confianza continua y responder ante incidentes criptográficos.

### Decisión

Rotación automática cada 90 días + rollover 7 días.
Proceso de recuperación documentado (CU-07) con eventos `KeyRevoked` y `KeyRolloverInitiated`.

### Consecuencias

* Mitigación de riesgos de compromiso.
* Continúa validez de tokens previos.
* Auditoría verificable.

---

# ✅ Conclusión

Los ADRs definen una arquitectura robusta, auditable y alineada con:

* **Zero Trust Architecture**
* **OAuth 2.1 BCP / OIDC**
* **NIST 800-63-4 (AAL2/AAL3)**
* **ISO 27001 y SOC 2**

La suma de decisiones garantiza:

* Cumplimiento transnacional.
* Resiliencia criptográfica global.
* Escalabilidad multi-tenant sin pérdida de seguridad.


