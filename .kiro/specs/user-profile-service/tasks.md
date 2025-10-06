# Implementation Plan - User Profile Service

## Overview
This implementation plan converts the User Profile Service design into actionable coding tasks that build incrementally toward a production-ready backend service. Each task focuses on specific functionality with clear integration points and validation criteria, following the canonical data ownership pattern and event-driven architecture.

## Project Structure
The User Profile Service follows the standardized backend service structure defined in [Project Standards](../project-standards.md):

```
user-profile-service/
├── src/
│   ├── controllers/          # HTTP request handlers (ProfileController, MembershipController)
│   ├── services/            # Business logic layer (ProfileService, MembershipService, EventService)
│   ├── repositories/        # Data access layer (ProfileRepository, MembershipRepository)
│   ├── models/              # Domain models and interfaces (UserProfile, Membership, Role)
│   ├── middleware/          # Express middleware (auth, validation, tenant isolation)
│   ├── utils/               # Utility functions (validators, formatters, event builders)
│   ├── config/              # Configuration management
│   ├── types/               # TypeScript type definitions
│   └── index.ts             # Application entry point
├── tests/
│   ├── unit/                # Unit tests (≥80% coverage)
│   ├── integration/         # Integration tests (API endpoints)
│   └── e2e/                 # End-to-end tests (profile workflows)
├── migrations/              # Database migrations
├── config/
│   ├── development.json     # Development configuration
│   ├── staging.json         # Staging configuration
│   └── production.json      # Production configuration
└── package.json             # Dependencies and scripts
```

## Implementation Standards
All tasks must follow the established [Project Standards](../project-standards.md) including:
- **Canonical Data Ownership**: Single source of truth for all profile data
- **Event-Driven Architecture**: Kafka integration for cross-service communication
- **Tenant Isolation**: Row-level security and proper tenant scoping
- **Performance**: Sub-200ms response times with intelligent caching

---

## Core Infrastructure and Service Foundation

- [ ] 1. Set up Node.js project structure following project standards
- [ ] 1.1 Create standardized project structure and configuration
  - Create Node.js 18+ project with standardized directory structure (src/controllers, src/services, src/repositories, src/models, src/middleware, src/utils, src/config, src/types)
  - Configure TypeScript with strict mode, ESLint, and Prettier following project standards
  - Set up development environment with Docker Compose, hot reload, and structured logging
  - Implement configuration management with environment-specific configs (development.json, staging.json, production.json)
  - _Requirements: UP-001, UP-009, Project Standards_
  
- [ ] 1.2 Implement Express server following middleware standards
  - Create Express server with standardized middleware pipeline (CORS, helmet, compression, rate limiting)
  - Implement structured logging with LogEntry interface (timestamp, level, service, traceId, correlationId, userId, tenantId)
  - Add standardized health check endpoints (/health, /ready, /metrics) with dependency status
  - Set up graceful shutdown with connection draining and proper cleanup procedures
  - _Requirements: UP-001, UP-009, Project Standards_
  
- [ ] 1.3 Configure database and event streaming following connection standards
  - Set up PostgreSQL with standardized connection pooling (min: 5, max: 20) and query optimization
  - Configure Kafka client for event streaming with proper topic naming and serialization
  - Implement database migrations in migrations/ directory with backward compatibility
  - Add connection health monitoring with automatic reconnection and circuit breaker patterns
  - _Requirements: UP-001, UP-009, Project Standards_

- [ ]* 1.4 Setup testing infrastructure following testing standards
  - Configure Jest with standardized test structure (tests/unit/, tests/integration/, tests/e2e/)
  - Set up test database and Kafka with .env.test configuration and proper cleanup
  - Write foundation tests following naming conventions (describe/it patterns)
  - Configure coverage reporting with ≥80% requirement and quality gates
  - _Requirements: Testing Strategy, Project Standards_

- [ ] 2. Implement core profile management with canonical data ownership
  - [ ] 2.1 Create UserProfile entity and repository with TypeORM
    - Implement UserProfile entity with tenant isolation and RLS
    - Add ProfileContactMethod entity for normalized contact information
    - Create profile repository with PostgreSQL integration and proper indexing
    - Set up database migrations for profile-related tables
    - _Requirements: UP-001, UP-006_

  - [ ] 2.2 Create profile service and controller with REST API
    - Implement ProfileService with CRUD operations following canonical source pattern
    - Create ProfileController with proper DTO validation and error handling
    - Add input validation for email (RFC5322), phone (E.164), and names
    - Implement rate limiting (100 requests/minute per tenant)
    - _Requirements: UP-001, UP-006_

  - [ ] 2.3 Implement profile registration flow as canonical entry point
    - Create profile registration endpoint that initiates user creation
    - Add compliance validation integration with compliance-service
    - Implement ProfileCreated event emission to Kafka for identity-service
    - Add correlation ID tracking for cross-service operations
    - _Requirements: UP-001, UP-009_

  - [ ]* 2.4 Write unit tests for profile management
    - Test profile CRUD operations with tenant isolation
    - Test contact method normalization and validation
    - Test event emission and correlation ID tracking
    - _Requirements: UP-001, UP-006_

- [ ] 3. Implement condominium membership management
  - [ ] 3.1 Create CondominiumMembership entity with relationship validation
    - Implement membership entity with relationship types and tenant validation
    - Add responsible profile validation for CONVIVIENTE/ARRENDATARIO types
    - Create membership repository with unit validation via tenancy-service
    - Set up automatic status calculation based on membership periods
    - _Requirements: UP-002_

  - [ ] 3.2 Create membership service and controller
    - Implement MembershipService with membership lifecycle management
    - Create MembershipController with proper relationship validation
    - Add integration with tenancy-service for unit validation
    - Implement membership conflict detection for overlapping periods
    - _Requirements: UP-002_

  - [ ] 3.3 Add membership history and audit tracking
    - Create membership history entity for change tracking
    - Implement immutable audit snapshots with hash chaining
    - Add membership change event emission for dependent services
    - Create membership status transition validation
    - _Requirements: UP-002, UP-009_

  - [ ]* 3.4 Write unit tests for membership management
    - Test relationship type validation and responsible profile logic
    - Test unit validation integration with tenancy-service
    - Test membership conflict detection and period validation
    - _Requirements: UP-002_

- [ ] 4. Implement role-based access control (RBAC) system
  - [ ] 4.1 Create RoleAssignment entity with hierarchical roles
    - Implement role assignment entity with grant/revocation tracking
    - Add support for country-specific role templates
    - Create role repository with condominium-scoped role management
    - Set up JSONB permissions storage with structured format
    - _Requirements: UP-003_

  - [ ] 4.2 Create role service and controller
    - Implement RoleService with role assignment and permission management
    - Create RoleController with proper role validation and scoping
    - Add custom role creation per condominium
    - Implement RoleChanged event emission for identity-service token refresh
    - _Requirements: UP-003_

  - [ ] 4.3 Implement permission evaluation engine with PDP integration
    - Create PermissionService with Policy Decision Point (PDP) integration
    - Add permission caching with Redis and proper invalidation
    - Implement fail-closed behavior when PDP unavailable
    - Add permission evaluation with P95 latency ≤ 150ms target
    - _Requirements: UP-005_

  - [ ]* 4.4 Write unit tests for RBAC system
    - Test role assignment validation and permission evaluation
    - Test PDP integration and caching mechanisms
    - Test fail-closed behavior and circuit breaker patterns
    - _Requirements: UP-003, UP-005_

- [ ] 5. Implement entitlements and policy management
  - [ ] 5.1 Create Entitlement entity with service-specific entitlements
    - Implement entitlement entity with service_code and entitlement_key
    - Add grant/revocation timestamp tracking for audit purposes
    - Create entitlement repository with tenant and condominium boundaries
    - Set up entitlement validation and active entitlement queries
    - _Requirements: UP-004_

  - [ ] 5.2 Create policy bindings management
    - Implement PolicyBinding entity with policy version tracking
    - Add policy binding service with conflict resolution rules
    - Create policy evaluation integration with permission decisions
    - Implement policy hierarchy and scope management
    - _Requirements: UP-011_

  - [ ] 5.3 Add entitlement service and controller
    - Implement EntitlementService with entitlement lifecycle management
    - Create EntitlementController with proper validation and scoping
    - Add bulk entitlement operations with proper limits
    - Implement entitlement change event emission
    - _Requirements: UP-004, UP-011_

  - [ ]* 5.4 Write unit tests for entitlements and policies
    - Test entitlement grant/revocation logic and validation
    - Test policy binding evaluation and conflict resolution
    - Test bulk operations and rate limiting
    - _Requirements: UP-004, UP-011_

- [ ] 6. Implement data export and bulk operations
  - [ ] 6.1 Create export service with multiple format support
    - Implement ExportService with CSV and JSON format support
    - Add configurable field selection and PII redaction
    - Create export job tracking with asynchronous processing
    - Set up rate limiting (≤10 exports per minute) and job limits
    - _Requirements: UP-008_

  - [ ] 6.2 Create bulk operations service
    - Implement BulkOperationService with 10,000 row limits
    - Add bulk validation with detailed error reporting
    - Create job status tracking and rollback mechanisms
    - Implement 5 concurrent jobs per tenant limit
    - _Requirements: UP-007_

  - [ ] 6.3 Add export and bulk operation controllers
    - Create ExportController with job management endpoints
    - Create BulkController with validation and status tracking
    - Add proper error handling and job completion notifications
    - Implement audit event generation for all operations
    - _Requirements: UP-007, UP-008_

  - [ ]* 6.4 Write unit tests for export and bulk operations
    - Test export format generation and PII redaction
    - Test bulk operation validation and error handling
    - Test rate limiting and concurrent job management
    - _Requirements: UP-007, UP-008_

- [ ] 7. Implement DSAR compliance and cross-service orchestration
  - [ ] 7.1 Create DSAR orchestration service
    - Implement DSARService as proxy between identity-service and compliance-service
    - Add data export compilation with comprehensive profile data
    - Create cross-service deletion coordination with crypto-erase
    - Set up job tracking and completion verification
    - _Requirements: UP-010_

  - [ ] 7.2 Add DSAR controller with proper authentication
    - Create DSARController with AAL2 authentication requirement
    - Add DSAR job status tracking and completion endpoints
    - Implement idempotent operations for already processed requests
    - Create audit trail generation for all DSAR operations
    - _Requirements: UP-010_

  - [ ] 7.3 Implement data deletion orchestration
    - Create deletion workflow with referential integrity preservation
    - Add crypto-erase implementation for sensitive data
    - Implement cross-service event coordination via Kafka
    - Create immutable deletion records for compliance audit
    - _Requirements: UP-010_

  - [ ]* 7.4 Write integration tests for DSAR workflows
    - Test complete data export workflow with cross-service coordination
    - Test data deletion orchestration and crypto-erase
    - Test audit trail generation and compliance reporting
    - _Requirements: UP-010_

- [ ] 8. Implement cross-service consistency and health monitoring
  - [ ] 8.1 Create consistency monitoring service
    - Implement CrossServiceConsistencyService with 5-minute checks
    - Add inconsistency detection between UPS and dependent services
    - Create reconciliation logic with UPS as canonical source
    - Set up consistency metrics and alerting
    - _Requirements: Cross-Service Integration Validation_

  - [ ] 8.2 Add comprehensive health checks
    - Create HealthController with deep dependency checks
    - Add circuit breakers for tenancy-service and compliance-service
    - Implement fallback mechanisms for service unavailability
    - Create health metrics for all service dependencies
    - _Requirements: Cross-Service Integration Validation_

  - [ ] 8.3 Implement event schema validation and registry
    - Create event schema registry with versioned schemas
    - Add Kafka event validation for ProfileCreated, ProfileUpdated, etc.
    - Implement event producer/consumer tracking
    - Set up event processing metrics and monitoring
    - _Requirements: UP-009_

  - [ ]* 8.4 Write integration tests for consistency and health
    - Test cross-service consistency detection and reconciliation
    - Test circuit breaker behavior and fallback mechanisms
    - Test event schema validation and processing
    - _Requirements: Cross-Service Integration Validation_

- [ ] 9. Implement security, encryption, and compliance features
  - [ ] 9.1 Add data encryption with KMS integration
    - Implement EncryptedField with AES-256-GCM encryption
    - Add AWS KMS integration with tenant-specific keys
    - Create automatic key rotation (90-day cycle) with re-encryption
    - Set up IAM roles with least-privilege access control
    - _Requirements: UP-001, UP-010_

  - [ ] 9.2 Implement Row-Level Security (RLS) and tenant isolation
    - Set up PostgreSQL RLS policies for all tables
    - Add tenant_id enforcement in all database operations
    - Create tenant isolation validation in all services
    - Implement cross-tenant access prevention
    - _Requirements: UP-001, UP-009_

  - [ ] 9.3 Add compliance metadata and audit trails
    - Implement ComplianceMetadata tracking per data field
    - Create immutable audit snapshots with blockchain-style hashing
    - Add legal basis tracking and consent management
    - Set up automatic data retention and deletion policies
    - _Requirements: UP-001, UP-009, UP-010_

  - [ ]* 9.4 Write security and compliance tests
    - Test encryption/decryption with KMS key rotation
    - Test RLS enforcement and tenant isolation
    - Test audit trail integrity and hash chaining
    - _Requirements: UP-001, UP-009, UP-010_

- [ ] 10. Set up monitoring, logging, and deployment
  - [ ] 10.1 Implement comprehensive audit logging
    - Add structured logging for all profile operations with correlation IDs
    - Create security event logging with OpenTelemetry integration
    - Implement compliance metrics tracking (DSAR response times, consent rates)
    - Set up audit trail completeness monitoring
    - _Requirements: All requirements for audit trail_

  - [ ] 10.2 Add health checks and metrics
    - Create health check endpoints with dependency validation
    - Add Prometheus metrics for profiles, memberships, roles, and permissions
    - Implement performance monitoring (P95 latency targets)
    - Create compliance and consistency health metrics
    - _Requirements: Performance and monitoring_

  - [ ] 10.3 Configure PostgreSQL, Redis, and Kafka integration
    - Set up PostgreSQL with RLS, tenant partitioning, and proper indexing
    - Configure Redis for permission caching and session data
    - Add Kafka integration for event streaming with schema validation
    - Set up connection pooling and error handling
    - _Requirements: All data storage and messaging requirements_

  - [ ] 10.4 Update Docker configuration and deployment scripts
    - Update existing Dockerfile with security best practices
    - Ensure docker-compose integration with platform services
    - Add environment variable validation and KMS integration
    - Configure service discovery and health check endpoints
    - _Requirements: Deployment requirements_

  - [ ]* 10.5 Write end-to-end integration tests
    - Test complete user registration and profile management flows
    - Test cross-service event processing and consistency
    - Test DSAR workflows and compliance requirements
    - Test performance requirements and rate limiting
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
    - Include architecture decisions, data ownership patterns, and security model
    - Document event schemas, API contracts, and integration patterns
    - Add compliance framework and audit trail specifications
    - _Requirements: Technical specification policy_
  
  - [ ] 11.3 Create atomic task breakdown for future phases
    - Derive user stories and issues from current implementation
    - Reference specific requirements and acceptance criteria
    - Prepare for production deployment and monitoring setup
    - Create migration plan from identity-service to UPS as canonical source
    - _Requirements: Task atomization policy_
  
  - [ ] 11.4 Prepare documentation PR for architecture review
    - Create PR with all documentation updates
    - Include README, OpenAPI, CHANGELOG, and technical specs
    - Request review from architecture guardian and data protection officer
    - Ensure compliance with SmartEdify documentation policies
    - _Requirements: PR documentation policy_
## Sta
ndards Compliance Checklist

### Project Structure ✅
- [x] Standardized directory structure (src/controllers, src/services, src/repositories, etc.)
- [x] Proper separation of concerns (controllers, services, repositories, models)
- [x] Configuration management with environment-specific files
- [x] Testing structure with unit, integration, and E2E tests

### Naming Conventions ✅
- [x] camelCase for TypeScript files (profileService.ts, membershipController.ts)
- [x] PascalCase for classes and interfaces (ProfileService, UserProfile, MembershipRepository)
- [x] kebab-case for directories (user-profile, membership-management)
- [x] SCREAMING_SNAKE_CASE for constants and environment variables

### Error Handling ✅
- [x] Standardized error types (validation, authentication, authorization, not_found, conflict)
- [x] Consistent HTTP status code mapping (400, 401, 403, 404, 409, 429, 500)
- [x] Structured error responses with traceId and correlation context
- [x] Error classification and recovery strategies

### Security Standards ✅
- [x] Tenant isolation with Row-Level Security (RLS)
- [x] Input validation and sanitization for all profile data
- [x] Audit logging for all profile modifications
- [x] Event-driven architecture with secure Kafka integration

### Performance Standards ✅
- [x] Response time targets (≤200ms for simple queries, ≤500ms for complex operations)
- [x] Database optimization with proper indexing and connection pooling
- [x] Caching strategy for frequently accessed profile data
- [x] Performance monitoring and alerting

### Event-Driven Architecture ✅
- [x] Kafka integration for cross-service communication
- [x] Event sourcing for profile lifecycle events
- [x] Correlation ID tracking for distributed operations
- [x] Event schema validation and versioning

### Testing Standards ✅
- [x] Unit tests with ≥80% coverage requirement
- [x] Integration tests for all API endpoints
- [x] E2E tests for critical profile workflows
- [x] Standardized test naming and organization

### Deployment Standards ✅
- [x] Multi-stage Dockerfile with security hardening
- [x] Docker Compose for local development
- [x] Environment-specific configuration management
- [x] CI/CD pipeline integration ready