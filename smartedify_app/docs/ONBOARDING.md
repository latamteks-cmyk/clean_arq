# Plantilla de Onboarding para Desarrolladores - SmartEdify

**Versión:** 1.0

---

## ¡Bienvenido/a al equipo de SmartEdify!

Esta guía está diseñada para ayudarte a configurar tu entorno y a familiarizarte con nuestra arquitectura y procesos en tu primera semana.

### Día 1: Configuración y Primera Inmersión

1.  **Configuración del Entorno:**
    - [ ] Clona los repositorios de los servicios del perfil `core` (`gateway`, `identity`, `tenancy`).
    - [ ] Sigue las instrucciones del `README.md` raíz para instalar las dependencias (Node.js, Docker).
    - [ ] Copia el archivo `.env.example` a `.env` y solicita las credenciales necesarias al líder técnico.
    - [ ] Levanta el stack base con `docker-compose --profile core up -d`.
    - [ ] Verifica que los servicios están corriendo y que puedes acceder al endpoint `/healthz` del gateway.

2.  **Lectura Arquitectónica:**
    - [ ] Lee el **Project Design Report (PDR.md)** para entender la visión general.
    - [ ] Lee el **Software Architecture Document (SAD.md)** para profundizar en las decisiones de diseño.

### Semana 1: Conociendo el Ecosistema

1.  **Análisis de un Servicio Core:**
    - [ ] Elige un servicio del perfil `core` (ej: `identity-service`).
    - [ ] Revisa su `openapi.yaml` para entender su contrato de API.
    - [ ] Explora su estructura de directorios, identificando las capas de `domain`, `application` e `infrastructure`.
    - [ ] Ejecuta las pruebas unitarias y de integración del servicio.

2.  **Tu Primera Tarea (Good First Issue):**
    - [ ] Busca una tarea marcada como `good-first-issue` en el backlog.
    - [ ] Crea una rama `feature/tu-nombre/descripcion-corta` desde `develop`.
    - [ ] Implementa la solución y asegúrate de que todas las pruebas (incluyendo las nuevas que añadas) pasen.
    - [ ] Abre un Pull Request (PR) contra la rama `develop`, siguiendo la plantilla de PR.

### Playbooks de Troubleshooting Común

- **Problema: Un contenedor de Docker no levanta.**
  - **Solución:** Ejecuta `docker-compose logs <nombre-del-servicio>` para ver los errores. Comúnmente, se debe a una variable de entorno faltante o a un puerto ya en uso.

- **Problema: Error 401 Unauthorized al llamar a un endpoint protegido.**
  - **Solución:** Verifica que tu token JWT no haya expirado. Asegúrate de estar enviando el header `DPoP` si es una operación de escritura. Revisa los logs del `gateway-service` para más detalles sobre el fallo de validación.

- **Problema: Un evento de Kafka no parece ser consumido.**
  - **Solución:** Verifica que el consumidor esté suscrito al topic correcto. Revisa los logs del consumidor para ver si hay errores de deserialización del mensaje. Asegúrate de que el esquema del evento sea compatible con el esperado por el consumidor (revisa el Schema Registry).
