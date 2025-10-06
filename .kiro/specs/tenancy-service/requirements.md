# 📋 Requirements Document – Tenancy Service

## 1. Introduction

This document establishes the auditable requirements for the Tenancy Service (port 3003), which serves as the **canonical source of truth** for tenants, condominiums, buildings, and units. The service maintains the physical and organizational structure of each community while ensuring multi-tenant isolation and data integrity across the SmartEdify platform.

---

## 2. Requirements

### Requirement ID: TS-001 - Tenant Organization Management

**User Story:**  
As a Platform Administrator, I want to create and manage tenant organizations (administradoras or juntas), so that I can onboard new clients to the SaaS platform with complete data isolation and proper organizational structure.

**Acceptance Criteria:**
1. WHEN creating a new tenant THEN the system SHALL validate legal name uniqueness per country and generate a unique UUID
2. WHEN updating tenant status THEN the system SHALL enforce referential integrity with all dependent entities and emit TenantStatusChanged events
3. WHEN deactivating a tenant THEN the system SHALL cascade the status change to all associated condominiums and notify dependent services
4. WHEN creating an ADMINISTRADORA tenant type THEN the system SHALL allow multiple condominium associations with proper governance structure
5. WHEN creating a JUNTA tenant type THEN the system SHALL typically associate with a single condominium with direct governance
6. WHEN querying any data THEN the system SHALL automatically apply Row-Level Security (RLS) filters by tenant_id
7. WHEN tenant data is accessed THEN the system SHALL log all access attempts with correlation IDs for audit purposes

---

### Requirement ID: TS-002 - Condominium Community Management

**User Story:**  
As a Tenant Administrator, I want to register and manage condominium communities under my organization, so that I can organize properties and services with proper compliance validation and governance structure.

**Acceptance Criteria:**
1. WHEN creating a condominium THEN the system SHALL enforce unique name constraint within the tenant scope and validate required legal information
2. WHEN setting financial configurations THEN the system SHALL validate against country-specific compliance rules and emit FinancialConfigChanged events
3. WHEN deactivating a condominium THEN the system SHALL prevent new unit assignments but maintain historical data with proper audit trails
4. WHEN updating notification settings THEN the system SHALL validate email format (RFC5322) and verify permission consents
5. WHEN managing condominium registrations THEN the system SHALL validate registration numbers against government rules and track verification status
6. WHEN condominium data changes THEN the system SHALL emit CondominiumUpdated events to dependent services with full context
7. WHEN compliance violations are detected THEN the system SHALL generate alerts and prevent non-compliant operations

---

### Requirement ID: TS-003 - Building and Unit Hierarchy Management

**User Story:**  
As a Property Manager, I want to define building structures and unit inventories, so that I can accurately represent the physical layout of condominiums with proper aliquot distribution, governance rights, and real-time validation.

**Acceptance Criteria:**
1. WHEN creating buildings THEN the system SHALL enforce unique naming within condominium-tenant scope and validate structural requirements
2. WHEN creating private units THEN the system SHALL require building association, validate local_code uniqueness, assign proper unit classification, and initialize validation_rules
3. WHEN creating common areas THEN the system SHALL require common_type classification, cost center assignment, usage restrictions, and compatibility constraints
4. WHEN calculating aliquot distributions THEN the system SHALL maintain decimal precision (7,4), validate sum ≤ 1.0001 per condominium with real-time triggers, and enforce individual unit aliquot ≤ 0.5
5. WHEN bulk importing units THEN the system SHALL validate all constraints, referential integrity, aliquot consistency, and execute aliquot validation triggers before transaction commit
6. WHEN unit data changes THEN the system SHALL validate business rules, update dependent calculations, recalculate aliquot sums, and emit UnitUpdated events to user-profiles-service
7. WHEN unit hierarchy is modified THEN the system SHALL recalculate affected aliquots, validate governance impact, and update last_validated_at timestamps
8. WHEN units are deleted THEN the system SHALL prevent deletion if active memberships exist, maintain historical references, and redistribute aliquots if necessary
9. WHEN aliquot validation fails THEN the system SHALL raise specific exceptions with condominium context and prevent transaction completion
10. WHEN unit validation rules are updated THEN the system SHALL trigger re-validation of affected units and emit validation status events

---

### Requirement ID: TS-004 - Contact and Communication Management

**User Story:**  
As a Legal Representative, I want to manage legal, billing, and notification contacts for tenants and condominiums, so that communication flows to authorized personnel with proper consent validation and audit trails.

**Acceptance Criteria:**
1. WHEN assigning contact roles THEN the system SHALL validate user existence in identity system and verify authorization permissions
2. WHEN managing tenant contacts THEN the system SHALL enforce role-based access patterns and maintain contact hierarchy
3. WHEN updating contact information THEN the system SHALL require evidence of consent for communication channels and validate contact formats
4. WHEN designating legal representatives THEN the system SHALL validate against governance event evidence and require proper documentation
5. WHEN contact changes occur THEN the system SHALL emit ContactUpdated events to notifications-service with complete contact context
6. WHEN contact permissions are modified THEN the system SHALL update communication preferences and notify affected services
7. WHEN contact validation fails THEN the system SHALL provide specific error messages and suggested corrections

---

### Requirement ID: TS-005 - Multi-Tenant Data Isolation and Security

**User Story:**  
As a Security Architect, I want to ensure complete data isolation between tenants, so that clients cannot access each other's information and maintain regulatory compliance with zero-trust principles.

**Acceptance Criteria:**
1. WHEN querying any data THEN the system SHALL automatically apply Row-Level Security (RLS) filters by tenant_id with no exceptions
2. WHEN creating new records THEN the system SHALL enforce tenant_id consistency across all foreign key relationships and validate composite keys
3. WHEN performing cross-tenant operations THEN the system SHALL reject requests with mismatched tenant context and log security violations
4. WHEN using composite foreign keys THEN the system SHALL validate both tenant_id and entity_id matches with referential integrity checks
5. WHEN tenant isolation is breached THEN the system SHALL immediately log security events, alert administrators, and block the operation
6. WHEN API requests are processed THEN the system SHALL validate JWT tenant claims against requested resource tenant_id
7. WHEN database connections are established THEN the system SHALL set session-level RLS context for additional security
8. WHEN audit logs are generated THEN the system SHALL include tenant_id in all log entries for compliance tracking

---

### Requirement ID: TS-006 - Event-Driven Integration and Messaging

**User Story:**  
As a System Integrator, I want the service to emit domain events for all structural changes, so that other services can maintain consistency and proper integration with reliable message delivery using transactional outbox pattern.

**Acceptance Criteria:**
1. WHEN creating/updating/deleting entities THEN the system SHALL emit Kafka events with full context including entity state snapshots
2. WHEN emitting events THEN the system SHALL include tenant_id, condominium_id, correlation_id, and event_version for proper tracking
3. WHEN processing events THEN the system SHALL ensure idempotency using event_id deduplication and maintain event ordering
4. WHEN structural changes occur THEN the system SHALL notify user-profiles-service, asset-management-service, and finance-service with relevant data
5. WHEN event processing fails THEN the system SHALL implement retry mechanisms with exponential backoff (initial: 1s, max: 300s) and dead letter queues
6. WHEN events are published THEN the system SHALL use transactional outbox pattern with dedicated outbox table and background processor
7. WHEN event schemas change THEN the system SHALL maintain backward compatibility and version events appropriately
8. WHEN critical events fail THEN the system SHALL alert operations team and provide manual intervention capabilities

**Transactional Outbox Implementation Specifications:**
```sql
-- Outbox table for reliable event publishing
CREATE TABLE event_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_version INTEGER NOT NULL DEFAULT 1,
    event_data JSONB NOT NULL,
    correlation_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    next_retry_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED', 'DEAD_LETTER'))
);

CREATE INDEX idx_outbox_processing ON event_outbox(status, next_retry_at) WHERE status = 'PENDING';
CREATE INDEX idx_outbox_tenant ON event_outbox(tenant_id, created_at);
```

**Event Processing Strategy:**
- **Background Processor**: Polls outbox table every 5 seconds for PENDING events
- **Batch Processing**: Process up to 100 events per batch to optimize throughput
- **Retry Logic**: Exponential backoff with jitter, max 5 retries before dead letter
- **Monitoring**: Track processing latency, retry rates, and dead letter queue size

---

### Requirement ID: TS-007 - Tax and Regulatory Compliance Management

**User Story:**  
As a Compliance Officer, I want to validate tax registrations and condominium legal status, so that we meet country-specific regulatory requirements and maintain legal compliance with proper audit trails.

**Acceptance Criteria:**
1. WHEN registering tax information THEN the system SHALL validate ID numbers against country-specific rules using external validation services
2. WHEN verifying registrations THEN the system SHALL track verification status, timestamps, evidence documents, and verification source
3. WHEN designating primary tax IDs THEN the system SHALL enforce single primary registration per tenant and validate uniqueness
4. WHEN managing condominium registrations THEN the system SHALL validate registration periods (valid_from/to) and check for overlaps
5. WHEN compliance violations occur THEN the system SHALL emit ComplianceAlert events to compliance-service with detailed violation context
6. WHEN tax information changes THEN the system SHALL maintain complete audit history and require authorized approval
7. WHEN regulatory requirements change THEN the system SHALL re-validate existing registrations and flag non-compliant entities
8. WHEN compliance reports are generated THEN the system SHALL provide comprehensive status across all tenants and jurisdictions

---

### Requirement ID: TS-008 - Unit Validation and Reference Management

**User Story:**  
As a system integrator, I want the Tenancy Service to provide authoritative unit validation for other services, so that unit references across the platform remain consistent and valid with high performance and purpose-specific validation.

**Acceptance Criteria:**
1. WHEN other services reference units THEN the system SHALL provide unit validation APIs with comprehensive unit information and P95 response time ≤ 50ms
2. WHEN validating unit assignments THEN the system SHALL verify unit existence, type compatibility, availability status, and membership constraints based on purpose (MEMBERSHIP, RESERVATION, FINANCIAL)
3. WHEN unit relationships change THEN the system SHALL notify dependent services of validation rule changes via real-time UnitValidationCompleted events
4. WHEN providing unit data THEN the system SHALL include ownership details, restrictions, governance rights, aliquot information, and compatibility scores
5. WHEN unit validation fails THEN the system SHALL provide detailed error information with specific field violations, constraint details, and actionable recommendations
6. WHEN validation requests are cached THEN the system SHALL implement intelligent caching with proper invalidation on unit changes and validation rule updates
7. WHEN bulk validation is requested THEN the system SHALL support batch operations with up to 1,000 units per request with P95 ≤ 2s processing time
8. WHEN validation APIs are unavailable THEN the system SHALL provide graceful degradation and fallback responses with cached validation results
9. WHEN validation rules are updated THEN the system SHALL re-validate affected units and emit validation status change events
10. WHEN purpose-specific validation is requested THEN the system SHALL apply different validation criteria based on the intended use case

---

### Requirement ID: TS-009 - Data Migration and Import/Export Operations

**User Story:**  
As a condominium administrator, I want to import existing condominium data and export current configurations, so that I can migrate from other systems and maintain data backups with proper validation and integrity checks.

**Acceptance Criteria:**
1. WHEN importing data THEN the system SHALL support bulk import of units, buildings, ownership information, and aliquot distributions with format validation
2. WHEN validating imports THEN the system SHALL provide comprehensive validation reports with specific error details, line numbers, and correction suggestions
3. WHEN processing imports THEN the system SHALL handle large datasets (>10,000 units) with progress tracking, pause/resume capabilities, and performance optimization
4. WHEN exporting data THEN the system SHALL provide complete condominium structure exports in multiple formats (CSV, JSON, Excel) with customizable field selection
5. WHEN migration occurs THEN the system SHALL maintain data integrity, provide rollback capabilities, and create backup snapshots
6. WHEN bulk importing units THEN the system SHALL validate all constraints, referential integrity, and aliquot consistency before transaction commit
7. WHEN import operations fail THEN the system SHALL provide detailed failure reports and partial rollback options
8. WHEN export operations are requested THEN the system SHALL apply proper access controls and audit all export activities
9. WHEN large operations are performed THEN the system SHALL implement rate limiting and resource management to prevent system overload

---

### Requirement ID: TS-010 - Performance and Scalability Management

**User Story:**  
As a Platform Operator, I want the Tenancy Service to perform efficiently under load and scale with platform growth, so that tenant operations remain responsive as the platform expands with specific performance targets and caching strategies.

**Acceptance Criteria:**
1. WHEN serving tenant queries THEN the system SHALL achieve P95 response time ≤ 100ms for standard operations with proper database indexing
2. WHEN handling unit validation requests THEN the system SHALL achieve P95 response time ≤ 50ms with Redis caching (TTL 300s) and cache hit ratio ≥ 85%
3. WHEN processing bulk operations THEN the system SHALL support concurrent processing with proper resource management and P95 ≤ 2s per 1000 units
4. WHEN scaling horizontally THEN the system SHALL support read replicas and database sharding by tenant_id with automatic failover
5. WHEN handling concurrent updates THEN the system SHALL implement optimistic locking to prevent data conflicts with retry mechanisms
6. WHEN cache invalidation occurs THEN the system SHALL use distributed cache invalidation patterns with Redis pub/sub for consistency
7. WHEN database queries are executed THEN the system SHALL use composite indexes on (tenant_id, condominium_id), (tenant_id, unit_id), and (tenant_id, kind) for optimal performance
8. WHEN system load increases THEN the system SHALL implement circuit breakers (failure threshold: 5, timeout: 30s) and rate limiting (1000 req/min per tenant)

**Performance Implementation Specifications:**
- **Caching Strategy**: Redis with 300s TTL for unit validation, 600s for tenant configuration, immediate invalidation on updates
- **Database Indexes**: 
  ```sql
  CREATE INDEX CONCURRENTLY idx_units_tenant_condo ON units(tenant_id, condominium_id);
  CREATE INDEX CONCURRENTLY idx_units_validation ON units(tenant_id, id, kind, status);
  CREATE INDEX CONCURRENTLY idx_buildings_tenant ON buildings(tenant_id, condominium_id);
  ```
- **Connection Pooling**: Max 20 connections per service instance, idle timeout 300s
- **Query Optimization**: Use prepared statements, limit result sets to 1000 records, implement cursor-based pagination

---

### Requirement ID: TS-011 - Common Area Revenue Configuration Management

**User Story:**  
As a Property Manager, I want to configure revenue generation from common areas including reservations, penalties, and operational settings, so that I can monetize shared spaces and manage community resources effectively.

**Acceptance Criteria:**
1. WHEN creating common area units THEN the system SHALL require revenue_cfg JSONB field with reservation configuration for units with kind = 'COMMON'
2. WHEN configuring reservations THEN the system SHALL support hour_price, currency (ISO 3-letter code), min_block (minutes), max_advance_days, and cancellation_hours
3. WHEN setting penalties THEN the system SHALL configure no_show fees, late_cancel_pct, overtime_rate multipliers, and damage_deposit amounts
4. WHEN managing exemptions THEN the system SHALL support board_members, emergency_services, community_events flags, and discount_tiers based on usage
5. WHEN defining operational settings THEN the system SHALL configure max_capacity, operating_hours (weekdays/weekends), cleaning_fee, and insurance_required flags
6. WHEN validating revenue_cfg THEN the system SHALL enforce JSON schema validation and business rules via database triggers
7. WHEN revenue_cfg changes THEN the system SHALL emit CommonAreaPricingUpdated events with previous and new configurations
8. WHEN non-COMMON units have revenue_cfg THEN the system SHALL raise validation exceptions and prevent configuration
9. WHEN COMMON units lack reservation configuration THEN the system SHALL require basic reservation settings as mandatory
10. WHEN integrating with reservation-service THEN the system SHALL provide pricing and availability rules for booking validation
11. WHEN integrating with finance-service THEN the system SHALL provide revenue_allocation percentages and tax_config for billing

**Revenue Configuration Schema:**
```json
{
  "reservation": {
    "hour_price": 20,           // Precio por hora en moneda local
    "currency": "PEN",          // Código ISO de moneda (PEN, USD, etc.)
    "min_block": 60,            // Mínimo tiempo de reserva en minutos
    "max_advance_days": 30,     // Máximo días de anticipación
    "cancellation_hours": 24    // Horas mínimas para cancelación sin penalidad
  },
  "penalties": {
    "no_show": 15,              // Multa por no presentarse (moneda)
    "late_cancel_pct": 50,      // Porcentaje a cobrar por cancelación tardía
    "overtime_rate": 1.5,       // Multiplicador por tiempo excedido
    "damage_deposit": 100       // Depósito por daños (reembolsable)
  },
  "exemptions": {
    "board_members": true,      // Miembros de junta directiva exentos
    "emergency_services": false, // Servicios de emergencia
    "community_events": true,   // Eventos comunitarios
    "discount_tiers": [         // Niveles de descuento
      {"min_uses": 10, "pct_discount": 10},
      {"min_uses": 20, "pct_discount": 15}
    ]
  },
  "operational": {
    "max_capacity": 50,         // Capacidad máxima de personas
    "operating_hours": {        // Horario de operación
      "weekdays": {"start": "08:00", "end": "22:00"},
      "weekends": {"start": "09:00", "end": "23:00"}
    },
    "cleaning_fee": 30,         // Tarifa de limpieza adicional
    "insurance_required": true  // Seguro requerido
  },
  "revenue_allocation": {
    "maintenance_fund": 60,     // 60% a fondo de mantenimiento
    "community_fund": 25,       // 25% a fondo comunitario
    "reserve_fund": 15          // 15% a fondo de reserva
  },
  "tax_config": {
    "iva_rate": 18.0,          // Tasa de IVA/IGV
    "include_tax": true        // Incluir impuesto en precio
  }
}
```

---

### Requirement ID: TS-012 - Integration with Platform Services

**User Story:**  
As a system architect, I want the Tenancy Service to integrate seamlessly with other platform services, so that condominium structure data flows efficiently across the system while maintaining data consistency and proper service boundaries.

**Acceptance Criteria:**
1. WHEN integrating with user-profiles-service THEN the system SHALL provide unit validation APIs for membership assignments with comprehensive unit metadata including revenue_cfg for common areas
2. WHEN integrating with governance-service THEN the system SHALL provide voting rights, governance structure information, and quorum calculations based on unit aliquots
3. WHEN integrating with finance-service THEN the system SHALL provide unit ownership percentages, aliquot distributions, fee calculation data, and revenue_allocation configurations from common areas
4. WHEN integrating with reservation-service THEN the system SHALL provide common area pricing rules, operational constraints, penalty configurations, and exemption policies
5. WHEN integrating with physical-security-service THEN the system SHALL provide unit access permissions, spatial information, building layouts, and capacity constraints
6. WHEN providing integration data THEN the system SHALL ensure real-time consistency, proper event emission, and maintain service boundaries
7. WHEN service dependencies are unavailable THEN the system SHALL implement circuit breakers and graceful degradation with cached configuration data
8. WHEN cross-service data consistency is required THEN the system SHALL use eventual consistency patterns with proper reconciliation
9. WHEN integration contracts change THEN the system SHALL maintain backward compatibility and provide migration paths
10. WHEN common area configurations change THEN the system SHALL emit CommonAreaPricingUpdated events to reservation-service and finance-service

---

## 3. Technical Implementation Specifications

### Performance Monitoring and Metrics
```typescript
interface PerformanceMetrics {
  api_response_times: {
    unit_validation: "P95 ≤ 50ms",
    bulk_operations: "P95 ≤ 2s per 1000 units",
    tenant_queries: "P95 ≤ 100ms"
  },
  scalability_targets: {
    max_tenants: 1000,
    max_units_per_condominium: 10000,
    max_concurrent_imports: 5,
    cache_hit_ratio: "≥ 85%"
  },
  resource_limits: {
    connection_pool_size: 20,
    query_result_limit: 1000,
    bulk_operation_batch_size: 1000
  }
}
```

### Caching Strategy Implementation
```typescript
interface CacheConfiguration {
  redis_config: {
    unit_validation_ttl: 300,      // 5 minutes
    tenant_config_ttl: 600,        // 10 minutes
    building_structure_ttl: 1800,  // 30 minutes
    invalidation_strategy: "immediate_on_update"
  },
  cache_keys: {
    unit_validation: "unit:validation:{tenant_id}:{unit_id}",
    tenant_config: "tenant:config:{tenant_id}",
    building_structure: "building:structure:{tenant_id}:{building_id}"
  }
}
```

### Database Optimization Specifications
```sql
-- Performance-optimized indexes
CREATE INDEX CONCURRENTLY idx_units_tenant_condo_kind 
  ON units(tenant_id, condominium_id, kind) 
  WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY idx_units_validation_lookup 
  ON units(tenant_id, id, kind, status, local_code);

CREATE INDEX CONCURRENTLY idx_buildings_tenant_active 
  ON buildings(tenant_id, condominium_id) 
  WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY idx_condominiums_tenant_status 
  ON condominiums(tenant_id, status, created_at);

-- Partial index for revenue configuration queries
CREATE INDEX CONCURRENTLY idx_units_revenue_config 
  ON units(tenant_id, condominium_id) 
  WHERE kind = 'COMMON' AND revenue_cfg IS NOT NULL;
```

### Circuit Breaker Configuration
```typescript
interface CircuitBreakerConfig {
  failure_threshold: 5,
  recovery_timeout: 30000,      // 30 seconds
  monitoring_period: 10000,     // 10 seconds
  half_open_max_calls: 3,
  services: {
    user_profiles_service: {
      timeout: 5000,
      fallback: "cached_validation_result"
    },
    compliance_service: {
      timeout: 10000,
      fallback: "skip_compliance_check"
    }
  }
}
```

---

## 4. Revenue Configuration Validation and Use Cases

### JSON Schema Validation
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "reservation": {
      "type": "object",
      "required": ["hour_price", "currency"],
      "properties": {
        "hour_price": {"type": "number", "minimum": 0},
        "currency": {"type": "string", "pattern": "^[A-Z]{3}$"},
        "min_block": {"type": "integer", "minimum": 15},
        "max_advance_days": {"type": "integer", "minimum": 1, "maximum": 365},
        "cancellation_hours": {"type": "integer", "minimum": 0}
      }
    },
    "penalties": {
      "type": "object",
      "properties": {
        "no_show": {"type": "number", "minimum": 0},
        "late_cancel_pct": {"type": "number", "minimum": 0, "maximum": 100},
        "overtime_rate": {"type": "number", "minimum": 1.0},
        "damage_deposit": {"type": "number", "minimum": 0}
      }
    },
    "operational": {
      "type": "object",
      "properties": {
        "max_capacity": {"type": "integer", "minimum": 1},
        "cleaning_fee": {"type": "number", "minimum": 0},
        "insurance_required": {"type": "boolean"}
      }
    }
  },
  "required": ["reservation"]
}
```

### Database Validation Triggers
```sql
-- Trigger para validar configuración de revenue_cfg
CREATE OR REPLACE FUNCTION validate_revenue_cfg() RETURNS TRIGGER AS $$
BEGIN
    -- Solo unidades COMMON pueden tener revenue_cfg
    IF NEW.kind != 'COMMON' AND NEW.revenue_cfg != '{}'::jsonb THEN
        RAISE EXCEPTION 'Solo unidades COMMON pueden tener revenue_cfg';
    END IF;
    
    -- Validar que tenga configuración básica si es COMMON
    IF NEW.kind = 'COMMON' AND NOT (NEW.revenue_cfg ? 'reservation') THEN
        RAISE EXCEPTION 'Unidades COMMON deben tener configuración de reservas';
    END IF;
    
    -- Validar formato de moneda
    IF NEW.revenue_cfg->'reservation'->>'currency' !~ '^[A-Z]{3}$' THEN
        RAISE EXCEPTION 'Código de moneda debe ser formato ISO 3 letras';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Common Area Use Cases

**1. Piscina Comunitaria**
```json
{
  "reservation": {
    "hour_price": 50,
    "currency": "PEN",
    "min_block": 120,
    "max_advance_days": 15,
    "cancellation_hours": 24
  },
  "penalties": {
    "no_show": 25,
    "late_cancel_pct": 30,
    "damage_deposit": 200
  },
  "exemptions": {
    "board_members": true,
    "community_events": false
  },
  "operational": {
    "max_capacity": 20,
    "operating_hours": {
      "weekdays": {"start": "06:00", "end": "22:00"},
      "weekends": {"start": "08:00", "end": "23:00"}
    },
    "insurance_required": true
  }
}
```

**2. Sala de Conferencias**
```json
{
  "reservation": {
    "hour_price": 80,
    "currency": "PEN",
    "min_block": 60,
    "cancellation_hours": 48
  },
  "operational": {
    "max_capacity": 30,
    "equipment_fee": 20,
    "cleaning_fee": 40
  },
  "exemptions": {
    "board_members": true,
    "community_events": true
  }
}
```

**3. Estacionamiento Visitantes**
```json
{
  "reservation": {
    "hour_price": 5,
    "currency": "PEN",
    "min_block": 60,
    "max_advance_days": 7
  },
  "penalties": {
    "overtime_rate": 2.0,
    "unauthorized_parking": 100
  },
  "operational": {
    "operating_hours": {
      "weekdays": {"start": "00:00", "end": "23:59"},
      "weekends": {"start": "00:00", "end": "23:59"}
    }
  }
}
```

### Event Schemas for Revenue Configuration
```json
{
  "CommonAreaPricingUpdated": {
    "event_id": "uuid",
    "tenant_id": "uuid",
    "condominium_id": "uuid",
    "unit_id": "uuid",
    "event_type": "CommonAreaPricingUpdated",
    "timestamp": "2024-01-01T10:00:00Z",
    "previous_config": {...},
    "new_config": {...},
    "effective_date": "2024-01-01",
    "changed_by": "user_id"
  }
}
```

---

## 6. Cross-Service Integration Validation

**User Story:**  
As a Platform Architect, I want to validate consistency across services to ensure tenancy data integrity and proper integration.

**Acceptance Criteria:**
1. WHEN validating consistency THEN the system SHALL verify all foreign key relationships use composite keys with tenant_id
2. WHEN reviewing APIs THEN the system SHALL ensure all endpoints enforce tenant isolation and proper error handling
3. WHEN analyzing events THEN the system SHALL confirm all domain events include necessary context for consumer services
4. WHEN validating security THEN the system SHALL verify RLS policies are active on all tables and JWT claims are properly validated
5. WHEN reviewing documentation THEN the system SHALL ensure OpenAPI specs match implementation and include multi-tenant examples
6. WHEN checking integrations THEN the system SHALL validate that dependent services handle unit validation responses correctly

---

## 7. Reporting & Traceability

- **Traceability:**  
  All requirements must be traceable to specific database constraints, API endpoints, and event types. Each data mutation must reference governance event evidence.

- **Reporting:**  
  The system SHALL generate compliance reports showing tax registration status, condominium verification states, and aliquot distribution consistency across all active condominiums.

---

## 8. Approval & Change Control

- **Versioning:**  
  Database schema changes must follow expand/contract migration strategy and maintain backward compatibility for at least one deployment cycle.

- **Approval:**  
  All structural changes to tenants, condominiums, or units must be approved by both product and architecture leads, with evidence recorded in governance events.

---

> _These requirements ensure the Tenancy Service maintains data integrity, regulatory compliance, and proper multi-tenant isolation while serving as the structural foundation for the SmartEdify platform._