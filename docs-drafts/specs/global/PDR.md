# Project Design Report (PDR) - SmartEdify

**Versión:** 1.1 (Revisado)  
**Fecha:** 2025-10-05  
**Autor:** Gemini, Arquitecto de Software
**Estado:** Borrador en Revisión

---

## 1. Introducción y Visión Estratégica

Este documento define la arquitectura y el diseño técnico para el proyecto **SmartEdify**, una plataforma SaaS global de gobernanza y gestión de condominios.

La visión es convertir a SmartEdify en el **sistema operativo digital para comunidades residenciales y comerciales**, garantizando cumplimiento legal adaptativo, transparencia operativa y una participación comunitaria inteligente. La arquitectura está diseñada para ser modular, escalable, resiliente y segura, permitiendo una rápida expansión a múltiples jurisdicciones (Latinoamérica y Europa).

## 2. Principios Arquitectónicos Fundamentales

El desarrollo se regirá por ocho pilares no negociables, extraídos de la estrategia de arquitectura y las directivas operativas.

### 2.1. Pilar 1: Diseño de API Primero (API-First) con OpenAPI
- **Fuente de Verdad:** El archivo `openapi.yaml` de cada servicio es el contrato inmutable.
- **Workflow:** Diseño en `openapi.yaml` -> Generación de código (`openapi-generator`) -> Implementación de lógica.
- **Validación Runtime:** Modo **estricto** en Staging (falla ante desviación), modo **pasivo** en Producción (registra y alerta).

### 2.2. Pilar 2: Clean Architecture
Todos los microservicios deben adherirse a los principios de Clean Architecture para garantizar la separación de intereses, la testabilidad del núcleo de negocio y la independencia de la infraestructura.

### 2.3. Pilar 3: Seguridad Criptográfica P0 (Zero Trust)
- **Algoritmos:** Uso exclusivo de `ES256` o `EdDSA`. `HS256` está prohibido.
- **Identificador de Clave (`kid`):** Obligatorio en la cabecera de todos los tokens.
- **Proof-of-Possession (DPoP):** Requerido para operaciones de escritura.
- **PKCE:** Obligatorio para todos los flujos de autorización OAuth 2.0.
- **Fuente Única de Verdad:** Solo el `identity-service` emite y valida tokens de identidad.

### 2.4. Pilar 4: Privacidad por Diseño y Flujos DSAR
- **Orquestación Centralizada:** Los flujos de Derechos del Titular (DSAR), como la eliminación de datos, son orquestados por el `compliance-service`.
- **Borrado Criptográfico (Crypto-Erase):** La eliminación de datos sensibles se implementa preferentemente mediante la destrucción de las claves de cifrado, haciendo los datos irrecuperables, como se especifica en `identity-service.md`.

### 2.5. Pilar 5: Delegación de Reglas y Resiliencia (Compliance-as-a-Service)
- **Delegación Obligatoria:** Ninguna regla de negocio normativa (quórum, mayorías, etc.) debe estar codificada. Se debe consultar en tiempo de ejecución al `compliance-service`.
- **Estrategia de Resiliencia:**
    - **Fail-Closed:** Ante un fallo en la comunicación con el `compliance-service`, la operación debe ser denegada por defecto para garantizar la seguridad y el cumplimiento.
    - **Caché Inteligente:** Las políticas obtenidas se almacenarán en caché (con un TTL bajo, ej: 5 minutos) para mejorar el rendimiento y la resiliencia. La invalidación se gestionará mediante eventos o webhooks.
    - **Idempotencia:** Las solicitudes al `compliance-service` y las operaciones resultantes deben ser idempotentes.

### 2.6. Pilar 6: Observabilidad por Diseño
- **Logs Estructurados (JSON):** Con `trace_id` para correlación.
- **Métricas (Prometheus):** Estándar RED (Rate, Errors, Duration) por endpoint.
- **Trazas Distribuidas (OpenTelemetry):** Propagación de contexto en todo el flujo.

### 2.7. Pilar 7: Gobernanza de Eventos Asíncronos
- **Schema Registry:** El `notifications-service` actúa como el registro central de esquemas para todos los eventos de Kafka, garantizando que no haya incompatibilidades.
- **Versionado de Eventos:** Todos los eventos deben seguir un esquema versionado (ej: `ReservationCreated.v1`, `AttendanceValidated.v2`) para permitir una evolución desacoplada de los consumidores.

### 2.8. Pilar 8: Eficiencia y Conciencia de Costos (Cost Awareness)
- **Diseño Eficiente:** Se debe considerar el costo computacional y de almacenamiento como un atributo de diseño.
- **Optimización:** Aplicar estrategias como el uso de GPUs solo cuando sea necesario (IA), caché de embeddings, TTLs cortos para sesiones de video y políticas de archivado en frío para datos históricos.

## 3. Arquitectura General del Sistema
- **Patrones:** Microservicios, API Gateway, **Backend for Frontend (BFF)**, Event-Driven (Kafka), Multi-Tenant.
- **Modelo Multi-Tenant:** `Shared Database, Shared Schema` con discriminador `tenant_id` y RLS en PostgreSQL.
    - **Clarificación para `user-profiles-service`:** El aislamiento primario de los perfiles es por `tenant_id`. Las relaciones con `condominium_id` son secundarias y gestionadas a través de membresías, permitiendo que un perfil pertenezca a múltiples condominios bajo el mismo tenant.

### 3.1. Lista de Microservicios (20 Servicios)

**Capa BFF (3 Servicios):**
1. `bff-admin-service`
2. `bff-user-service`
3. `bff-mobile-service`

**Capa de Negocio y Dominio (17 Servicios):**
4.  `gateway-service`
5.  `identity-service`
6.  `user-profiles-service`
7.  `tenancy-service`
8.  `governance-service`
9.  `compliance-service`
10. `streaming-service`
11. `reservation-service`
12. `asset-management-service`
13. `finance-service`
14. `documents-service`
15. `notifications-service` (incluye Event Schema Registry)
16. `physical-security-service`
17. `marketplace-service`
18. `analytics-service`
19. `payroll-service`
20. `hr-compliance-service`

## 4. Pila Tecnológica
| Componente | Tecnología |
| :--- | :--- |
| **Backend** | Node.js, NestJS, TypeScript |
| **Frontend** | React (Web), React Native (Móvil), TypeScript |
| **Bases de Datos** | PostgreSQL 16+ (con RLS), Redis |
| **Mensajería** | Apache Kafka |
| **Contenedores** | Docker, Kubernetes |
| **Cloud** | AWS (S3, EKS, RDS) |
| **Observabilidad** | Prometheus, Grafana, OpenTelemetry, ELK |
| **CI/CD** | GitHub Actions |
| **IA Local** | Llama.cpp, pgvector |

## 5. Estructura del Repositorio y Workflow
- **Enfoque:** Multi-repo (un repositorio por microservicio).
- **Workflow:** GitFlow (`main`, `develop`, `feature/*`).
- **Pull Requests:** Obligatorios para `develop` y `main`, con revisión y CI exitosa.

## 6. Entorno de Desarrollo Local
Se utilizará un `docker-compose.yml` centralizado con perfiles para optimizar la experiencia del desarrollador (DX).
- **`docker-compose --profile core up`**: Servicios esenciales.
- **`docker-compose --profile governance up`**: Stack de gobernanza.
- **`docker-compose --profile full up`**: Toda la plataforma.

## 7. Plan de Implementación Inicial
1.  **Crear Estructura de Directorios:** En `smartedify_app`, crear una carpeta `services`.
2.  **Inicializar Repositorios:** Crear un repositorio Git para cada microservicio.
3.  **Desarrollar `docker-compose.yml` Base:** Con el perfil `core`.
4.  **Implementar Servicios Fundamentales:** `gateway-service`, `identity-service`, `tenancy-service`.
5.  **Configurar CI/CD:** Establecer el pipeline básico para los primeros servicios.

## 8. Definition of Done (DoD) Global
Para que una tarea o microservicio se considere "completo", debe cumplir con los siguientes criterios mínimos:
- **API:** Contrato definido y actualizado en `openapi.yaml`.
- **Pruebas:** Cobertura de pruebas unitarias y de integración superior al 80%. Pruebas E2E para flujos críticos.
- **Observabilidad:** Métricas RED, logs estructurados y trazas distribuidas implementadas para nuevas funcionalidades.
- **Seguridad:** Auditoría de seguridad completada. Sin vulnerabilidades críticas. Requisitos P0 (DPoP, PKCE, etc.) implementados.
- **Documentación:** `README.md` actualizado con instrucciones de despliegue, configuración y variables de entorno.
- **CI/CD:** Pipeline de build, test y despliegue completamente automatizado y en verde.
