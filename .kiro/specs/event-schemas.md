# 📡 Event Schemas and Kafka Integration

## Overview
This document defines the complete event schemas for inter-service communication in the SmartEdify platform. All events follow a consistent structure and are published to Kafka topics with proper serialization and versioning.

---

## Event Structure Standards

### Base Event Interface
```typescript
interface BaseEvent {
  eventId: string;           // UUID v4
  eventType: string;         // Event type identifier
  eventVersion: string;      // Schema version (semver)
  timestamp: Date;           // ISO 8601 timestamp
  correlationId: string;     // Request correlation ID
  tenantId: string;          // Tenant context
  source: {
    service: string;         // Source service name
    version: string;         // Service version
  };
  metadata?: Record<string, any>; // Additional context
}
```

### Event Envelope
```typescript
interface EventEnvelope<T> extends BaseEvent {
  data: T;                   // Event payload
  previousVersion?: string;  // For updates/deletes
}
```

---

## Identity Service Events

### User Authentication Events
```typescript
interface UserAuthenticatedEvent extends BaseEvent {
  eventType: 'UserAuthenticated';
  data: {
    userId: string;
    email: string;
    tenantId: string;
    authMethod: 'password' | 'webauthn' | 'totp' | 'sms_otp' | 'email_otp';
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    mfaUsed: boolean;
    riskScore?: number;
  };
}

interface UserAuthenticationFailedEvent extends BaseEvent {
  eventType: 'UserAuthenticationFailed';
  data: {
    email: string;
    tenantId: string;
    failureReason: 'invalid_credentials' | 'account_locked' | 'mfa_required' | 'tenant_suspended';
    attemptCount: number;
    ipAddress: string;
    userAgent: string;
  };
}

interface UserLoggedOutEvent extends BaseEvent {
  eventType: 'UserLoggedOut';
  data: {
    userId: string;
    sessionId: string;
    tenantId: string;
    logoutType: 'user_initiated' | 'session_timeout' | 'admin_forced' | 'security_logout';
  };
}
```

### Token Management Events
```typescript
interface TokenIssuedEvent extends BaseEvent {
  eventType: 'TokenIssued';
  data: {
    userId: string;
    tokenId: string; // jti claim
    tokenType: 'access' | 'refresh';
    expiresAt: Date;
    scope: string[];
    audience: string;
    dpopKeyThumbprint?: string;
  };
}

interface TokenRevokedEvent extends BaseEvent {
  eventType: 'TokenRevoked';
  data: {
    userId: string;
    tokenId: string;
    tokenType: 'access' | 'refresh';
    revokedBy: 'user' | 'admin' | 'system' | 'security';
    reason: string;
  };
}

interface JWKSRotatedEvent extends BaseEvent {
  eventType: 'JWKSRotated';
  data: {
    keyId: string;
    algorithm: 'ES256' | 'EdDSA';
    rotationReason: 'scheduled' | 'security_incident' | 'key_compromise';
    previousKeyId?: string;
    gracePeriodEnd: Date;
  };
}
```

---

## User Profile Service Events

### Profile Lifecycle Events
```typescript
interface ProfileCreatedEvent extends BaseEvent {
  eventType: 'ProfileCreated';
  data: {
    userId: string;
    profile: {
      email: string;
      fullName: string;
      phone?: string;
      preferredLanguage: string;
      timezone: string;
    };
    status: 'PENDING_VERIFICATION' | 'ACTIVE';
    createdBy: string; // Admin user ID if created by admin
  };
}

interface ProfileUpdatedEvent extends BaseEvent {
  eventType: 'ProfileUpdated';
  data: {
    userId: string;
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
    updatedBy: string;
    updateReason?: string;
  };
}

interface ProfileStatusChangedEvent extends BaseEvent {
  eventType: 'ProfileStatusChanged';
  data: {
    userId: string;
    oldStatus: 'PENDING_VERIFICATION' | 'ACTIVE' | 'LOCKED' | 'INACTIVE';
    newStatus: 'PENDING_VERIFICATION' | 'ACTIVE' | 'LOCKED' | 'INACTIVE';
    changedBy: string;
    reason: string;
  };
}

interface ProfileDeletedEvent extends BaseEvent {
  eventType: 'ProfileDeleted';
  data: {
    userId: string;
    deletionType: 'soft' | 'hard' | 'gdpr_request';
    deletedBy: string;
    retentionUntil?: Date; // For GDPR compliance
  };
}
```

### Membership Events
```typescript
interface MembershipCreatedEvent extends BaseEvent {
  eventType: 'MembershipCreated';
  data: {
    membershipId: string;
    userId: string;
    unitId: string;
    condominiumId: string;
    relationship: 'OWNER' | 'TENANT' | 'CONVIVIENTE' | 'STAFF' | 'PROVIDER' | 'VISITOR';
    since: Date;
    until?: Date;
    responsibleProfileId?: string;
    createdBy: string;
  };
}

interface MembershipUpdatedEvent extends BaseEvent {
  eventType: 'MembershipUpdated';
  data: {
    membershipId: string;
    userId: string;
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
    updatedBy: string;
  };
}

interface MembershipEndedEvent extends BaseEvent {
  eventType: 'MembershipEnded';
  data: {
    membershipId: string;
    userId: string;
    unitId: string;
    endedAt: Date;
    endReason: 'expired' | 'terminated' | 'transferred' | 'admin_action';
    endedBy: string;
  };
}
```

### Role Assignment Events
```typescript
interface RoleAssignedEvent extends BaseEvent {
  eventType: 'RoleAssigned';
  data: {
    assignmentId: string;
    userId: string;
    roleId: string;
    roleName: string;
    condominiumId: string;
    grantedBy: string;
    grantedAt: Date;
    expiresAt?: Date;
    permissions: string[];
  };
}

interface RoleRevokedEvent extends BaseEvent {
  eventType: 'RoleRevoked';
  data: {
    assignmentId: string;
    userId: string;
    roleId: string;
    roleName: string;
    condominiumId: string;
    revokedBy: string;
    revokedAt: Date;
    revocationReason: string;
  };
}
```

---

## Tenancy Service Events

### Tenant Lifecycle Events
```typescript
interface TenantCreatedEvent extends BaseEvent {
  eventType: 'TenantCreated';
  data: {
    tenantId: string;
    legalName: string;
    tenantType: 'ADMINISTRADORA' | 'JUNTA';
    country: string;
    status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
    createdBy: string;
    billingInfo?: {
      tier: 'free' | 'premium' | 'enterprise';
      billingEmail: string;
    };
  };
}

interface TenantStatusChangedEvent extends BaseEvent {
  eventType: 'TenantStatusChanged';
  data: {
    tenantId: string;
    oldStatus: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'INACTIVE';
    newStatus: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'INACTIVE';
    changedBy: string;
    reason: string;
    effectiveDate: Date;
  };
}

interface TenantConfigurationUpdatedEvent extends BaseEvent {
  eventType: 'TenantConfigurationUpdated';
  data: {
    tenantId: string;
    configType: 'billing' | 'features' | 'security' | 'compliance';
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
    updatedBy: string;
  };
}
```

### Condominium Events
```typescript
interface CondominiumCreatedEvent extends BaseEvent {
  eventType: 'CondominiumCreated';
  data: {
    condominiumId: string;
    tenantId: string;
    name: string;
    legalName: string;
    country: string;
    registrationNumber?: string;
    createdBy: string;
  };
}

interface CondominiumUpdatedEvent extends BaseEvent {
  eventType: 'CondominiumUpdated';
  data: {
    condominiumId: string;
    tenantId: string;
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
    updatedBy: string;
  };
}

interface FinancialConfigChangedEvent extends BaseEvent {
  eventType: 'FinancialConfigChanged';
  data: {
    condominiumId: string;
    tenantId: string;
    configType: 'currency' | 'fiscal_year' | 'accounting_method';
    oldValue: any;
    newValue: any;
    changedBy: string;
    complianceValidated: boolean;
  };
}
```

### Unit Management Events
```typescript
interface UnitCreatedEvent extends BaseEvent {
  eventType: 'UnitCreated';
  data: {
    unitId: string;
    condominiumId: string;
    tenantId: string;
    buildingId?: string;
    localCode: string;
    unitType: 'PRIVATE' | 'COMMON';
    aliquot?: number;
    createdBy: string;
  };
}

interface AliquotValidationEvent extends BaseEvent {
  eventType: 'AliquotValidation';
  data: {
    condominiumId: string;
    tenantId: string;
    validationType: 'unit_created' | 'unit_updated' | 'unit_deleted';
    totalAliquot: number;
    isValid: boolean;
    affectedUnits: string[];
    validatedBy: string;
  };
}
```

---

## System Events

### Health and Monitoring Events
```typescript
interface ServiceHealthChangedEvent extends BaseEvent {
  eventType: 'ServiceHealthChanged';
  data: {
    serviceName: string;
    serviceVersion: string;
    oldStatus: 'healthy' | 'degraded' | 'unhealthy';
    newStatus: 'healthy' | 'degraded' | 'unhealthy';
    healthCheck: {
      endpoint: string;
      responseTime: number;
      errorMessage?: string;
    };
    dependencies: {
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
    }[];
  };
}

interface CircuitBreakerStateChangedEvent extends BaseEvent {
  eventType: 'CircuitBreakerStateChanged';
  data: {
    serviceName: string;
    targetService: string;
    oldState: 'closed' | 'open' | 'half_open';
    newState: 'closed' | 'open' | 'half_open';
    failureCount: number;
    lastFailure?: string;
  };
}
```

### Security Events
```typescript
interface SecurityIncidentEvent extends BaseEvent {
  eventType: 'SecurityIncident';
  data: {
    incidentType: 'brute_force' | 'token_replay' | 'suspicious_activity' | 'data_breach';
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedUsers?: string[];
    affectedTenants?: string[];
    sourceIp?: string;
    userAgent?: string;
    description: string;
    mitigationActions: string[];
  };
}

interface ComplianceViolationEvent extends BaseEvent {
  eventType: 'ComplianceViolation';
  data: {
    violationType: 'gdpr' | 'data_retention' | 'access_control' | 'audit_trail';
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedData: string;
    detectionMethod: 'automated' | 'manual' | 'audit';
    requiredActions: string[];
    deadline?: Date;
  };
}
```

---

## Kafka Topic Configuration

### Topic Naming Convention
```
{environment}.{domain}.{event-type}.{version}

Examples:
- prod.identity.user-authenticated.v1
- staging.tenancy.tenant-created.v1
- dev.profiles.membership-created.v1
```

### Topic Configuration
```yaml
topics:
  identity-events:
    partitions: 6
    replication-factor: 3
    retention-ms: 604800000  # 7 days
    cleanup-policy: delete
    
  profile-events:
    partitions: 6
    replication-factor: 3
    retention-ms: 2592000000  # 30 days
    cleanup-policy: delete
    
  tenancy-events:
    partitions: 3
    replication-factor: 3
    retention-ms: 2592000000  # 30 days
    cleanup-policy: delete
    
  system-events:
    partitions: 3
    replication-factor: 3
    retention-ms: 604800000  # 7 days
    cleanup-policy: delete
    
  security-events:
    partitions: 6
    replication-factor: 3
    retention-ms: 7776000000  # 90 days
    cleanup-policy: delete
```

### Producer Configuration
```typescript
interface KafkaProducerConfig {
  clientId: string;
  brokers: string[];
  ssl: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256';
    username: string;
    password: string;
  };
  retry: {
    initialRetryTime: 100;
    retries: 8;
  };
  requestTimeout: 30000;
  compression: 'gzip';
}
```

### Consumer Configuration
```typescript
interface KafkaConsumerConfig {
  groupId: string;
  clientId: string;
  brokers: string[];
  fromBeginning: false;
  sessionTimeout: 30000;
  heartbeatInterval: 3000;
  maxWaitTimeInMs: 5000;
  retry: {
    initialRetryTime: 100;
    retries: 8;
  };
}
```

---

## Event Serialization

### Schema Registry Integration
```typescript
interface EventSerializer {
  serialize<T>(event: EventEnvelope<T>): Promise<Buffer>;
  deserialize<T>(data: Buffer): Promise<EventEnvelope<T>>;
  validateSchema(event: any): Promise<boolean>;
}

// Avro Schema Example
const UserAuthenticatedSchema = {
  type: "record",
  name: "UserAuthenticated",
  namespace: "com.smartedify.identity.events",
  fields: [
    { name: "eventId", type: "string" },
    { name: "eventType", type: "string" },
    { name: "eventVersion", type: "string" },
    { name: "timestamp", type: "string" },
    { name: "correlationId", type: "string" },
    { name: "tenantId", type: "string" },
    { name: "source", type: {
      type: "record",
      name: "EventSource",
      fields: [
        { name: "service", type: "string" },
        { name: "version", type: "string" }
      ]
    }},
    { name: "data", type: {
      type: "record",
      name: "UserAuthenticatedData",
      fields: [
        { name: "userId", type: "string" },
        { name: "email", type: "string" },
        { name: "tenantId", type: "string" },
        { name: "authMethod", type: "string" },
        { name: "sessionId", type: "string" },
        { name: "ipAddress", type: "string" },
        { name: "userAgent", type: "string" },
        { name: "mfaUsed", type: "boolean" },
        { name: "riskScore", type: ["null", "double"], default: null }
      ]
    }}
  ]
};
```

---

## Event Processing Patterns

### Event Sourcing
```typescript
interface EventStore {
  append(streamId: string, events: BaseEvent[]): Promise<void>;
  getEvents(streamId: string, fromVersion?: number): Promise<BaseEvent[]>;
  getSnapshot<T>(streamId: string): Promise<T | null>;
  saveSnapshot<T>(streamId: string, snapshot: T, version: number): Promise<void>;
}
```

### Saga Pattern Integration
```typescript
interface SagaEvent extends BaseEvent {
  sagaId: string;
  sagaType: string;
  stepId: string;
  stepStatus: 'started' | 'completed' | 'failed' | 'compensated';
}
```

### Dead Letter Queue
```typescript
interface DeadLetterEvent {
  originalEvent: BaseEvent;
  failureReason: string;
  failureCount: number;
  firstFailureAt: Date;
  lastFailureAt: Date;
  nextRetryAt?: Date;
}
```

This event schema specification provides the foundation for reliable inter-service communication and ensures data consistency across the SmartEdify platform.