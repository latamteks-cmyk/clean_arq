# 📋 Project Standards and Structure Guidelines

## Overview
This document establishes consistent project structure, naming conventions, and implementation policies across all SmartEdify platform services. All implementation plans must follow these standards to ensure maintainability, consistency, and operational excellence.

---

## Project Structure Standards

### Backend Services Structure (Node.js/TypeScript)
```
service-name/
├── src/
│   ├── controllers/          # HTTP request handlers
│   ├── services/            # Business logic layer
│   ├── repositories/        # Data access layer
│   ├── models/              # Domain models and interfaces
│   ├── middleware/          # Express middleware
│   ├── utils/               # Utility functions
│   ├── config/              # Configuration management
│   ├── types/               # TypeScript type definitions
│   └── index.ts             # Application entry point
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   ├── e2e/                 # End-to-end tests
│   └── fixtures/            # Test data and mocks
├── docs/
│   ├── api/                 # API documentation
│   ├── architecture/        # Architecture diagrams
│   └── deployment/          # Deployment guides
├── scripts/
│   ├── build.sh             # Build scripts
│   ├── test.sh              # Test scripts
│   └── deploy.sh            # Deployment scripts
├── config/
│   ├── development.json     # Development configuration
│   ├── staging.json         # Staging configuration
│   └── production.json      # Production configuration
├── migrations/              # Database migrations
├── Dockerfile               # Container definition
├── docker-compose.yml       # Local development setup
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── .eslintrc.js             # ESLint configuration
├── .prettierrc              # Prettier configuration
└── README.md                # Service documentation
```

### Frontend Services Structure (React/TypeScript)
```
web-service/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Common components
│   │   ├── forms/           # Form components
│   │   └── layout/          # Layout components
│   ├── pages/               # Page components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API service layer
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript type definitions
│   ├── styles/              # Global styles and themes
│   ├── assets/              # Static assets
│   └── App.tsx              # Main application component
├── public/
│   ├── index.html           # HTML template
│   ├── manifest.json        # PWA manifest
│   └── icons/               # Application icons
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # End-to-end tests
├── docs/
│   ├── components/          # Component documentation
│   └── user-guide/          # User documentation
├── scripts/
│   ├── build.sh             # Build scripts
│   └── deploy.sh            # Deployment scripts
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
├── .eslintrc.js             # ESLint configuration
├── .prettierrc              # Prettier configuration
└── README.md                # Service documentation
```

---

## Naming Conventions

### File and Directory Naming
- **Directories**: kebab-case (e.g., `user-profile`, `auth-middleware`)
- **TypeScript Files**: camelCase (e.g., `userService.ts`, `authMiddleware.ts`)
- **React Components**: PascalCase (e.g., `UserProfile.tsx`, `LoginForm.tsx`)
- **Test Files**: `*.test.ts` or `*.spec.ts`
- **Configuration Files**: kebab-case (e.g., `database-config.ts`)

### Code Naming
- **Classes**: PascalCase (e.g., `UserService`, `AuthManager`)
- **Interfaces**: PascalCase with descriptive names (e.g., `UserRepository`, `AuthConfig`)
- **Functions/Methods**: camelCase (e.g., `getUserById`, `validateToken`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT`)
- **Environment Variables**: SCREAMING_SNAKE_CASE (e.g., `DATABASE_URL`, `JWT_SECRET`)

---

## Configuration Management Standards

### Environment Configuration
```typescript
// config/index.ts
interface ServiceConfig {
  server: {
    port: number;
    host: string;
    cors: {
      origin: string[];
      credentials: boolean;
    };
  };
  database: {
    url: string;
    pool: {
      min: number;
      max: number;
    };
  };
  redis: {
    url: string;
    keyPrefix: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiry: string;
    refreshTokenExpiry: string;
  };
  observability: {
    tracing: {
      endpoint: string;
      serviceName: string;
    };
    metrics: {
      endpoint: string;
      interval: number;
    };
  };
}
```

### Environment Variables
- **Development**: `.env.development`
- **Staging**: `.env.staging`
- **Production**: Environment variables injected by deployment system
- **Testing**: `.env.test`

---

## Logging Standards

### Structured Logging Format
```typescript
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  traceId?: string;
  correlationId?: string;
  userId?: string;
  tenantId?: string;
  message: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack: string;
  };
}
```

### Log Levels
- **DEBUG**: Detailed information for debugging
- **INFO**: General information about application flow
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages for failures and exceptions

---

## Testing Standards

### Test Organization
```
tests/
├── unit/
│   ├── services/            # Service layer tests
│   ├── repositories/        # Repository layer tests
│   ├── utils/               # Utility function tests
│   └── middleware/          # Middleware tests
├── integration/
│   ├── api/                 # API endpoint tests
│   ├── database/            # Database integration tests
│   └── external/            # External service integration tests
└── e2e/
    ├── workflows/           # Complete user workflows
    └── scenarios/           # Business scenario tests
```

### Test Naming Convention
```typescript
// Unit tests
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when valid ID provided', () => {});
    it('should throw error when user not found', () => {});
    it('should handle database connection errors', () => {});
  });
});

// Integration tests
describe('POST /api/v1/users', () => {
  it('should create user with valid data', () => {});
  it('should return 400 for invalid email format', () => {});
  it('should return 409 for duplicate email', () => {});
});
```

### Test Coverage Requirements
- **Unit Tests**: ≥ 80% code coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: Critical user workflows covered

---

## Error Handling Standards

### Error Classification
```typescript
enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  INTERNAL_SERVER = 'internal_server'
}

interface StandardError {
  type: ErrorType;
  message: string;
  code: string;
  details?: Record<string, any>;
  traceId: string;
  timestamp: Date;
}
```

### HTTP Status Code Mapping
- **400**: Validation errors, malformed requests
- **401**: Authentication required or failed
- **403**: Authorization denied
- **404**: Resource not found
- **409**: Conflict (duplicate resource)
- **429**: Rate limit exceeded
- **500**: Internal server error
- **502**: Bad gateway (upstream service error)
- **503**: Service unavailable

---

## Security Standards

### Authentication and Authorization
- **JWT Tokens**: ES256 algorithm, 15-minute expiry
- **Refresh Tokens**: 7-day expiry, secure httpOnly cookies
- **DPoP Proofs**: RFC 9449 compliance, per-request generation
- **Session Management**: 30-minute timeout for admin, 1-hour for users

### Data Protection
- **PII Encryption**: Field-level encryption for sensitive data
- **Data Masking**: Role-based data masking in responses
- **Audit Logging**: Immutable logs for all data access and modifications
- **GDPR Compliance**: Data export, deletion, and consent management

### Input Validation
- **Schema Validation**: JSON Schema or Joi validation for all inputs
- **Sanitization**: HTML and SQL injection prevention
- **Rate Limiting**: Per-user and per-IP rate limiting
- **CORS**: Strict origin validation

---

## Performance Standards

### Response Time Targets
- **Simple Queries**: ≤ 200ms (single service)
- **Complex Aggregations**: ≤ 500ms (multi-service)
- **Bulk Operations**: ≤ 2s (with progress tracking)
- **File Uploads**: ≤ 30s (with streaming)

### Caching Strategy
- **Cache Levels**: L1 (memory), L2 (Redis), L3 (CDN)
- **TTL Guidelines**: 
  - Static data: 1 hour
  - User data: 5 minutes
  - Real-time data: 30 seconds
- **Cache Keys**: Tenant-aware with proper scoping
- **Invalidation**: Tag-based invalidation strategies

### Resource Limits
- **Memory Usage**: ≤ 2GB per service instance
- **CPU Usage**: ≤ 70% under normal load
- **Database Connections**: Pool size 10-50 per instance
- **File Size Limits**: 10MB for uploads, 100MB for exports

---

## Deployment Standards

### Container Standards
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app .
USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
```

### Health Check Endpoints
- **GET /health**: Basic health check
- **GET /ready**: Readiness check with dependencies
- **GET /metrics**: Prometheus metrics endpoint

### Environment Configuration
- **Development**: Local Docker Compose
- **Staging**: Kubernetes with staging configuration
- **Production**: Kubernetes with production configuration

---

## Monitoring and Observability Standards

### Metrics Collection
```typescript
interface ServiceMetrics {
  // RED Metrics
  requestRate: number;
  errorRate: number;
  duration: {
    p50: number;
    p95: number;
    p99: number;
  };
  
  // USE Metrics
  utilization: {
    cpu: number;
    memory: number;
    disk: number;
  };
  saturation: {
    queueDepth: number;
    connectionPool: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
  };
}
```

### Distributed Tracing
- **Trace Context**: W3C Trace Context propagation
- **Span Naming**: `service.operation` format
- **Baggage**: tenant_id, user_id, correlation_id
- **Sampling**: 10% for normal traffic, 100% for errors

### Alerting Rules
- **Error Rate**: > 1% for 5 minutes
- **Response Time**: P95 > 1s for 5 minutes
- **Memory Usage**: > 80% for 10 minutes
- **CPU Usage**: > 80% for 10 minutes

---

## Documentation Standards

### API Documentation
- **OpenAPI 3.0**: Complete specification with examples
- **Postman Collections**: Updated collections for testing
- **SDK Documentation**: Auto-generated from OpenAPI specs

### Code Documentation
- **JSDoc**: All public methods and classes
- **README**: Service overview, setup, and usage
- **Architecture Diagrams**: Mermaid diagrams in documentation

### Deployment Documentation
- **Runbooks**: Operational procedures and troubleshooting
- **Configuration Guide**: Environment setup and configuration
- **Monitoring Guide**: Metrics, alerts, and dashboards

---

## Compliance and Governance

### Code Quality
- **ESLint**: Strict configuration with custom rules
- **Prettier**: Consistent code formatting
- **SonarQube**: Code quality and security scanning
- **Dependency Scanning**: Automated vulnerability scanning

### Git Workflow
- **Branch Naming**: `feature/`, `bugfix/`, `hotfix/` prefixes
- **Commit Messages**: Conventional commits format
- **Pull Requests**: Required reviews and automated checks
- **Release Tags**: Semantic versioning (semver)

### Change Management
- **Feature Flags**: Gradual rollout and quick rollback
- **Database Migrations**: Backward compatible migrations
- **API Versioning**: Semantic versioning with deprecation notices
- **Breaking Changes**: Advance notice and migration guides

---

## Implementation Checklist

### Before Starting Implementation
- [ ] Project structure follows standards
- [ ] Configuration management implemented
- [ ] Logging infrastructure set up
- [ ] Testing framework configured
- [ ] Error handling patterns defined
- [ ] Security measures implemented
- [ ] Performance monitoring configured
- [ ] Documentation templates created

### During Implementation
- [ ] Code follows naming conventions
- [ ] Tests written for all new functionality
- [ ] Error handling implemented consistently
- [ ] Performance targets met
- [ ] Security requirements satisfied
- [ ] Documentation updated
- [ ] Monitoring and alerting configured

### Before Deployment
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance testing completed
- [ ] Documentation complete
- [ ] Monitoring configured
- [ ] Runbooks created
- [ ] Rollback procedures tested

---

> _These standards ensure consistency, maintainability, and operational excellence across all SmartEdify platform services. All implementation plans must be updated to reflect these standards._