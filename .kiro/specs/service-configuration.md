# ⚙️ Service Configuration Standards

## Overview
This document standardizes configuration across all SmartEdify platform services, ensuring consistency in ports, timeouts, cache TTLs, rate limits, and other operational parameters.

---

## Service Port Assignments

### Production Port Matrix
| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| **Gateway Service** | 8080 | HTTP/HTTPS | Main API gateway |
| **Web User** | 3000 | HTTP | User frontend application |
| **Web Admin** | 4000 | HTTP | Admin frontend application |
| **Mobile App** | 8081 | HTTP | Mobile application |
| **Identity Service** | 3001 | HTTP | Authentication & authorization |
| **User Profiles Service** | 3002 | HTTP | Profile & membership management |
| **Tenancy Service** | 3003 | HTTP | Tenant & condominium management |
| **Physical Security Service** | 3004 | HTTP | Physical security management |
| **Notifications Service** | 3005 | HTTP | Notification delivery |
| **Documents Service** | 3006 | HTTP | Document management |
| **BFF User** | 3007 | HTTP | User backend for frontend |
| **Finance Service** | 3017 | HTTP | Financial management |
| **Payroll Service** | 3008 | HTTP | Payroll management |
| **HR Compliance Service** | 3009 | HTTP | HR compliance |
| **Asset Management Service** | 3010 | HTTP | Asset management |
| **Governance Service** | 3011 | HTTP | Governance workflows |
| **Compliance Service** | 3012 | HTTP | Compliance & audit |
| **Reservation Service** | 3013 | HTTP | Reservation management |
| **Streaming Service** | 3014 | HTTP | Video streaming |
| **Marketplace Service** | 3015 | HTTP | Marketplace functionality |
| **Analytics Service** | 3016 | HTTP | Analytics & reporting |
| **BFF Admin** | 4001 | HTTP | Admin backend for frontend |
| **BFF Mobile** | 8082 | HTTP | Mobile backend for frontend |

### Development Port Offsets
```yaml
development:
  base_offset: 0     # Use production ports
  
staging:
  base_offset: 1000  # Add 1000 to each port
  
testing:
  base_offset: 2000  # Add 2000 to each port
```

---

## Cache TTL Standardization

### Cache Duration Matrix
| Data Type | TTL | Justification |
|-----------|-----|---------------|
| **JWKS Keys** | 300s (5min) | Security - frequent rotation |
| **User Profiles** | 300s (5min) | Moderate change frequency |
| **Tenant Data** | 600s (10min) | Low change frequency |
| **Condominium Info** | 1800s (30min) | Very low change frequency |
| **Role Assignments** | 300s (5min) | Security - permission changes |
| **Dashboard Metrics** | 60s (1min) | Real-time requirements |
| **System Health** | 30s | Critical monitoring data |
| **Static Assets** | 86400s (24h) | Rarely change |
| **API Responses** | 180s (3min) | Balance freshness/performance |

### Cache Key Patterns
```typescript
interface CacheKeyPatterns {
  // Tenant-scoped keys
  tenantData: 'tenant:{tenantId}:data';
  tenantUsers: 'tenant:{tenantId}:users:page:{page}';
  tenantConfig: 'tenant:{tenantId}:config';
  
  // User-scoped keys
  userProfile: 'user:{userId}:profile';
  userRoles: 'user:{userId}:roles:tenant:{tenantId}';
  userSessions: 'user:{userId}:sessions';
  
  // System-wide keys
  jwks: 'system:jwks:kid:{keyId}';
  serviceHealth: 'system:health:{serviceName}';
  systemMetrics: 'system:metrics:{timeRange}';
  
  // Admin-specific keys
  adminDashboard: 'admin:{adminId}:dashboard';
  adminQuery: 'admin:query:{queryHash}';
}
```

---

## Rate Limiting Standards

### Rate Limit Matrix
| Service | Endpoint Type | Limit | Window | Scope |
|---------|---------------|-------|--------|-------|
| **Gateway** | Authentication | 10/min | 1min | IP + User |
| **Gateway** | Read Operations | 600/min | 1min | User |
| **Gateway** | Write Operations | 60/min | 1min | User |
| **Gateway** | Admin Operations | 1000/min | 1min | Admin User |
| **Identity** | Login Attempts | 5/min | 1min | IP |
| **Identity** | Token Refresh | 10/min | 1min | User |
| **Identity** | Password Reset | 3/hour | 1hour | Email |
| **User Profile** | Profile Updates | 10/min | 1min | User |
| **User Profile** | Bulk Operations | 5/min | 1min | Admin |
| **Tenancy** | Tenant Creation | 2/hour | 1hour | Admin |
| **Tenancy** | Unit Operations | 100/min | 1min | Tenant |
| **BFF Admin** | Data Aggregation | 500/min | 1min | Admin |
| **BFF Admin** | Export Operations | 10/hour | 1hour | Admin |

### Rate Limiting Configuration
```typescript
interface RateLimitConfig {
  algorithm: 'sliding_window' | 'fixed_window' | 'token_bucket';
  storage: 'redis' | 'memory';
  keyGenerator: (req: Request) => string;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  headers: {
    total: 'X-RateLimit-Limit';
    remaining: 'X-RateLimit-Remaining';
    reset: 'X-RateLimit-Reset';
  };
}

// Example configurations
const authRateLimit: RateLimitConfig = {
  algorithm: 'sliding_window',
  storage: 'redis',
  keyGenerator: (req) => `auth:${req.ip}:${req.body.email}`,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  headers: {
    total: 'X-RateLimit-Limit',
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset'
  }
};
```

---

## Timeout Configuration

### Service Timeout Matrix
| Operation Type | Connect | Request | Total | Retry |
|----------------|---------|---------|-------|-------|
| **Authentication** | 2s | 5s | 10s | 3x |
| **Database Query** | 1s | 10s | 15s | 2x |
| **Cache Operation** | 500ms | 2s | 3s | 1x |
| **External API** | 3s | 15s | 30s | 3x |
| **File Upload** | 5s | 60s | 120s | 1x |
| **Bulk Operation** | 2s | 30s | 60s | 1x |
| **Health Check** | 1s | 3s | 5s | 0x |
| **Inter-service** | 1s | 5s | 10s | 2x |

### Circuit Breaker Configuration
```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures to open circuit
  successThreshold: number;    // Number of successes to close circuit
  timeout: number;            // Timeout in milliseconds
  resetTimeout: number;       // Time to wait before trying again
  monitoringPeriod: number;   // Time window for failure counting
}

// Service-specific configurations
const serviceCircuitBreakers = {
  identity: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 10000,
    resetTimeout: 30000,
    monitoringPeriod: 60000
  },
  tenancy: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 10000,
    resetTimeout: 30000,
    monitoringPeriod: 60000
  },
  userProfile: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 10000,
    resetTimeout: 30000,
    monitoringPeriod: 60000
  },
  analytics: {
    failureThreshold: 10,
    successThreshold: 5,
    timeout: 15000,
    resetTimeout: 60000,
    monitoringPeriod: 120000
  }
};
```

---

## Database Configuration

### Connection Pool Settings
```typescript
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  
  pool: {
    min: number;
    max: number;
    acquireTimeoutMillis: number;
    createTimeoutMillis: number;
    destroyTimeoutMillis: number;
    idleTimeoutMillis: number;
    reapIntervalMillis: number;
    createRetryIntervalMillis: number;
  };
  
  ssl: {
    rejectUnauthorized: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
}

// Service-specific pool configurations
const databasePools = {
  identity: { min: 5, max: 20 },      // High auth load
  userProfile: { min: 5, max: 25 },  // High read/write load
  tenancy: { min: 3, max: 15 },      // Moderate load
  bffAdmin: { min: 2, max: 10 },     // Admin operations only
  analytics: { min: 2, max: 15 }     // Read-heavy, batch operations
};
```

### Query Timeout Configuration
```typescript
interface QueryTimeouts {
  simple: 5000;      // Simple SELECT queries
  complex: 15000;    // JOINs and aggregations
  bulk: 30000;       // Bulk INSERT/UPDATE operations
  migration: 300000; // Database migrations
  backup: 600000;    // Backup operations
}
```

---

## Redis Configuration

### Redis Connection Settings
```typescript
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  
  keyPrefix: string;
  
  retryDelayOnFailover: number;
  enableReadyCheck: boolean;
  maxRetriesPerRequest: number;
  
  lazyConnect: boolean;
  keepAlive: number;
  
  cluster?: {
    enableOfflineQueue: boolean;
    redisOptions: {
      password: string;
    };
  };
}

// Service-specific Redis configurations
const redisConfigs = {
  gateway: {
    keyPrefix: 'gw:',
    db: 0,  // Rate limiting, JWKS cache
  },
  bffAdmin: {
    keyPrefix: 'admin:',
    db: 1,  // Admin data cache
  },
  sessions: {
    keyPrefix: 'sess:',
    db: 2,  // Session storage
  },
  cache: {
    keyPrefix: 'cache:',
    db: 3,  // General application cache
  }
};
```

---

## Kafka Configuration

### Producer Configuration
```typescript
interface KafkaProducerConfig {
  clientId: string;
  brokers: string[];
  
  // Performance settings
  acks: 'all';
  retries: 2147483647;
  maxInFlightRequests: 5;
  enableIdempotence: true;
  
  // Batching settings
  batchSize: 16384;
  lingerMs: 5;
  
  // Compression
  compression: 'gzip';
  
  // Timeouts
  requestTimeout: 30000;
  
  // Security
  ssl?: {
    rejectUnauthorized: boolean;
    ca: string;
    cert: string;
    key: string;
  };
  
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256';
    username: string;
    password: string;
  };
}
```

### Consumer Configuration
```typescript
interface KafkaConsumerConfig {
  groupId: string;
  clientId: string;
  brokers: string[];
  
  // Consumer settings
  sessionTimeout: 30000;
  rebalanceTimeout: 60000;
  heartbeatInterval: 3000;
  
  // Fetch settings
  minBytes: 1;
  maxBytes: 1048576;
  maxWaitTime: 5000;
  
  // Offset management
  fromBeginning: false;
  autoCommit: true;
  autoCommitInterval: 5000;
  
  // Error handling
  retry: {
    initialRetryTime: 100;
    retries: 8;
  };
}
```

---

## Logging Configuration

### Log Level Matrix
| Environment | Default | Auth | Database | Cache | External |
|-------------|---------|------|----------|-------|----------|
| **Development** | DEBUG | DEBUG | DEBUG | DEBUG | DEBUG |
| **Testing** | INFO | DEBUG | INFO | INFO | INFO |
| **Staging** | INFO | INFO | WARN | INFO | INFO |
| **Production** | WARN | INFO | ERROR | WARN | WARN |

### Structured Logging Format
```typescript
interface LogEntry {
  timestamp: string;        // ISO 8601
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  service: string;          // Service name
  version: string;          // Service version
  traceId?: string;         // Distributed tracing ID
  correlationId?: string;   // Request correlation ID
  userId?: string;          // User context
  tenantId?: string;        // Tenant context
  sessionId?: string;       // Session context
  message: string;          // Log message
  metadata?: Record<string, any>; // Additional context
  error?: {
    name: string;
    message: string;
    stack: string;
  };
}
```

---

## Health Check Configuration

### Health Check Endpoints
```typescript
interface HealthCheckConfig {
  endpoints: {
    liveness: '/health';      // Basic health check
    readiness: '/ready';      // Dependency health check
    metrics: '/metrics';      // Prometheus metrics
  };
  
  checks: {
    database: {
      timeout: 5000;
      query: 'SELECT 1';
    };
    redis: {
      timeout: 2000;
      command: 'PING';
    };
    kafka: {
      timeout: 10000;
      operation: 'metadata';
    };
    externalServices: {
      timeout: 5000;
      endpoints: string[];
    };
  };
  
  intervals: {
    liveness: 30000;    // 30 seconds
    readiness: 10000;   // 10 seconds
    metrics: 15000;     // 15 seconds
  };
}
```

### Service Dependency Matrix
| Service | Database | Redis | Kafka | Identity | Tenancy | User Profile |
|---------|----------|-------|-------|----------|---------|--------------|
| **Gateway** | ❌ | ✅ | ❌ | ✅ (JWKS) | ❌ | ❌ |
| **Identity** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **User Profile** | ✅ | ✅ | ✅ | ✅ (events) | ✅ (validation) | ❌ |
| **Tenancy** | ✅ | ✅ | ✅ | ✅ (auth) | ❌ | ❌ |
| **BFF Admin** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Web Service** | ❌ | ❌ | ❌ | ❌ (via Gateway) | ❌ | ❌ |

---

## Security Configuration

### JWT Configuration
```typescript
interface JWTConfig {
  algorithm: 'ES256' | 'EdDSA';
  issuer: string;
  audience: string[];
  
  accessToken: {
    expiresIn: '15m';
    claims: string[];
  };
  
  refreshToken: {
    expiresIn: '7d';
    httpOnly: true;
    secure: true;
    sameSite: 'strict';
  };
  
  keyRotation: {
    interval: '90d';
    gracePeriod: '24h';
  };
}
```

### CORS Configuration
```typescript
interface CORSConfig {
  origin: string[] | boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
}

// Environment-specific CORS
const corsConfigs = {
  development: {
    origin: true,
    credentials: true
  },
  staging: {
    origin: [
      'https://staging.smartedify.com',
      'https://admin-staging.smartedify.com'
    ],
    credentials: true
  },
  production: {
    origin: [
      'https://smartedify.com',
      'https://admin.smartedify.com'
    ],
    credentials: true
  }
};
```

---

## Environment-Specific Configurations

### Development Environment
```yaml
development:
  database:
    host: localhost
    port: 5432
    ssl: false
  
  redis:
    host: localhost
    port: 6379
    password: null
  
  kafka:
    brokers: ['localhost:9092']
    ssl: false
  
  logging:
    level: DEBUG
    console: true
    file: false
  
  security:
    cors:
      origin: true
    jwt:
      algorithm: ES256
      accessTokenExpiry: 1h  # Longer for development
```

### Staging Environment
```yaml
staging:
  database:
    host: staging-db.smartedify.com
    port: 5432
    ssl: true
    pool:
      min: 2
      max: 10
  
  redis:
    host: staging-redis.smartedify.com
    port: 6379
    password: ${REDIS_PASSWORD}
    ssl: true
  
  kafka:
    brokers: ['staging-kafka.smartedify.com:9092']
    ssl: true
    sasl:
      mechanism: scram-sha-256
  
  logging:
    level: INFO
    console: false
    file: true
  
  security:
    cors:
      origin: ['https://staging.smartedify.com']
    jwt:
      algorithm: ES256
      accessTokenExpiry: 15m
```

### Production Environment
```yaml
production:
  database:
    host: ${DB_HOST}
    port: 5432
    ssl: true
    pool:
      min: 5
      max: 25
  
  redis:
    cluster: true
    nodes: ${REDIS_CLUSTER_NODES}
    password: ${REDIS_PASSWORD}
    ssl: true
  
  kafka:
    brokers: ${KAFKA_BROKERS}
    ssl: true
    sasl:
      mechanism: scram-sha-256
      username: ${KAFKA_USERNAME}
      password: ${KAFKA_PASSWORD}
  
  logging:
    level: WARN
    console: false
    file: true
    structured: true
  
  security:
    cors:
      origin: ['https://smartedify.com']
    jwt:
      algorithm: EdDSA
      accessTokenExpiry: 15m
```

This configuration standard ensures consistency across all services and environments while providing the flexibility needed for different operational requirements.