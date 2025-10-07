# 🛡️ **Threat Model — Identity Service (SmartEdify v4.4)**

**Metodologías:** STRIDE / LINDDUN
**Normativas:** OWASP Threat Modeling v2.2, NIST SP 800-154, ISO/IEC 27005:2022, NIST 800-63-4, GDPR / LGPD
**Estado:** Aprobado – Octubre 2025

---

## 📘 1. Contexto del Sistema

**Identidad del Sistema:**
`identity-service` es el proveedor central de autenticación, autorización y cumplimiento transnacional en la plataforma SmartEdify.

**Dependencias:**
`API Gateway`, `user-profiles-service`, `governance-service`, `physical-security-service`, `compliance-service`, `Kafka`, `Redis`, `KMS/HSM`.

**Objetivo:**
Garantizar autenticación fuerte, integridad criptográfica, cumplimiento jurídico y resiliencia multi-tenant / multi-región.

---

## ⚙️ 2. Supuestos de Seguridad

| Categoría       | Supuesto                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Infraestructura | TLS 1.3 + mTLS en todas las comunicaciones. Redes privadas segmentadas por región.                       |
| Datos           | No se almacenan contraseñas ni biometría; solo `credentialId`, `publicKey`, `signCount`.                 |
| Claves          | KMS jerárquico (región → tenant → subclave). Rotación cada 90 días.                                      |
| Tokens          | JWT/COSE firmados con ES256 o EdDSA. TTL ≤ 10 min. Refresh rotativo y sender-constrained (DPoP).         |
| Políticas       | Bundles OPA/Cedar firmados (Ed25519) y distribuidos por CDN.                                             |
| BFFs            | Los BFFs **no exponen tokens al frontend**. Mantienen sesión con cookies `HttpOnly` y `SameSite=Strict`. |

---

## 🧩 3. Activos Críticos

| Activo                | Descripción                     | Valor   |
| --------------------- | ------------------------------- | ------- |
| Credenciales WebAuthn | Identidad primaria de usuario   | Alto    |
| Claves KMS/HSM        | Firma de tokens                 | Crítico |
| JWT/COSE Tokens       | Autorización federada           | Alto    |
| Kafka Audit Logs      | Evidencia WORM                  | Alto    |
| DSAR Flow             | Portabilidad y borrado de datos | Crítico |
| Bundles OPA           | Políticas de acceso             | Alto    |
| JWKS                  | Verificación de firmas          | Alto    |

---

## 🔍 4. Análisis STRIDE

| Categoría                      | Amenaza                | Escenario                                    | Mitigación                             |
| ------------------------------ | ---------------------- | -------------------------------------------- | -------------------------------------- |
| **S – Spoofing**               | Robo de token          | Token robado reutilizado                     | DPoP + `cnf.jkt` device-binding        |
|                                | Abuso de refresh token | Replay cross-device                          | Rotación + reuse detection             |
| **T – Tampering**              | Alteración JWT         | Modificación payload                         | Firma ES256/EdDSA verificada por `kid` |
|                                | Corrupción OPA         | Bundle firmado y verificado antes de aplicar |                                        |
| **R – Repudiation**            | Negación de login      | Usuario niega acción                         | Logs WORM + timestamp legal            |
| **I – Info Disclosure**        | Fuga de claims         | JWT expuesto                                 | TTL ≤ 10 min + scope mínimo            |
|                                | Exposición JWKS        | Endpoint global filtrado                     | JWKS por tenant + TTL ≤ 5 min          |
| **D – DoS**                    | Flood OIDC             | Ataque de autenticación masiva               | Rate-limit por tenant/IP + CDN shield  |
|                                | Sobrecarga Redis/Kafka | Congestión infra                             | Circuit breaker + retry asíncrono      |
| **E – Elevation of Privilege** | Bypass PBAC            | Error en política                            | OPA local + fail-closed                |
|                                | Compromiso clave       | Clave filtrada                               | Rotación 90 días + CU-07 recuperación  |

---

## 🔒 5. Riesgo Nuevo: **Device Binding Bypass (Entornos Móviles Comprometidos)**

| Aspecto                                                              | Descripción                                                                            |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Tipo**                                                             | Elevation of Privilege / Information Disclosure                                        |
| **Escenario**                                                        | Robo de clave privada Passkey en dispositivo root/jailbreak → bypass de device binding |
| **Probabilidad**                                                     | Media                                                                                  |
| **Impacto**                                                          | Alto                                                                                   |
| **Mitigaciones**                                                     |                                                                                        |
| • Validación FIDO2 Attestation (AAGUID, origin, type).               |                                                                                        |
| • Integración SafetyNet (Android) y DeviceCheck (iOS).               |                                                                                        |
| • Bloqueo de operaciones AAL3 en dispositivos no certificados.       |                                                                                        |
| • Métrica `device_attestation_failure_rate` para detección temprana. |                                                                                        |
| **Riesgo Residual**                                                  | Medio (bajo si attestation obligatoria).                                               |

---

## 🧠 6. Análisis LINDDUN

| Categoría       | Riesgo                    | Ejemplo                       | Contramedida                      |
| --------------- | ------------------------- | ----------------------------- | --------------------------------- |
| Linkability     | Correlación entre tenants | Reutilización de `sub` global | `sub` único por tenant            |
| Identifiability | Claims PII                | Email en payload              | Seudonimización y `scope` mínimo  |
| Detectability   | Enumeración login         | Errores diferenciados         | Respuestas homogéneas             |
| Disclosure      | DSAR sin cifrado          | Fuga exportación              | Cifrado AES-256 + expiración 48 h |
| Unawareness     | Falta de consentimiento   | Uso biometría sin aviso       | Registro en `consent_audits`      |
| Non-compliance  | Falta de portabilidad     | DSAR no ejecutado             | Orquestación `compliance-service` |

---

## 🧮 7. Matriz de Riesgos (Post-Mitigation)

| Amenaza                 | Prob. | Impacto | Nivel Residual |
| ----------------------- | ----- | ------- | -------------- |
| Phishing TOTP           | Medio | Alto    | Medio          |
| Revocación cross-region | Medio | Medio   | Medio          |
| Device binding bypass   | Medio | Alto    | Medio          |
| Compromiso KMS regional | Bajo  | Crítico | Bajo           |
| Fuga DSAR               | Bajo  | Crítico | Bajo           |
| Corrupción OPA bundle   | Bajo  | Alto    | Bajo           |

---

## 🧱 8. Controles de Seguridad Clave

| Control                | Tipo                      | Referencia      |
| ---------------------- | ------------------------- | --------------- |
| DPoP + `cnf.jkt`       | Autenticación fuerte      | RFC 9449        |
| WebAuthn L3 + Passkeys | Biometría AAL2/AAL3       | NIST 800-63-4   |
| FIDO2 Attestation      | Integridad de dispositivo | FIDO Alliance   |
| TLS 1.3 + mTLS         | Cifrado de transporte     | ISO 27002:10.1  |
| PBAC (OPA/Cedar)       | Autorización contextual   | NIST 800-162    |
| DSAR Runtime           | Cumplimiento legal        | GDPR Art. 17/20 |
| KMS Jerárquico         | Aislamiento criptográfico | ISO 27001 A.10  |
| Logs WORM              | Evidencia inmutable       | ISO 27037       |

---

## 📊 9. Métricas de Seguridad Operacional

| Métrica                           | Objetivo                           | Umbral    |
| --------------------------------- | ---------------------------------- | --------- |
| `token_validation_error_rate`     | Errores de firma JWT/COSE          | ≤ 0.1 %   |
| `revocation_latency_p95`          | Propagación global                 | ≤ 60 s    |
| `device_attestation_failure_rate` | Intentos en entornos no confiables | ≤ 0.5 %   |
| `login_latency_p95`               | Tiempo de autenticación            | ≤ 3 s     |
| `availability_uptime`             | Disponibilidad                     | ≥ 99.95 % |
| `dsar_completion_time`            | Ejecución DSAR                     | ≤ 72 h    |
| `incident_detection_time`         | Detección de brechas               | ≤ 24 h    |

---

## 🚧 10. Riesgos Residuales y Mejoras Continuas

1. **Device binding bypass** → Mitigado con attestation y detección de root.
2. **Phishing vía TOTP** → Mantener solo apps autenticadoras certificadas.
3. **Latencia revocación cross-region** → Monitoreo continuo con pruebas de caos.
4. **Fuga DSAR** → Cifrado temporal y auto-expiración 48 h.

---

## ✅ 11. Conclusión

El **Threat Model v4.4** confirma que `identity-service` mantiene una postura de seguridad madura y conforme con:

* **Zero Trust Architecture**
* **Defense in Depth**
* **Privacy by Design**
* **NIST AAL2/AAL3 y GDPR Art. 25**

Los riesgos críticos están mitigados; los residuales permanecen en niveles aceptables (*bajo ↔ medio*).
El sistema está preparado para auditorías **ISO 27001**, **SOC 2 Tipo II** y **ENS Alto**.

**Estado:** 🟩 *Aprobado – Security Review 2025, SmartEdify CISO Office.*

---

