# Implementation Plan - Tenancy Service

## Overview
This implementation plan converts the Tenancy Service design into actionable coding tasks that build incrementally toward a production-ready backend service. Each task focuses on specific functionality with clear integration points and validation criteria, emphasizing multi-tenant architecture, data validation, and canonical tenant management.

## Project Structure
The Tenancy Service follows the standardized backend service structure defined in [Project Standards](../project-standards.md):

```
tenancy-service/
├── src/
│   ├── controllers/          # HTTP request handlers (TenantController, CondominiumController)
│   ├── services/            # Business logic layer (TenantService, ValidationService, EventService)
│   ├── repositories/        # Data access layer (TenantRepository, CondominiumRepository)
│   ├── models/              # Domain models and interfaces (Tenant, Condominium, Building, Unit)
│   ├── middleware/          # Express middleware (auth, validation, tenant isolation)
│   ├── utils/               # Utility functions (validators, aliquot calculators)
│   ├── config/              # Configuration management
│   ├── types/               # TypeScript type definitions
│   └── index.ts             # Application entry point
├── tests/
│   ├── unit/                # Unit tests (≥80% coverage)
│   ├── integration/         # Integration tests (API endpoints)
│   └── e2e/                 # End-to-end tests (tenant workflows)
├── migrations/              # Database migrations with RLS policies
├── config/
│   ├── development.json     # Development configuration
│   ├── staging.json         # Staging configuration
│   └── production.json      # Production configuration
└── package.json             # Dependencies and scripts
```

## Implementation Standards
All tasks must follow the established [Project Standards](../project-standards.md) including:
- **Multi-Tenant Architecture**: Row-level security and complete tenant isolation
- **Data Validation**: Aliquot validation, composite foreign keys, business rule enforcement
- **Canonical Source**: Single source of truth for tenant and condominium structures
- **Performance**: Sub-200ms response times with optimized database queries

---

## Core Infrastructure and Service Foundation

- [ ] 1. Set up Node.js project structure following project standards
- [ ] 1.1 Create standardized project structure and configuration
  - Create Node.js 18+ project with standardized directory structure (src/controllers, src/services, src/repositories, src/models, src/middleware, src/utils, src/config, src/types)
  - Configure TypeScript with strict mode, ESLint, and Prettier following project standards
  - Set up development environment with Docker Compose, hot reload, and structured logging
  - Implement configuration management with environment-specific configs (development.json, staging.json, production.json)
  - _Requirements: TS-001, TS-005, TS-008, Project Standards_
  
- [ ] 1.2 Implement Express server following middleware standards
  - Create Express server with standardized middleware pipeline (CORS, helmet, compression, rate limiting)
  - Implement structured logging with LogEntry interface (timestamp, level, service, traceId, correlationId, userId, tenantId)
  - Add standardized health check endpoints (/health, /ready, /metrics) with dependency status
  - Set up graceful shutdown with connection draining and proper cleanup procedures
  - _Requirements: TS-001, TS-005, Project Standards_
  
- [ ] 1.3 Configure database with RLS following connection standards
  - Set up PostgreSQL with standardized connection pooling (min: 5, max: 20) and query optimization
  - Configure Row-Level Security (RLS) policies for complete tenant isolation
  - Implement database migrations in migrations/ directory with backward compatibility
  - Add connection health monitoring with automatic reconnection and circuit breaker patterns
  - _Requirements: TS-001, TS-005, TS-010, Project Standards_

- [ ]* 1.4 Setup testing infrastructure following testing standards
  - Configure Jest with standardized test structure (tests/unit/, tests/integration/, tests/e2e/)
  - Set up test database with .env.test configuration and proper cleanup
  - Write foundation tests following naming conventions (describe/it patterns)
  - Configure coverage reporting with ≥80% requirement and quality gates
  - _Requirements: Testing Strategy, Project Standards_

- [ ] 2. Implement database schema with RLS and composite foreign keys
  - [ ] 2.1 Create database schema with multi-tenant isolation
    - Create all tables (tenants, condominiums, buildings, units, contact_assignments, event_outbox)
    - Implement composite foreign key constraints with tenant_id validation
    - Set up Row-Level Security (RLS) policies for complete tenant isolation
    - Create performance-optimized indexes including composite indexes
    - _Requirements: TS-005, TS-010_

  - [ ] 2.2 Implement aliquot validation triggers and constraints
    - Create aliquot sum validation trigger for condominium-level validation
    - Add individual unit aliquot constraints (≤ 0.5)
    - Implement revenue_cfg validation trigger for COMMON units only
    - Set up automatic aliquot recalculation on unit changes
    - _Requirements: TS-003, TS-011_

  - [ ] 2.3 Set up database migrations and seed data
    - Create TypeORM migrations for all schema changes
    - Add seed data for development and testing environments
    - Implement migration rollback strategies
    - Set up database connection pooling and health checks
    - _Requirements: TS-005, TS-010_

  - [ ]* 2.4 Write unit tests for database constraints and triggers
    - Test RLS policy enforcement and tenant isolation
    - Test composite foreign key validation
    - Test aliquot validation triggers and constraints
    - _Requirements: TS-005, TS-003_

- [ ] 3. Implement tenant management with compliance validation
  - [ ] 3.1 Create Tenant entity and repository with RLS
    - Implement Tenant entity with tenant type validation (ADMINISTRADORA/JUNTA)
    - Add tenant repository with RLS enforcement and composite key support
    - Create legal name uniqueness validation per country
    - Set up tenant status management with cascade operations
    - _Requirements: TS-001_

  - [ ] 3.2 Create tenant service and controller
    - Implement TenantService with CRUD operations and compliance validation
    - Create TenantController with proper DTO validation and error handling
    - Add tax registration validation with country-specific rules
    - Implement tenant status change with event emission
    - _Requirements: TS-001, TS-007_

  - [ ] 3.3 Add compliance and tax validation integration
    - Create compliance validation service with external API integration
    - Implement tax ID validation with country-specific rules
    - Add evidence tracking for governance events
    - Set up compliance alert emission to compliance-service
    - _Requirements: TS-007_

  - [ ]* 3.4 Write unit tests for tenant management
    - Test tenant creation and validation logic
    - Test compliance validation and tax ID verification
    - Test tenant status cascade operations
    - _Requirements: TS-001, TS-007_

- [ ] 4. Implement condominium and building management
  - [ ] 4.1 Create Condominium entity with financial configuration
    - Implement Condominium entity with unique name constraint within tenant
    - Add financial configuration with country-specific compliance validation
    - Create registration number validation against government rules
    - Set up notification settings with consent verification
    - _Requirements: TS-002_

  - [ ] 4.2 Create Building entity with spatial relationships
    - Implement Building entity with unique naming within condominium-tenant scope
    - Add floor plan and layout data management
    - Create spatial relationship tracking
    - Set up building capacity and structural validation
    - _Requirements: TS-003_

  - [ ] 4.3 Create condominium and building services
    - Implement CondominiumService with compliance rule validation
    - Create BuildingService with layout management
    - Add contact assignment validation with governance evidence
    - Implement structure change event emission
    - _Requirements: TS-002, TS-003_

  - [ ]* 4.4 Write unit tests for condominium and building management
    - Test condominium creation and compliance validation
    - Test building structure management and spatial relationships
    - Test contact assignment and governance validation
    - _Requirements: TS-002, TS-003_

- [ ] 5. Implement unit management with aliquot distribution and revenue configuration
  - [ ] 5.1 Create Unit entity with comprehensive validation
    - Implement Unit entity with kind classification and aliquot precision (7,4)
    - Add revenue_cfg JSONB field with JSON schema validation for COMMON units
    - Create local_code uniqueness validation within building
    - Set up unit status management and validation rules
    - _Requirements: TS-003, TS-011_

  - [ ] 5.2 Implement revenue configuration management for COMMON units
    - Create RevenueConfigService with comprehensive validation
    - Add reservation, penalties, exemptions, and operational configuration
    - Implement JSON schema validation and business rule enforcement
    - Set up revenue configuration change event emission
    - _Requirements: TS-011_

  - [ ] 5.3 Create unit service with aliquot management
    - Implement UnitService with aliquot distribution validation
    - Add real-time aliquot sum validation per condominium
    - Create unit hierarchy management with dependency validation
    - Implement unit deletion prevention with active membership checks
    - _Requirements: TS-003, TS-011_

  - [ ]* 5.4 Write unit tests for unit and revenue management
    - Test unit creation and aliquot validation
    - Test revenue configuration validation for COMMON units
    - Test aliquot sum constraints and recalculation
    - _Requirements: TS-003, TS-011_

- [ ] 6. Implement high-performance unit validation service
  - [ ] 6.1 Create validation service with Redis caching
    - Implement ValidationService with purpose-specific validation (MEMBERSHIP, RESERVATION, FINANCIAL)
    - Add Redis caching with 300s TTL and intelligent invalidation
    - Create compatibility scoring and recommendation engine
    - Set up validation response with comprehensive unit metadata
    - _Requirements: TS-008, TS-010_

  - [ ] 6.2 Create validation controller with performance optimization
    - Implement ValidationController with P95 ≤ 50ms response time target
    - Add batch validation support for up to 1,000 units per request
    - Create cache management endpoints for invalidation and health checks
    - Implement graceful degradation with cached fallback responses
    - _Requirements: TS-008, TS-010_

  - [ ] 6.3 Add validation caching strategy and invalidation
    - Create CacheService with distributed cache invalidation via Redis pub/sub
    - Implement cache key patterns for unit validation, tenant config, and building structure
    - Add cache hit ratio monitoring (target ≥ 85%)
    - Set up automatic cache invalidation on unit changes
    - _Requirements: TS-010_

  - [ ]* 6.4 Write performance tests for validation service
    - Test validation API response times and cache performance
    - Test batch validation processing and error handling
    - Test cache invalidation and consistency
    - _Requirements: TS-008, TS-010_

- [ ] 7. Implement bulk import/export with comprehensive validation
  - [ ] 7.1 Create bulk import service with validation engine
    - Implement BulkImportService with comprehensive validation logic
    - Add local_code uniqueness validation within building scope
    - Create aliquot sum validation per condominium (≤ 1.0001)
    - Set up revenue_cfg validation for COMMON units
    - _Requirements: TS-009_

  - [ ] 7.2 Add import job management with progress tracking
    - Create ImportJobService with asynchronous processing
    - Add progress tracking with pause/resume capabilities
    - Implement validation reports with line-specific error details
    - Set up rollback mechanisms and backup snapshots
    - _Requirements: TS-009_

  - [ ] 7.3 Create export service with multiple formats
    - Implement ExportService with CSV, JSON, and Excel support
    - Add configurable field selection and data filtering
    - Create export job tracking with download capabilities
    - Set up audit trail for all import/export operations
    - _Requirements: TS-009_

  - [ ]* 7.4 Write integration tests for bulk operations
    - Test complete import workflow with validation and rollback
    - Test export generation with multiple formats
    - Test large dataset handling (>10,000 units)
    - _Requirements: TS-009_

- [ ] 8. Implement event-driven architecture with transactional outbox
  - [ ] 8.1 Create event outbox table and processor
    - Implement EventOutbox entity with retry logic and status tracking
    - Create OutboxProcessor with background polling every 5 seconds
    - Add exponential backoff retry mechanism (initial: 1s, max: 300s)
    - Set up dead letter queue for failed events after max retries
    - _Requirements: TS-006_

  - [ ] 8.2 Implement event emission service
    - Create EventEmissionService with transactional outbox pattern
    - Add event schema validation and versioning support
    - Implement batch processing (100 events per batch) for optimization
    - Set up event correlation and ordering guarantees
    - _Requirements: TS-006_

  - [ ] 8.3 Add event publishing to Kafka
    - Create KafkaPublisher with reliable message delivery
    - Add event schema registry integration
    - Implement monitoring for processing latency and retry rates
    - Set up alerts for dead letter queue size and processing failures
    - _Requirements: TS-006_

  - [ ]* 8.4 Write integration tests for event processing
    - Test transactional outbox pattern and event delivery
    - Test retry mechanisms and dead letter queue handling
    - Test event ordering and idempotency
    - _Requirements: TS-006_

- [ ] 9. Implement security and tenant isolation
  - [ ] 9.1 Create tenant context middleware
    - Implement TenantContextMiddleware with JWT validation
    - Add automatic tenant context setting for database sessions
    - Create cross-tenant access validation and prevention
    - Set up security event logging for audit purposes
    - _Requirements: TS-005_

  - [ ] 9.2 Add database service with RLS context management
    - Create DatabaseService with session-level tenant context
    - Implement executeWithTenantContext for automatic context management
    - Add tenant access validation against JWT claims
    - Set up automatic context cleanup after operations
    - _Requirements: TS-005_

  - [ ] 9.3 Implement circuit breakers and rate limiting
    - Add circuit breakers for external service dependencies (failure threshold: 5, timeout: 30s)
    - Implement rate limiting (1000 req/min per tenant) with tenant-specific quotas
    - Create graceful degradation patterns for service unavailability
    - Set up monitoring and alerting for circuit breaker states
    - _Requirements: TS-010, TS-012_

  - [ ]* 9.4 Write security tests for tenant isolation
    - Test RLS policy enforcement and cross-tenant access prevention
    - Test JWT validation and tenant context management
    - Test circuit breaker behavior and rate limiting
    - _Requirements: TS-005, TS-010_

- [ ] 10. Set up monitoring, logging, and performance optimization
  - [ ] 10.1 Implement comprehensive audit logging
    - Add structured logging for all tenant operations with correlation IDs
    - Create security event logging with OpenTelemetry integration
    - Implement performance metrics tracking (response times, cache hit ratios)
    - Set up business metrics (tenant onboarding, validation success rates)
    - _Requirements: All requirements for audit trail_

  - [ ] 10.2 Add health checks and metrics
    - Create health check endpoints with dependency validation
    - Add Prometheus metrics for tenants, units, validation, and performance
    - Implement cache health monitoring and invalidation metrics
    - Create operational metrics for event processing and bulk operations
    - _Requirements: Performance and monitoring_

  - [ ] 10.3 Configure PostgreSQL, Redis, and Kafka integration
    - Set up PostgreSQL with RLS, composite indexes, and connection pooling
    - Configure Redis cluster for caching with distributed invalidation
    - Add Kafka integration with transactional outbox and schema registry
    - Set up connection health monitoring and automatic failover
    - _Requirements: All data storage and messaging requirements_

  - [ ] 10.4 Update Docker configuration and deployment scripts
    - Update existing Dockerfile with security best practices
    - Ensure docker-compose integration with platform services
    - Add environment variable validation and database migration scripts
    - Configure service discovery and load balancing
    - _Requirements: Deployment requirements_

  - [ ]* 10.5 Write end-to-end integration tests
    - Test complete tenant onboarding and condominium setup flows
    - Test cross-service unit validation and event processing
    - Test bulk import/export workflows with performance validation
    - Test multi-tenant isolation and security enforcement
    - _Requirements: All requirements validation_

- [ ] 11. Final documentation and compliance updates
  - [ ] 11.1 Create CHANGELOG.md with version history
    - Document all implemented features and API changes
    - Include breaking changes and migration notes
    - Add security improvements and compliance updates
    - Document event schemas and cross-service integration patterns
    - _Requirements: Documentation policy compliance_
  
  - [ ] 11.2 Update technical specification document
    - Create comprehensive technical specification in /docs/specs/
    - Include architecture decisions, RLS implementation, and security model
    - Document event schemas, API contracts, and validation patterns
    - Add performance benchmarks and scalability considerations
    - _Requirements: Technical specification policy_
  
  - [ ] 11.3 Create atomic task breakdown for future phases
    - Derive user stories and issues from current implementation
    - Reference specific requirements and acceptance criteria
    - Prepare for production deployment and monitoring setup
    - Create operational runbooks and troubleshooting guides
    - _Requirements: Task atomization policy_
  
  - [ ] 11.4 Prepare documentation PR for architecture review
    - Create PR with all documentation updates
    - Include README, OpenAPI, CHANGELOG, and technical specs
    - Request review from architecture guardian and security architect
    - Ensure compliance with SmartEdify documentation policies
    - _Requirements: PR documentation policy_##
 Standards Compliance Checklist

### Project Structure ✅
- [x] Standardized directory structure (src/controllers, src/services, src/repositories, etc.)
- [x] Proper separation of concerns (controllers, services, repositories, models)
- [x] Configuration management with environment-specific files
- [x] Testing structure with unit, integration, and E2E tests

### Naming Conventions ✅
- [x] camelCase for TypeScript files (tenantService.ts, condominiumController.ts)
- [x] PascalCase for classes and interfaces (TenantService, Condominium, ValidationService)
- [x] kebab-case for directories (tenant-management, validation-service)
- [x] SCREAMING_SNAKE_CASE for constants and environment variables

### Error Handling ✅
- [x] Standardized error types (validation, authentication, authorization, not_found, conflict)
- [x] Consistent HTTP status code mapping (400, 401, 403, 404, 409, 429, 500)
- [x] Structured error responses with traceId and tenant context
- [x] Error classification and recovery strategies

### Security Standards ✅
- [x] Row-Level Security (RLS) for complete tenant isolation
- [x] Composite foreign key constraints with tenant_id validation
- [x] Input validation and sanitization for all tenant data
- [x] Audit logging for all tenant and condominium modifications

### Performance Standards ✅
- [x] Response time targets (≤200ms for simple queries, ≤500ms for complex operations)
- [x] Database optimization with composite indexes and query optimization
- [x] Connection pooling with proper resource management
- [x] Performance monitoring and alerting

### Multi-Tenant Architecture ✅
- [x] Complete tenant isolation with RLS policies
- [x] Tenant-scoped data access patterns
- [x] Composite foreign key validation
- [x] Tenant context propagation

### Data Validation ✅
- [x] Aliquot validation triggers and constraints
- [x] Business rule enforcement (≤0.5 individual aliquot, sum = 1.0)
- [x] Revenue configuration validation for COMMON units
- [x] Automatic recalculation on unit changes

### Testing Standards ✅
- [x] Unit tests with ≥80% coverage requirement
- [x] Integration tests for all API endpoints
- [x] E2E tests for critical tenant workflows
- [x] Database constraint and trigger testing

### Deployment Standards ✅
- [x] Multi-stage Dockerfile with security hardening
- [x] Docker Compose for local development
- [x] Environment-specific configuration management
- [x] CI/CD pipeline integration ready