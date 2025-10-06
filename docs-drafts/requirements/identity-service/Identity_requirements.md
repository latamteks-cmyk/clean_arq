# 📋 Requirements Document – Identity Service

## 1. Introduction

This document establishes the auditable requirements for `identity-service` (port 3001), defining the minimum technical, business, and integration criteria to be validated. The identity service serves as the central identity provider for the SmartEdify platform, managing multi-tenant digital identity, authentication, authorization, and sessions with expanded support for biometric and QR authentication for transnational integration.

---

## 2. Requirements

### Requirement ID: ID-001 - Multi-Tenant User Registration

**User Story:**  
As a prospective user, I want to register with my basic information and provide explicit consents, so that I can access the SmartEdify platform while ensuring legal compliance with data protection regulations.

**Acceptance Criteria:**
1. WHEN a user attempts to register THEN the system SHALL validate all required fields (name, email, phone, national identifier according to jurisdiction)
2. WHEN processing national identifiers THEN the system SHALL NOT store them in identity-service but move to user-profiles-service or encrypt deterministically with KMS
3. WHEN collecting consents THEN the system SHALL require explicit consent for data processing, biometric usage, and video recording
4. WHEN registration data is validated THEN the system SHALL verify email and phone via OTP
5. WHEN registration completes THEN the system SHALL create corresponding records in user-profiles-service via event emission

---

### Requirement ID: ID-002 - Secure Authentication Methods

**User Story:**  
As a user, I want to authenticate using secure methods that meet NIST 800-63-4 standards, so that my account remains protected against unauthorized access.

**Acceptance Criteria:**
1. WHEN authenticating THEN the system SHALL prioritize WebAuthn/Passkeys (AAL2/AAL3) as the preferred method
2. WHEN WebAuthn is unavailable THEN the system SHALL support TOTP (AAL2) as secondary method
3. WHEN no other methods are available THEN the system SHALL allow password + Argon2id (AAL1) with validation against compromised password lists
4. WHEN using fallback methods THEN the system SHALL prohibit password resets using only SMS/Email and require AAL2 or enhanced verification
5. WHEN storing WebAuthn credentials THEN the system SHALL ONLY store credentialId, publicKey, and signCount, NEVER biometric templates or private keys

---

### Requirement ID: ID-003 - Adaptive Multi-Factor Authentication

**User Story:**  
As a security-conscious user, I want the system to require MFA for high-risk operations, so that my sensitive data and account remain secure.

**Acceptance Criteria:**
1. WHEN performing high-risk operations (password change, sensitive data access, minute signing) THEN the system SHALL require MFA (TOTP or Passkey)
2. WHEN determining MFA requirements THEN the system SHALL consult compliance-service for risk-based policies
3. WHEN MFA is triggered THEN the system SHALL provide clear context about why additional verification is required

---

### Requirement ID: ID-004 - OAuth 2.0/OIDC Compliance

**User Story:**  
As an application developer, I want to integrate with SmartEdify using secure, standards-compliant OAuth 2.0/OIDC flows, so that I can provide a secure user experience.

**Acceptance Criteria:**
1. WHEN implementing authorization flows THEN the system SHALL require authorization_code flow with PKCE for all client applications
2. WHEN evaluating authorization requests THEN the system SHALL explicitly prohibit implicit and hybrid flows
3. WHEN issuing access tokens THEN the system SHALL use JWT format with ES256/EdDSA signing and include kid header field
4. WHEN configuring OIDC discovery THEN the system SHALL provide issuer per tenant: `https://auth.smartedify.global/t/{tenant_id}`
5. WHEN exposing JWKS THEN the system SHALL provide jwks_uri at `https://auth.smartedify.global/.well-known/jwks.json?tenant_id={tenant_id}`

---

### Requirement ID: ID-005 - Secure Token Management

**User Story:**  
As a security architect, I want tokens to be short-lived, bound to specific devices, and properly rotated, so that token theft has minimal impact.

**Acceptance Criteria:**
1. WHEN issuing access tokens THEN the system SHALL set lifetime ≤ 10 minutes
2. WHEN managing refresh tokens THEN the system SHALL implement mandatory rotation where each use generates a new refresh token
3. WHEN detecting refresh token reuse THEN the system SHALL revoke all tokens in the token family
4. WHEN binding tokens to devices THEN the system SHALL use DPoP (RFC 9449) with cnf claim containing jkt of client public key
5. WHEN rotating cryptographic keys THEN the system SHALL automatically rotate every 90 days with 7-day rollover period

---

### Requirement ID: ID-006 - Contextual QR Token Generation & Validation

**User Story:**  
As a physical security system, I want to validate signed QR tokens for events like assemblies or physical access, so that I can ensure only authorized individuals gain entry.

**Acceptance Criteria:**
1. WHEN generating QR tokens THEN the system SHALL create signed COSE/JWS tokens with jti, aud, nbf/exp, cnf, and kid headers
2. WHEN validating QR tokens THEN the system SHALL require DPoP proof and verify signature using kid to select correct public key
3. WHEN designing QR tokens THEN the system SHALL define short TTLs and maintain revocation lists for lost/stolen tokens
4. WHEN documenting QR tokens THEN the system SHALL prohibit HS256 examples and use only ES256 or EdDSA in documentation

---

### Requirement ID: ID-007 - Data Subject Access Rights (DSAR) Compliance

**User Story:**  
As a data subject, I want to exercise my rights to data portability and deletion, so that I maintain control over my personal information.

**Acceptance Criteria:**
1. WHEN receiving data export requests THEN the system SHALL process asynchronously with job_id and webhook completion notifications
2. WHEN receiving data deletion requests THEN the system SHALL create job_id, publish DataDeletionRequested event, and orchestrate cross-service crypto-erase
3. WHEN processing DSAR requests THEN the system SHALL require strong authentication (AAL2) and additional verification (OTP or Passkey)
4. WHEN implementing deletion endpoints THEN the system SHALL ensure idempotency for already processed job_id requests
5. WHEN completing DSAR operations THEN the system SHALL generate audit reports with timestamps

---

### Requirement ID: ID-008 - Real-time Compliance Enforcement

**User Story:**  
As a compliance officer, I want the identity service to validate legal requirements in real-time for critical operations, so that we maintain continuous regulatory compliance.

**Acceptance Criteria:**
1. WHEN performing critical operations (registration, high-risk login, QR issuance) THEN the system SHALL consult compliance-service for retention policies, DSAR requirements, and country-specific mandates
2. WHEN compliance validation fails THEN the system SHALL block the operation and provide detailed legal reasoning
3. WHEN operating across jurisdictions THEN the system SHALL adapt authentication and privacy policies based on tenant country

---

### Requirement ID: ID-009 - Session Management & Global Logout

**User Story:**  
As a user, I want to manage my active sessions and be able to log out globally from all devices, so that I can maintain control over my account security.

**Acceptance Criteria:**
1. WHEN implementing global logout THEN the system SHALL achieve P95 revocation time ≤ 30 seconds
2. WHEN managing sessions THEN the system SHALL implement per-device session versioning and "not-before" per subject
3. WHEN revoking sessions THEN the system SHALL use distributed revocation events rather than just Redis blacklisting
4. WHEN tracking active sessions THEN the system SHALL expose device_id, cnf_jkt, issued_at, and version information

---

### Requirement ID: ID-010 - WebSocket Proof-of-Possession

**User Story:**  
As a real-time application, I want to establish secure WebSocket connections with proof-of-possession validation, so that I can maintain secure real-time communication.

**Acceptance Criteria:**
1. WHEN establishing WebSocket connections THEN the system SHALL require DPoP header in the initial HTTP Upgrade request
2. WHEN validating WebSocket handshakes THEN the system SHALL validate DPoP and access token with lifetime ≤ 5 minutes
3. WHEN tokens expire during WebSocket sessions THEN the system SHALL close connection with code 4401
4. WHEN clients need to refresh tokens THEN the system SHALL support in-band renewal via JSON frame: `{"type": "token_refresh", "new_access_token": "..."}`

---

## 3. Cross-Service Consistency Validation

**User Story:**  
As a system architect, I want to validate consistency across services to identify missing or incorrect dependencies.

**Acceptance Criteria:**
1. WHEN validating consistency THEN the system SHALL ensure all JWT tokens include kid header and use ES256/EdDSA algorithms exclusively
2. WHEN reviewing APIs THEN the system SHALL verify PKCE is required in all authorization_code flows and implicit/hybrid flows are blocked
3. WHEN analyzing events THEN the system SHALL confirm DataDeletionRequested events are properly formatted and consumed by compliance-service
4. WHEN validating security THEN the system SHALL ensure gateway-service caches JWKS with TTL ≤ 5 minutes and governance-service uses kid for token validation
5. WHEN reviewing documentation THEN the system SHALL confirm all code examples use ES256/EdDSA and zero examples show HS256

---

## 4. Reporting & Traceability

- **Traceability:**  
  All requirements must be uniquely referenced (ID-XXX) for traceability in implementation, testing, and audit reports. Each requirement shall be mapped to specific code commits, test cases, and deployment artifacts.

- **Reporting:**  
  The system SHALL generate a requirements coverage matrix and report all unmet or partially met requirements. Metrics shall include:
  - Requirement implementation status (Not Started, In Progress, Completed, Verified)
  - Test coverage per requirement
  - Security validation status
  - Compliance certification status

---

## 5. Approval & Change Control

- **Versioning:**  
  Update this document as requirements change, recording revisions and rationales. All changes must reference architectural decisions and compliance impacts.

- **Approval:**  
  All requirements must be reviewed and approved by architecture and product leads before moving to implementation. Specific approvals required from:
  - Chief Technology Officer
  - Security Architect
  - Compliance Officer
  - Product Manager

---
