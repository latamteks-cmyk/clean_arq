¡Por supuesto! Aquí tienes una **instrucción clara, directa y accionable** para colocar al inicio del directorio del proyecto (puedes ponerlo en el `README.md` principal o en un archivo `CONTRIBUTING.md`):

---

## 🟦 **Instrucción Obligatoria de Actualización Documental y Especificación por Fase**

> **IMPORTANTE: Para todo el equipo de desarrollo de SmartEdify**

---

### **Al Cierre de Cada Fase, Feature o Cambio Crítico:**

1. **Actualización de Documentación**

   * Es **obligatorio** actualizar:

     * El `README.md` global y el de cada microservicio afectado.
     * Los contratos OpenAPI (en `/openapi/` y en el servicio correspondiente).
     * Los archivos `CHANGELOG.md` global y por servicio.
     * Diagramas, flujos y referencias en la documentación de `/docs/` o playbooks técnicos.
   * La actualización debe reflejar el estado real del código y los endpoints, dependencias, eventos y reglas delegadas al `compliance-service`.

2. **Generación de Especificación Técnica**

   * Toda nueva feature, cambio mayor o fase debe estar respaldada por una **especificación técnica actualizada** (en `/docs/specs/` o en el README del servicio).
   * La especificación debe detallar: alcance, endpoints, flujos, eventos, reglas normativas delegadas, criterios de aceptación y escenarios de error.

3. **Desglose de Tareas Atómicas**

   * Deriva de la especificación una **lista de tareas atómicas** (user stories, issues o subtareas), referenciando siempre la sección o documento correspondiente.
   * Cada tarea debe ser ejecutable, testeable y verificable de forma independiente, y debe tener criterios de aceptación claros.

4. **Pull Request de Documentación**

   * Antes de cerrar cualquier fase o mergear cambios a `main`, se debe crear un **PR exclusivo de documentación** que:

     * Incluya los cambios documentales.
     * Actualice versiones/tags si aplica.
     * Sea revisado por un "guardian de arquitectura" designado.

5. **Automatización Recomendada**

   * Usa los scripts provistos (`update-docs.sh`, etc.) para generar y validar documentación y specs.
   * El CI bloqueará cualquier merge que no cumpla con los requisitos anteriores.

---

**Nota:** Ningún desarrollo se considerará finalizado ni listo para producción si la documentación, especificación técnica y tareas atómicas no han sido actualizadas y aprobadas en el repositorio.

---

**Cumplir con este flujo es parte fundamental del Definition of Done (DoD) y garantiza la continuidad, integridad y escalabilidad del proyecto.**

---
