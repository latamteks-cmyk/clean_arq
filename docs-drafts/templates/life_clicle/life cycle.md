# 📆 Plantilla de Ciclo de Vida de Proyecto SaaS

## 1. Planeación y Diseño

**Objetivo:** definir alcance, arquitectura y riesgos antes del desarrollo.

| Entregable                           | Descripción                                                                         | Responsable      | Criterio de Aceptación                   |
| ------------------------------------ | ----------------------------------------------------------------------------------- | ---------------- | ---------------------------------------- |
| Documento de Visión                  | Define objetivos, usuarios, restricciones, modelo SaaS (multi-tenant, autoservicio) | Product Owner    | Aprobado por stakeholders clave          |
| ADRs (Architecture Decision Records) | Registros de decisiones técnicas con justificación y consecuencias                  | Arquitectura     | Completo y versionado en repositorio     |
| Threat Model (STRIDE/LINDDUN)        | Identificación de riesgos de seguridad y privacidad                                 | Seguridad        | Mitigaciones documentadas y revisadas    |
| Plan de Cumplimiento                 | Mapeo normativo (GDPR, SOC2, ISO27001)                                              | Legal/Compliance | Validado por CISO y Legal                |
| Roadmap y Backlog                    | Casos de uso priorizados y medibles                                                 | Product Owner    | Historias refinadas con criterios claros |

---

## 2. Desarrollo y Construcción

**Objetivo:** construir el software conforme a estándares de seguridad y calidad.

| Entregable                       | Descripción                                         | Responsable | Criterio de Aceptación                            |
| -------------------------------- | --------------------------------------------------- | ----------- | ------------------------------------------------- |
| CI/CD Pipeline                   | Automatiza build, test y despliegue                 | DevOps      | Validado en entorno de staging                    |
| Código Fuente Versionado         | Repositorios con control de ramas y revisión 4-eyes | Desarrollo  | Auditoría de código sin vulnerabilidades críticas |
| Pruebas Unitarias e Integración  | Cobertura ≥80%, pruebas automatizadas en pipelines  | QA          | Resultado 100% exitoso en CI                      |
| SBOM                             | Inventario de dependencias y licencias              | DevSecOps   | Sin dependencias con CVSS >7.0                    |
| Políticas de Codificación Segura | OWASP, NIST SP 800-218                              | Desarrollo  | Cumplimiento verificado en revisión de código     |

---

## 3. Validación y Certificación

**Objetivo:** asegurar calidad, estabilidad y cumplimiento antes del release.

| Entregable                                 | Descripción                                             | Responsable      | Criterio de Aceptación      |
| ------------------------------------------ | ------------------------------------------------------- | ---------------- | --------------------------- |
| Pruebas E2E y de Carga                     | Validan flujos funcionales y rendimiento                | QA               | Cumple SLO definidos        |
| Auditoría de Seguridad (Pentest)           | Validación externa de vulnerabilidades                  | Seguridad        | Hallazgos críticos cerrados |
| Revisión PRR (Production Readiness Review) | Validación final de arquitectura, seguridad y operación | Arquitectura/SRE | Todos los puntos “OK”       |
| DPIA/PIA                                   | Evaluación de impacto en privacidad                     | Compliance       | Aprobado por DPO            |
| Certificación de Cumplimiento              | Validación frente a GDPR, SOC2 o equivalente            | Legal            | Documento firmado           |

---

## 4. Despliegue

**Objetivo:** ejecutar la transición segura y controlada a producción.

| Entregable                                | Descripción                           | Responsable | Criterio de Aceptación      |
| ----------------------------------------- | ------------------------------------- | ----------- | --------------------------- |
| Plan de Despliegue y Rollback             | Estrategia blue/green o canary        | SRE         | Rollback probado en staging |
| Infraestructura como Código (IaC)         | Terraform, Helm o Ansible versionados | DevOps      | Despliegue reproducible     |
| Configuración Segura de Claves y Secretos | Gestión mediante KMS/Vault            | Seguridad   | Validado por CISO           |
| Monitoreo Inicial                         | Dashboards y alertas configuradas     | SRE         | Alertas activas y probadas  |

---

## 5. Operación y Monitoreo

**Objetivo:** mantener la disponibilidad, seguridad y rendimiento.

| Entregable                     | Descripción                                 | Responsable          | Criterio de Aceptación          |
| ------------------------------ | ------------------------------------------- | -------------------- | ------------------------------- |
| SLO/SLA                        | Definición de métricas críticas y umbrales  | SRE                  | Aprobado y monitoreado          |
| Plan de Respuesta a Incidentes | Procedimientos IRP con roles definidos      | Seguridad            | Simulación de incidente exitosa |
| Auditorías Periódicas          | Revisión de logs, accesos y configuraciones | Seguridad/Compliance | Sin desviaciones graves         |
| Copias de Seguridad y DR       | Política de respaldo y restauración         | Infraestructura      | Prueba de recuperación validada |

---

## 6. Mejora Continua

**Objetivo:** optimizar producto, seguridad y experiencia del cliente.

| Entregable                 | Descripción                                              | Responsable       | Criterio de Aceptación               |
| -------------------------- | -------------------------------------------------------- | ----------------- | ------------------------------------ |
| Postmortems de Incidentes  | Análisis de causa raíz y medidas preventivas             | SRE               | Acciones correctivas implementadas   |
| Reporte de Métricas de Uso | Análisis de adopción y rendimiento del sistema           | Product Owner     | Revisión trimestral con stakeholders |
| Actualización de ADRs      | Revisión técnica tras cambios relevantes                 | Arquitectura      | ADRs actualizados en repositorio     |
| Auditoría DevSecOps        | Validación continua de pipelines, dependencias, secretos | DevSecOps         | 100% pipelines conformes             |
| Roadmap de Evolución       | Incorporación de feedback, nuevos features, estándares   | Dirección Técnica | Publicado y validado trimestralmente |
