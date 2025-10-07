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
**Actualizado:** Implementación de recuperación segura de Passkeys

### Contexto

Se busca eliminar contraseñas y mantener un método de autenticación fuerte, con capacidad de recuperación ante pérdida de dispositivo o clave biométrica.

### Decisión

Usar **WebAuthn/Passkeys** como método primario de autenticación (AAL2/AAL3), con un **mecanismo de recuperación seguro y auditado**.

### Estrategia de recuperación de Passkey

1. **Inicio de proceso controlado**: El usuario solicita recuperación desde el dashboard o vía link firmado (TTL ≤10 min).
2. **Verificación reforzada (Step-Up)**:

   * Validación de identidad vía documento digital + OTP + validación del `device_id` previo.
   * Autorización del `administrator` o `compliance-service` (según política de tenant).
3. **Registro de nueva Passkey**: Se invalida la anterior (`not_before`) y se registra una nueva credencial WebAuthn asociada.
4. **Auditoría WORM**: Cada evento de recuperación se registra con `evidence_ref` y `ip_address` para trazabilidad.

### Consecuencias

* Cumplimiento con NIST 800-63-4 (AAL2/AAL3).
* Reducción de fraude por recuperación no autorizada.
* Proceso trazable y controlado sin requerir contraseñas.

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
**Actualizado:** Mecanismo de firma y validación de bundles

### Contexto

Las políticas PBAC deben distribuirse entre regiones garantizando autenticidad e integridad.

### Decisión

Usar **OPA/Cedar** como Policy Decision Point, con distribución de bundles firmados digitalmente.

### Mecanismo de firma

* Los bundles se empaquetan y firman con **Ed25519** o **ES256**, utilizando el mismo KMS jerárquico del identity-service.
* El manifiesto del bundle (`manifest.json`) contiene:

  * `bundle_version`
  * `hash_sha256`
  * `signature`
  * `kid`
* Los validadores OPA verifican la firma antes de aplicar cambios de política.
* Rechazo automático (`fail-closed`) ante firma inválida o bundle corrupto.

### Consecuencias

* Políticas verificables y auditables.
* Distribución segura vía CDN o GitOps.
* Integridad garantizada en despliegues automatizados.


---

## ADR-005 — Uso exclusivo de algoritmos asimétricos (ES256 / EdDSA)

**Fecha:** Octubre 2025
**Estado:** Aprobado
**Actualizado:** Validación de soporte EdDSA en servicios consumidores

### Contexto

Los validadores (API Gateway, Governance, Physical Security) deben poder verificar tokens firmados con ES256 y EdDSA.

### Decisión

* Establecer **validación multi-algoritmo (ES256 y EdDSA)** en todos los componentes consumidores.
* Añadir prueba automática de validación EdDSA en los pipelines CI/CD de cada servicio dependiente.

### Consecuencias

* Prevención de incompatibilidades durante rotación de algoritmos.
* Mayor flexibilidad criptográfica en tenants con hardware FIPS.
* Garantía de interoperabilidad verificada en cada despliegue.

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
**Actualizado:** Inclusión de métrica de error de validación de tokens

### Contexto

Además de latencia y disponibilidad, se requiere visibilidad sobre fallas de autenticación y errores de firma.

### Decisión

Incluir nueva métrica en el sistema de observabilidad (`Prometheus + Grafana`):

* **`token_validation_error_rate`** = (número de errores de validación / total de tokens validados) × 100

### Métricas completas

| Indicador                     | Descripción                            | Umbral   |
| ----------------------------- | -------------------------------------- | -------- |
| `login_latency_p95`           | Tiempo medio de autenticación          | ≤ 3 s    |
| `revocation_latency_p95`      | Propagación global de revocación       | ≤ 60 s   |
| `token_validation_error_rate` | Tasa de errores de validación JWT/COSE | ≤ 0.1%   |
| `availability_uptime`         | SLA general                            | ≥ 99.95% |
| `dsar_completion_time`        | Tiempo de ejecución DSAR               | ≤ 72 h   |

### Consecuencias

* Monitoreo más granular de fallos criptográficos.
* Correlación directa con eventos de rotación o sincronización JWKS.
* Facilita auditoría SOC2 y respuesta a incidentes.

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



