# Propuesta de Estructura de Directorios - SmartEdify

**Versión:** 1.1 (Revisado)
**Fecha:** 2025-10-05

---

## 1. Propósito

Este documento define la estructura de directorios recomendada para el proyecto SmartEdify, diseñada para maximizar la coherencia, la automatización y la experiencia de desarrollo (DX) en un ecosistema de microservicios.

## 2. Estructura de Directorio Raíz (Monorepo Gestionado)

La carpeta `smartedify_app` contendrá una estructura de monorepo gestionado para facilitar el desarrollo y las pruebas locales.

```
smartedify_app/
├── .dockerignore         # Define qué archivos ignorar al construir imágenes Docker.
├── .env.example          # Plantilla de variables de entorno para el desarrollo local.
├── .gitignore            # Archivos y directorios a ignorar por Git.
├── CHANGELOG.md          # Registro de cambios globales del proyecto.
├── docker-compose.yml    # Orquesta todos los servicios para el entorno de desarrollo local (con perfiles).
├── README.md             # Instrucciones generales del proyecto: cómo configurar, levantar y probar.
├── docs/                 # Documentación general del proyecto (arquitectura, guías, playbooks).
│   └── README.md         # Índice y guía de la documentación.
├── infra/                # Infraestructura como Código (Terraform) para los entornos.
├── libs/                 # Librerías y utilidades compartidas entre servicios (ej: DTOs comunes, middlewares).
├── scripts/              # Scripts de utilidad (ej: inicializar BD, generar claves).
├── services/             # Contenedor principal para el código fuente de todos los microservicios.
│   ├── bff-admin-service/
│   ├── bff-user-service/
│   ├── bff-mobile-service/
│   ├── gateway-service/
│   ├── identity-service/
│   └── ... (15 otros servicios de dominio)
└── test-suites/          # Pruebas de integración cross-service y End-to-End (E2E).
```

### Justificación de las Mejoras:

- **`infra/` (d):** Centraliza la Infraestructura como Código (IaC) con Terraform, alineándose con la estrategia DevSecOps y garantizando entornos reproducibles.
- **`test-suites/` (b):** Proporciona un lugar dedicado para las pruebas de integración de alto nivel que validan flujos de negocio completos entre múltiples servicios, desacoplándolas de los servicios individuales.
- **`libs/` (c):** Fomenta la reutilización de código y evita la duplicación al centralizar módulos compartidos, como DTOs comunes, lógica de observabilidad o clientes de servicios.
- **`CHANGELOG.md` (e):** Establece una práctica de versionado y comunicación de cambios a nivel de todo el proyecto.

## 3. Estructura Interna de un Microservicio

Cada microservicio dentro de `services/` seguirá una estructura estandarizada y enriquecida.

Ejemplo para `governance-service`:

```
services/governance-service/
├── .gitignore
├── CHANGELOG.md          # Registro de cambios específicos del servicio.
├── Dockerfile
├── openapi.yaml          # Contrato de API (API-First).
├── package.json
├── README.md             # Documentación específica del servicio.
├── tsconfig.json
├── contracts/            # Contratos de APIs dependientes (ej: finance-service.v1.openapi.yaml).
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── domain/           # Lógica y entidades de negocio puras.
│   ├── application/      # Casos de uso y orquestación.
│   └── infrastructure/   # Adaptadores a tecnologías (HTTP, DB, Kafka).
└── test/
    ├── unit/
    ├── integration/
    └── e2e/
```

### Justificación de las Mejoras:

- **`contracts/` (a):** Implementa la estrategia de "Contract Registry" a nivel local. El pipeline de CI puede descargar aquí los `openapi.yaml` de los servicios de los que depende y ejecutar validaciones de contrato (Pact) o generar clientes tipados, detectando `breaking changes` antes del despliegue.
- **`CHANGELOG.md` (e):** Permite una trazabilidad fina de los cambios, versiones y correcciones aplicadas a cada microservicio de forma individual.
