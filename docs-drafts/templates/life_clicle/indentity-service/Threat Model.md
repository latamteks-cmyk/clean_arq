# 🛡️ **Threat Model — Identity Service (SmartEdify)**

## 📘 **1. Contexto del Sistema**

**Identidad del Sistema:**
`identity-service` provee autenticación, emisión de tokens, sesiones y cumplimiento normativo en entorno multi-tenant y multi-región.
Interactúa con:

* `API Gateway` (PEP)
* `user-profiles-service`
* `governance-service`
* `physical-security-service`
* `compliance-service`
* Kafka (eventos)
* KMS/HSM (claves)
* Redis (cache tokens/sesiones)

**Objetivo de Seguridad:**
Garantizar *autenticación fuerte, integridad de identidad y cumplimiento jurídico* sin exposición de credenciales ni fuga de datos personales.

---

## ⚙️ **2. Supuestos del Modelo**

| Categoría       | Supuesto                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------- |
| Infraestructura | TLS 1.3 + mTLS obligatorio. Todas las regiones operan bajo redes privadas y VPN controladas. |
| Datos           | No se almacenan contraseñas ni biometría; solo metadatos (credentialId, publicKey).          |
| Claves          | Gestionadas por KMS jerárquico (regional → tenant → subclave).                               |
| Tokens          | Firmados ES256 o EdDSA; vida útil ≤ 10 min; refresh rotativo.                                |
| Cumplimiento    | Políticas PBAC auditadas y distribuidas por bundles OPA firmados.                            |

---

## 🧩 **3. Activos Críticos**

| Activo                    | Descripción                            | Valor   |
| ------------------------- | -------------------------------------- | ------- |
| Credenciales WebAuthn     | Identidad primaria de usuario          | Alto    |
| Claves KMS / HSM          | Firma de tokens                        | Crítico |
| JWT/COSE Tokens           | Acceso federado a microservicios       | Alto    |
| Kafka Audit Logs          | Evidencia de cumplimiento              | Alto    |
| DSAR Data Flow            | Ejecución legal de derechos de usuario | Crítico |
| Configuración OPA Bundles | Políticas de acceso                    | Alto    |
| JWKS Public Keys          | Verificación de firmas                 | Alto    |

---

## 🔍 **4. Análisis STRIDE**

| Categoría                      | Amenaza                            | Escenario                                                | Mitigación Implementada                                            |
| ------------------------------ | ---------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| **S – Spoofing**               | Robo o duplicación de credenciales | Suplantación mediante token robado                       | DPoP (Proof of Possession), `cnf.jkt` y validación por dispositivo |
|                                | Abuso de refresh token reutilizado | Replay cross-device                                      | Refresh rotation + reuse detection                                 |
| **T – Tampering**              | Manipulación de tokens             | Alteración de payload JWT                                | Firma ES256/EdDSA verificada por `kid`                             |
|                                | Modificación de OPA bundles        | Bundle firmado y verificado (Ed25519) antes de aplicar   |                                                                    |
| **R – Repudiation**            | Negación de acciones de login o QR | Usuario niega autenticación                              | Logs WORM con hash-chain + timestamp legal                         |
| **I – Information Disclosure** | Fuga de claims sensibles           | Tokens limitados, `scope` controlado, expiración ≤10 min |                                                                    |
|                                | Exposición de JWKS global          | JWKS por tenant/región con TTL ≤5 min                    |                                                                    |
| **D – Denial of Service**      | Ataques a endpoints OIDC           | Rate limiting por IP/tenant + CDN edge filtering         |                                                                    |
|                                | Sobrecarga de Redis o Kafka        | Circuit breakers + colas asíncronas resilientes          |                                                                    |
| **E – Elevation of Privilege** | Bypass de PBAC                     | Evaluación OPA local con fallback “fail-closed”          |                                                                    |
|                                | Compromiso de claves               | Rotación 90 días + recuperación controlada CU-07         |                                                                    |

---

## 🔐 **5. Análisis LINDDUN (Privacidad)**

| Categoría                        | Riesgo                                  | Ejemplo                               | Contramedida                                             |
| -------------------------------- | --------------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| **Linkability**                  | Vinculación de sesiones entre servicios | Correlación entre tenants             | Tokens con `tenant_id` + `region`; sin PII compartida    |
| **Identifiability**              | Identificación directa de usuarios      | Correo visible en payload             | Seudonimización de claims (`sub` aleatorio por tenant)   |
| **Non-repudiation (Privacidad)** | Registro excesivo                       | Auditorías WORM limitadas a metadatos | Minimización de logs PII                                 |
| **Detectability**                | Detección de presencia de usuario       | Sondeo de endpoints OIDC              | Respuestas homogéneas (HTTP 400 genérico)                |
| **Information Disclosure**       | Fuga de datos en DSAR                   | Envío por canal inseguro              | Cifrado TLS + firma y hash de exportaciones              |
| **Unawareness**                  | Falta de consentimiento                 | Uso de biometría sin aviso            | Registro explícito de consentimientos (`consent_audits`) |
| **Non-compliance**               | Falta de portabilidad o borrado         | DSAR no ejecutado                     | Orquestación runtime por `compliance-service`            |

---

## 🌐 **6. Matriz de Riesgos (Post-Mitigation)**

| Amenaza                     | Probabilidad | Impacto | Nivel Residual |
| --------------------------- | ------------ | ------- | -------------- |
| Robo de token DPoP          | Bajo         | Alto    | Medio          |
| Compromiso de KMS regional  | Muy bajo     | Crítico | Bajo           |
| Corrupción de política OPA  | Bajo         | Alto    | Bajo           |
| Denegación regional (Kafka) | Medio        | Medio   | Medio          |
| Replay cross-region         | Bajo         | Alto    | Bajo           |
| Fuga de datos DSAR          | Bajo         | Crítico | Bajo           |
| Phishing vía TOTP           | Medio        | Alto    | Medio          |

---

## 🧠 **7. Controles de Seguridad Clave**

| Control                    | Tipo                      | Referencia              |
| -------------------------- | ------------------------- | ----------------------- |
| DPoP + Proof-of-Possession | Autenticación fuerte      | RFC 9449                |
| WebAuthn Level 3           | MFA biométrico            | FIDO2, NIST 800-63-4    |
| TLS 1.3 + mTLS             | Cifrado transporte        | ISO 27002:10.1          |
| PBAC (OPA/Cedar)           | Autorización contextual   | NIST 800-162            |
| DSAR Runtime Enforcement   | Cumplimiento legal        | GDPR Art. 17/20         |
| KMS Jerárquico             | Aislamiento criptográfico | AWS KMS, Azure KeyVault |
| Logs WORM                  | Evidencia inmutable       | ISO 27037               |

---

## 📊 **8. Métricas de Seguridad Operacional**

| Métrica                       | Objetivo | Umbral |
| ----------------------------- | -------- | ------ |
| `token_validation_error_rate` | < 0.1%   | Bajo   |
| `revocation_latency_p95`      | ≤ 60 s   | Medio  |
| `login_latency_p95`           | ≤ 3 s    | Bajo   |
| `dsar_completion_time`        | ≤ 72 h   | Bajo   |
| `incident_detection_time`     | ≤ 24 h   | Bajo   |

---

## 🚧 **9. Riesgos Residuales y Recomendaciones**

1. **Riesgo Medio:** Phishing vía TOTP → Mitigar con apps certificadas (FIPS) y biometría obligatoria en recuperación.
2. **Riesgo Medio:** Latencia cross-region en revocación → Continuar pruebas de resiliencia y fallback Kafka local.
3. **Riesgo Bajo:** Compromiso de OPA bundles → mantener validación de firma en todos los nodos.
4. **Riesgo Bajo:** Exposición DSAR → usar almacenamiento temporal cifrado + expiración 48h post descarga.

---

## ✅ **10. Conclusión**

El modelo STRIDE/LINDDUN confirma que el `identity-service`:

* Mitiga todas las amenazas de alta severidad conocidas.
* Cumple con NIST, GDPR y OWASP ASVS Nivel 3.
* Mantiene un riesgo residual aceptable (< Medium) para entornos multi-tenant y multi-región.

**Estado:** Aprobado por Oficina de Seguridad y Cumplimiento (versión 4.3, Octubre 2025).

---

