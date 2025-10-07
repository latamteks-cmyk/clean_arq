# 📘 Documento de Visión Técnico–Funcional

## **Identity Service — SmartEdify Platform**

**Versión:** 0.0
**Estado:** Aprobado para ejecución y despliegue multirregional
**Fecha:** Octubre 2025
**Autor:** Product Owner — Identity Service
**Revisores:** CTO, Chief Compliance Officer, Arquitectura, Seguridad, Asesor Legal
**Normas de Referencia:** ISO/IEC 12207, ISO 27001, NIST 800-63-4, OAuth 2.1 BCP, FIDO2/WebAuthn, OpenID Connect Core, GDPR, LGPD

---

## 🧭 1. Visión General

### **Propósito**

El `identity-service` es el proveedor central de identidad, autenticación, autorización y trazabilidad del ecosistema SmartEdify.
Asegura que toda interacción digital sea **irrefutable, auditable y legalmente válida**, habilitando la confianza y cumplimiento en procesos de gobernanza condominal y operaciones administrativas.

### **Objetivos Estratégicos**

* Garantizar autenticación fuerte (AAL2/AAL3) en todos los contextos.
* Proveer control centralizado de acceso y sesiones en un entorno multi-tenant.
* Integrar cumplimiento regulatorio transnacional en tiempo de ejecución.
* Ofrecer una API consistente, segura y verificable para todos los servicios dependientes.
* Soportar escalabilidad global con resiliencia criptográfica y auditoría inmutable.

---

## 👥 2. Usuarios y Personas

| Rol                                     | Tipo de Usuario    | Objetivo Principal                                                      | Interacción con Identity Service                                                          |
| --------------------------------------- | ------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Residente / Propietario**             | Usuario final      | Acceder de forma segura y validar su identidad en asambleas y portales. | Autenticación WebAuthn o Passkey, emisión de QR de acceso, validación de consentimientos. |
| **Administrador de Condominio**         | Usuario operativo  | Gestionar accesos, roles y quórum de asambleas.                         | Gestión de sesiones, firma digital de actas y uso de APIs OIDC.                           |
| **Guardia / Personal de Seguridad**     | Usuario de campo   | Validar accesos físicos mediante QR o credenciales.                     | Validación de tokens contextuales (`/validate`).                                          |
| **Legal y Compliance**                  | Usuario interno    | Auditar identidades, accesos y evidencias digitales.                    | Consultas seguras de logs, validación de políticas activas.                               |
| **Servicios Internos (Microservicios)** | Sistemas           | Autenticarse entre sí para validar operaciones.                         | Autenticación mTLS y JWT con `kid` y `cnf`.                                               |
| **DPO / Auditoría Externa**             | Usuario autorizado | Revisar cumplimiento y DSARs.                                           | Acceso controlado a evidencias anonimizadas.                                              |

---

## 🏗️ 3. Arquitectura Técnica Definitiva

### **3.1. Patrón Arquitectónico**

El `identity-service` adopta un modelo **Zero Trust + Event-Driven + Policy-Based Access**, estructurado en cuatro capas:

1. **Capa de Exposición:** API Gateway (8080) con PEP (Policy Enforcement Point).
2. **Capa de Identidad:** Núcleo OIDC/OAuth2 + WebAuthn + DPoP.
3. **Capa de Cumplimiento:** Integración con `compliance-service` para validaciones legales y DSAR runtime.
4. **Capa de Auditoría:** Kafka y almacenamiento WORM con hash-chain.

### **3.2. Diagrama de Arquitectura**

```mermaid
graph TD
  subgraph Clientes
    U1[Residente Web/Móvil]
    U2[Administrador Web]
    U3[Guardia App]
  end
  subgraph Gateway
    GW[API Gateway / PEP]
  end
  subgraph Core
    ID[Identity Service<br/>OIDC + WebAuthn + PBAC]
    POL[OPA/Cedar Policy Engine]
    CMP[Compliance Service]
    K[Kafka / Audit Stream]
  end
  subgraph Servicios Dependientes
    GOV[Governance]
    FIN[Finance]
    PAY[Payroll]
    HR[Human Resources]
    AM[Asset Management]
  end

  U1-->GW
  U2-->GW
  U3-->GW
  GW-->ID
  ID-->POL
  ID-->CMP
  ID-->K
  ID-->GOV
  ID-->FIN
  ID-->PAY
  ID-->HR
  ID-->AM
```

### **3.3. Tecnologías y Protocolos**

* **OIDC / OAuth 2.1 / PKCE obligatorio**
* **WebAuthn L3 / Passkeys (AAL2/AAL3)**
* **DPoP (RFC 9449)** para tokens sender-constrained
* **JWT ES256 con rotación 90d + rollover 7d**
* **OPA/Cedar** para políticas contextuales híbridas
* **Kafka** para trazabilidad y cumplimiento
* **PostgreSQL** con RLS y cifrado en reposo

---

## ⚙️ 4. Alcance Funcional

### **4.1. Funcionalidades Principales**

| Categoría                | Función                    | Descripción                                                       |
| ------------------------ | -------------------------- | ----------------------------------------------------------------- |
| **Gestión de Identidad** | Registro adaptable         | Registro configurable por tenant, con OTP y validaciones locales. |
|                          | Consentimiento digital     | Captura y almacenamiento inmutable de consentimientos.            |
| **Autenticación**        | WebAuthn / Passkeys        | Método principal, sin almacenamiento de biometría.                |
|                          | TOTP / Fallback            | Alternativa AAL2 con MFA obligatorio.                             |
| **Autorización**         | PBAC híbrido               | Políticas por rol, contexto y relación.                           |
|                          | OPA/Cedar PDP              | Evaluación de acceso en tiempo real.                              |
| **Sesiones**             | Gestión distribuida        | Logout global, DPoP, control por dispositivo.                     |
|                          | Revocación instantánea     | Propagación ≤30s vía Kafka.                                       |
| **QR Contextuales**      | Tokens firmados            | COSE/JWS con TTL corto para asambleas o accesos físicos.          |
| **Cumplimiento (DSAR)**  | Portabilidad y eliminación | Cross-service con orquestación del compliance-service.            |
| **Auditoría Legal**      | Logs WORM                  | Registro inmutable y firmado digitalmente.                        |

---

## 🚦 5. Casos de Uso Funcionales

### **CU-01 Registro Adaptativo**

**Actor:** Residente / Administrador
**Flujo:**

1. Usuario envía datos de registro (email, teléfono, jurisdicción).
2. Se valida OTP doble canal.
3. Se registra consentimiento.
4. Se crea entidad `user` cifrada determinísticamente.

**Resultado:** Usuario registrado y vinculado a un tenant con política regional aplicada.

---

### **CU-02 Autenticación Segura (WebAuthn)**

**Actor:** Usuario final o sistema interno
**Flujo:**

1. Usuario inicia autenticación WebAuthn.
2. Se valida `credentialId` y `publicKey`.
3. Se genera JWT + DPoP (ES256).
4. Se publica evento `AuthSuccess` en Kafka.

**Resultado:** Sesión autenticada, válida para 10 minutos y atada al dispositivo.

---

### **CU-03 Autorización Contextual**

**Actor:** Microservicio dependiente
**Flujo:**

1. Solicitud llega con token DPoP y `tenant_id`.
2. PEP consulta OPA/Cedar con atributos de usuario, recurso y contexto.
3. Respuesta `Permit/Deny` firmada y cacheada (TTL ≤5min).

**Resultado:** Autorización evaluada en tiempo real, auditable y coherente entre regiones.

---

### **CU-04 QR Contextual para Asamblea**

**Actor:** Governance Service / Residente
**Flujo:**

1. Governance solicita QR firmado al identity-service.
2. Identity genera COSE/JWS (`kid`, `ttl=300s`).
3. Guardia valida QR con `/validate` + DPoP.
4. Evento `AccessValidated` registrado en Kafka.

**Resultado:** Acceso físico o digital validado con respaldo legal y técnico.

---

### **CU-05 Revocación Global**

**Actor:** Usuario / Administrador / Compliance
**Flujo:**

1. Solicitud `POST /identity/v2/sessions/{id}/revoke`.
2. Identity marca `not-before` para el `sub`.
3. Se publica evento `RevokeSession`.
4. Todos los servicios invalidan tokens en P95 ≤30s.

**Resultado:** Cierre de sesión universal, trazado en auditoría.

---

### **CU-06 DSAR – Eliminación de Datos**

**Actor:** Usuario final / DPO
**Flujo:**

1. Usuario solicita `DELETE /privacy/data`.
2. Identity crea `job_id` y publica `DataDeletionRequested`.
3. Compliance coordina con governance, hr y finance.
4. Todos los servicios confirman eliminación y firman estado.

**Resultado:** Eliminación completa del usuario con registro de cumplimiento.

---

### **CU-07 Rotación de Claves y Validación**

**Actor:** Infraestructura / Seguridad
**Flujo:**

1. Cada 90 días se rota la clave ES256.
2. JWKS publica nuevas y antiguas claves (rollover 7d).
3. Los servicios validadores sincronizan caché ≤5min.

**Resultado:** Validación continua sin interrupciones durante transición.

---

## 🧩 6. Servicios Integrados y Responsabilidades

| Servicio               | Dependencia                    | Función Soportada                      | Tipo de Interacción   |
| ---------------------- | ------------------------------ | -------------------------------------- | --------------------- |
| **Governance Service** | Identidad, autenticación, QR   | Procesos de asamblea, quórum, votación | Directa OIDC / Tokens |
| **Compliance Service** | Políticas y DSAR               | Validación regulatoria runtime         | Bidireccional         |
| **Finance Service**    | Autenticación fuerte           | Cobros y transferencias seguras        | OIDC + JWT            |
| **Payroll Service**    | Acceso autorizado              | Gestión de nómina y RRHH               | RBAC + DSAR           |
| **HR Service**         | Identidad laboral              | Alta/Baja de empleados                 | API Token Auth        |
| **Asset Management**   | Identificación del propietario | Gestión de bienes y mantenimiento      | PBAC contextual       |

---

## 🔐 7. Seguridad y Cumplimiento

| Mecanismo                           | Descripción                                  |
| ----------------------------------- | -------------------------------------------- |
| **Cifrado TLS 1.3 + mTLS**          | Comunicación segura entre servicios.         |
| **Cifrado en reposo AES-256**       | Protección de datos y claves KMS regionales. |
| **Revocación Distribuida**          | Eventos Kafka + Redis para sesiones.         |
| **Token Sender-Constrained (DPoP)** | Prevención de replay attacks.                |
| **Logs WORM**                       | Evidencias inmutables con hash-chain.        |
| **Cumplimiento DSAR / GDPR / LGPD** | Ejecución orquestada y validada por tenant.  |

---

## 📈 8. Métricas y SLOs

| Área           | Métrica             | Umbral  | Frecuencia |
| -------------- | ------------------- | ------- | ---------- |
| Autenticación  | Latencia P95        | ≤3s     | Continuo   |
| Revocación     | Propagación global  | ≤30s    | Realtime   |
| Disponibilidad | SLA anual           | ≥99.95% | Mensual    |
| DSAR           | Resolución completa | ≤72h    | Diario     |
| Auditoría      | Eventos firmados    | 100%    | Continuo   |

---

## 🗺️ 9. Roadmap Técnico

| Fase                                      | Objetivo                                       | Entregables                         |
| ----------------------------------------- | ---------------------------------------------- | ----------------------------------- |
| **Fase 1 — Core Identity (Q4 2025)**      | WebAuthn, OIDC completo, sesiones distribuidas | API estable y cumplimiento inicial  |
| **Fase 2 — Compliance Runtime (Q1 2026)** | OPA/Cedar, DSAR cross-service, rotación 90d    | Operación validada y auditable      |
| **Fase 3 — Global Expansion (Q2 2026)**   | Multi-región, certificaciones ISO, eIDAS       | Despliegue internacional SmartEdify |

---

## 🧾 10. Gobierno del Producto

| Rol                | Responsabilidad                         |
| ------------------ | --------------------------------------- |
| Product Owner      | Roadmap funcional y priorización        |
| CTO / Arquitectura | Diseño técnico y escalabilidad          |
| Seguridad          | Cifrado, pentesting, revisión de claves |
| Compliance         | Adaptación regulatoria por país         |
| DevSecOps          | Monitoreo, CI/CD y resiliencia          |
| QA                 | Pruebas AAL, OIDC, DSAR y auditoría     |

---

## 🏁 11. Conclusión

El **Identity Service** es el eje de confianza y control en la plataforma SmartEdify.
Combina autenticación biométrica moderna, autorización contextual y cumplimiento regulatorio automatizado.
Su arquitectura final garantiza interoperabilidad, seguridad criptográfica y cumplimiento multi-país en entornos de alta demanda.

**Estado final del producto:** 🟩 *Listo para despliegue productivo y expansión internacional.*

---
