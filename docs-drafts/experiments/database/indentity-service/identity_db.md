/*
 * ==============================================================================
 * ADVERTENCIA: ARCHIVO FINAL - NO MODIFICAR MANUALMENTE
 * ==============================================================================
 *
 * Este esquema de base de datos es la versión final de identity_service
 * Ha sido revisado y aprobado por el equipo de arquitectura.
 *
 * Cualquier modificación debe realizarse a través de los procesos de gestión
 * de cambios del proyecto y la revisión de código correspondiente.
 *
 * Última actualización manual: 2025-10-04
 * Congelado por: [Edgar Gomez]
 *
 * ==============================================================================
 */

Enum account_status {
  ACTIVE
  DISABLED
  LOCKED
}

Enum verification_state {
  PENDING
  VERIFIED
  REJECTED
}

Enum provider_type {
  PASSWORD
  GOOGLE
  APPLE
  MICROSOFT
  GITHUB
  OIDC_CUSTOM
}

Enum client_type {
  PUBLIC
  CONFIDENTIAL
}

Table users {
  id uuid [pk, note: 'origen=identity_claims; evidencia=user:create; // "9f0a1c22-7bcd-4b90-a111-55aa22bbcc33"']
  tenant_id uuid [not null, note: 'origen=governance_event; evidencia=acta-2025-001; // "4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10"']
  email text [not null, note: 'origen=profile_consents; evidencia=signup-form; // "user@example.com"']
  email_normalized text [not null, note: 'origen=identity_claims; evidencia=normalized; // "user@example.com"']
  email_verified bool [default: false, note: 'origen=identity_claims; evidencia=evt:email_verified; // "false"']
  phone text [note: 'origen=profile_consents; evidencia=signup-form; // "+51987654321"']
  phone_verified bool [default: false, note: 'origen=identity_claims; evidencia=evt:phone_verified; // "false"']
  status account_status [not null, default: 'ACTIVE', note: 'origen=governance_event; evidencia=acta-2025-001; // "ACTIVE"']
  mfa_required bool [default: false, note: 'origen=identity_policy; evidencia=mfa:rule-01; // "false"']
  created_at timestamptz [note: 'origen=identity_claims; evidencia=event:create; // "2025-10-04T10:12:00Z"']
  updated_at timestamptz [note: 'origen=identity_claims; evidencia=event:update; // "2025-10-04T10:12:00Z"']
  deleted_at timestamptz [note: 'origen=identity_claims; evidencia=event:delete; // "null"']

  Note: 'UNIQUE (tenant_id, email_normalized) y UNIQUE (id, tenant_id) para FKs compuestas'
  Indexes {
    (tenant_id, id) [unique, name: 'idx_users_id_tenant_unique']
    (tenant_id, email_normalized) [unique, name: 'idx_users_email_unique']
    (tenant_id, status) [name: 'idx_users_status']
  }
}

Table password_credentials {
  id uuid [pk, note: 'origen=identity_claims; evidencia=pwd:create; // "a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890"']
  tenant_id uuid [not null, note: 'origen=identity_claims; evidencia=tenant:id; // "4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10"']
  user_id uuid [not null, note: 'origen=identity_claims; evidencia=user:id; // "9f0a1c22-7bcd-4b90-a111-55aa22bbcc33"']
  password_hash text [not null, note: 'origen=identity_claims; evidencia=hash:argon2id; // "$argon2id$v=19$m=65536,t=3,p=4$..."']
  updated_at timestamptz [note: 'origen=identity_claims; evidencia=event:update; // "2025-10-04T10:12:05Z"']
  created_at timestamptz [note: 'origen=identity_claims; evidencia=event:create; // "2025-10-04T10:12:05Z"']
  deleted_at timestamptz [note: 'origen=identity_claims; evidencia=event:delete; // "null"']

  Note: 'Una credencial de password por usuario'
  Indexes {
    (tenant_id, user_id) [unique, name: 'idx_pwd_user_unique']
  }
}

Table webauthn_credentials {
  id uuid [pk, note: 'origen=identity_claims; evidencia=webauthn:create; // "b2c3d4e5-f6a7-8901-b2c3-d4e5f6a78901"']
  tenant_id uuid [not null, note: 'origen=identity_claims; evidencia=tenant:id; // "4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10"']
  user_id uuid [not null, note: 'origen=identity_claims; evidencia=user:id; // "9f0a1c22-7bcd-4b90-a111-55aa22bbcc33"']
  credential_id bytea [not null, note: 'origen=webauthn; evidencia=attestation; // "<bytea>"']
  public_key bytea [not null, note: 'origen=webauthn; evidencia=attestation; // "<bytea>"']
  sign_count bigint [not null, default: 0, note: 'origen=webauthn; evidencia=assertion; // "0"']
  rp_id text [not null, note: 'origen=webauthn; evidencia=rp; // "smartedify.app"']
  origin text [not null, note: 'origen=webauthn; evidencia=origin; // "https://smartedify.app"']
  aaguid bytea [note: 'origen=webauthn; evidencia=attestation; // "<bytea>"']
  attestation_fmt text [note: 'origen=webauthn; evidencia=fmt; // "fido-u2f"']
  transports text [note: 'origen=webauthn; evidencia=transports; // "["usb","nfc"]"']
  backup_eligible bool [note: 'origen=webauthn; evidencia=backup; // "true"']
  backup_state text [note: 'origen=webauthn; evidencia=backup; // "unavailable"']
  cred_protect text [note: 'origen=webauthn; evidencia=protection; // "userVerificationOptional"']
  last_used_at timestamptz [note: 'origen=webauthn; evidencia=assertion; // "null"']
  created_at timestamptz [note: 'origen=identity_claims; evidencia=event:create; // "2025-10-04T10:12:10Z"']
  deleted_at timestamptz [note: 'origen=identity_claims; evidencia=event:delete; // "null"']

  Note: 'UNIQUE (tenant_id, user_id, credential_id)'
  Indexes {
    (tenant_id, user_id, credential_id) [unique, name: 'idx_wa_user_cred_unique']
  }
}

Table mfa_factors {
  id uuid [pk, note: 'origen=identity_claims; evidencia=mfa:create; // "c3d4e5f6-a7b8-9012-c3d4-e5f6a7b89012"']
  tenant_id uuid [not null, note: 'origen=identity_claims; evidencia=tenant:id; // "4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10"']
  user_id uuid [not null, note: 'origen=identity_claims; evidencia=user:id; // "9f0a1c22-7bcd-4b90-a111-55aa22bbcc33"']
  type text [not null, note: 'origen=identity_claims; evidencia=mfa:type; // "TOTP"']
  label text [note: 'origen=identity_claims; evidencia=mfa:label; // "Authenticator App"']
  enabled bool [not null, default: true, note: 'origen=identity_claims; evidencia=mfa:enabled; // "true"']
  created_at timestamptz [note: 'origen=identity_claims; evidencia=event:create; // "2025-10-04T10:12:15Z"']
  disabled_at timestamptz [note: 'origen=identity_claims; evidencia=event:disable; // "null"']
  deleted_at timestamptz [note: 'origen=identity_claims; evidencia=event:delete; // "null"']

  Indexes {
    (tenant_id, user_id, type) [name: 'idx_mfa_user_type']
  }
}

Table totp_secrets {
  id uuid [pk, note: 'origen=identity_claims; evidencia=totp:create; // "d4e5f6a7-b8c9-0123-d4e5-f6a7b8c90123"']
  tenant_id uuid [not null, note: 'origen=identity_claims; evidencia=tenant:id; // "4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10"']
  user_id uuid [not null, note: 'origen=identity_claims; evidencia=user:id; // "9f0a1c22-7bcd-4b90-a111-55aa22bbcc33"']
  secret_enc bytea [not null, note: 'origen=identity_claims; evidencia=secret:cipher; // "<bytea>"']
  issuer text [note: 'origen=identity_claims; evidencia=totp:issuer; // "SmartEdify"']
  label text [note: 'origen=identity_claims; evidencia=totp:label; // "user@example.com"']
  verified_at timestamptz [note: 'origen=identity_claims; evidencia=totp:verified; // "2025-10-04T10:12:20Z"']
  created_at timestamptz [note: 'origen=identity_claims; evidencia=event:create; // "2025-10-04T10:12:20Z"']
  deleted_at timestamptz [note: 'origen=identity_claims; evidencia=event:delete; // "null"']

  Indexes {
    (tenant_id, user_id) [unique, name: 'idx_totp_user_unique']
  }
}

Table email_verification_tokens {
  id uuid [pk, note: 'origen=identity_claims; evidencia=token:create; // "e5f6a7b8-c9d0-1234-e5f6-a7b8c9d01234"']
  tenant_id uuid [not null, note: 'origen=identity_claims; evidencia=tenant:id; // "4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10"']
  user_id uuid [not null, note: 'origen=identity_claims; evidencia=user:id; // "9f0a1c22-7bcd-4b90-a111-55aa22bbcc33"']
  email text [not null, note: 'origen=identity_claims; evidencia=email; // "user@example.com"']
  token_hash text [not null, note: 'origen=identity_claims; evidencia=hash:sha256; // "a1b2c3..."']
  expires_at timestamptz [not null, note: 'origen=identity_claims; evidencia=ttl; // "2025-10-04T10:22:00Z"']
  used_at timestamptz [note: 'origen=identity_claims; evidencia=event:use; // "null"']
  created_at timestamptz [note: 'origen=identity_claims; evidencia=event:create; // "2025-10-04T10:12:30Z"']
  deleted_at timestamptz [note: 'origen=identity_claims; evidencia=event:delete; // "null"']

  Indexes {
    (tenant_id, user_id) [name: 'idx_evt_user']
    (tenant_id, token_hash) [unique, name: 'idx_evt_token_unique']
  }
}

Table sms_codes {
  id uuid [pk, note: 'origen=identity_claims; evidencia=sms:create; // "f6a7b8c9-d0e1-2345-f6a7-b8c9d0e12345"']
  tenant_id uuid [not null, note: 'origen=identity_claims; evidencia=tenant:id; // "4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10"']
  user_id uuid [not null, note: 'origen=identity_claims; evidencia=user:id; // "9f0a1c22-7bcd-4b90-a111-55aa22bbcc33"']
  phone text [not null, note: 'origen=identity_claims; evidencia=phone; // "+51987654321"']
  code_hash text [not null, note: 'origen=identity_claims; evidencia=hash:sha256; // "b2c3d4..."']
  expires_at timestamptz [not null, note: 'origen=identity_claims; evidencia=ttl; // "2025-10-04T10:17:00Z"']
  used_at timestamptz [note: 'origen=identity_claims; evidencia=event:use; // "null"']
  created_at timestamptz [note: 'origen=identity_claims; evidencia=event:create; // "2025-10-04T10:12:35Z"']
  deleted_at timestamptz [note: 'origen=identity_claims; evidencia=event:delete; // "null"']

  Indexes {
    (tenant_id, user_id) [name: 'idx_sms_user']
    (tenant_id, phone) [name: 'idx_sms_phone']
  }
}

Table oauth_clients {
  id uuid [pk, note: 'origen=identity_claims; evidencia=client:create; // "07b8c9d0-e1f2-3456-07b8-c9d0e1f23456"']
  tenant_id uuid [not null, note: 'origen=governance_event; evidencia=acta-2025-001; // "4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10"']
  client_id text [not null, note: 'origen=identity_claims; evidencia=client:id; // "web-app-prod"']
  client_type client_type [not null, note: 'origen=identity_claims; evidencia=client:type; // "CONFIDENTIAL"']
  name text [not null, note: 'origen=identity_claims; evidencia=client:name; // "SmartEdify Web App"']
  redirect_uris jsonb [not null, note: 'origen=identity_claims; evidencia=client:uris; // "["https://app.smartedify.com/callback"]"']
  allowed_scopes jsonb [not null, note: 'origen=identity_claims; evidencia=client:scopes; // "["openid","profile","email"]"']
  allowed_grant_types jsonb [not null, note: 'origen=identity_claims; evidencia=client:grants; // "["authorization_code","refresh_token"]"']
  jwks_uri text [note: 'origen=identity_claims; evidencia=client:jwks_uri; // "https://jwks.smartedify.com/keys"']
  jwks jsonb [note: 'origen=identity_claims; evidencia=client:jwks; // "{"keys":[]}"']
  token_endpoint_auth_method text [note: 'origen=identity_claims; evidencia=client:auth; // "client_secret_basic"']
  created_at timestamptz [note: 'origen=identity_claims; evidencia=event:create; // "2025-10-04T10:12:40Z"']
  updated_at timestamptz [note: 'origen=identity_claims; evidencia=event:update; // "2025-10-04T10:12:40Z"']
  deleted_at timestamptz [note: 'origen=identity_claims; evidencia=event:delete; // "null"']

  Note: 'UNIQUE (tenant_id, client_id) y UNIQUE (id, tenant_id) para FKs compuestas'
  Indexes {
    (tenant_id, client_id) [unique, name: 'idx_clients_client_id_unique']
    (id, tenant_id) [unique, name: 'idx_clients_id_tenant_unique'] // 🔑 CORREGIDO: requerido para FK compuesta
  }
}

Table oauth_client_secrets {
  id uuid [pk, note: 'origen=identity_claims; evidencia=secret:create; // "18c9d0e1-f2a3-4567-18c9-d0e1f2a34567"']
  tenant_id uuid [not null, note: 'origen=identity_claims; evidencia=tenant:id; // "4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10"']
  client_id uuid [not null, note: 'origen=identity_claims; evidencia=client:id; // "07b8c9d0-e1f2-3456-07b8-c9d0e1f23456"']
  secret_hash text [not null, note: 'origen=identity_claims; evidencia=hash:sha256; // "c3d4e5..."']
  created_at timestamptz [note: 'origen=identity_claims; evidencia=event:create; // "2025-10-04T10:12:45Z"']
  expires_at timestamptz [note: 'origen=identity_claims; evidencia=secret:ttl; // "2026-10-04T10:12:45Z"']
  revoked_at timestamptz [note: 'origen=identity_claims; evidencia=event:revoke; // "null"']
  deleted_at timestamptz [note: 'origen=identity_claims; evidencia=event:delete; // "null"']

  Indexes {
    (tenant_id, client_id, secret_hash) [unique, name: 'idx_client_secret_unique']
  }
}

Table oauth_authorization_codes {
  id uuid [pk, note: 'origen=oauth; evidencia=code:create; // "29d0e1f2-a3b4-5678-29d0-e1f2a3b45678"']
  tenant_id uuid [not null, note: 'origen=oauth; evidencia=tenant:id; // "4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10"']
  code_hash text [not null, note: 'origen=oauth; evidencia=hash:sha256; // "d4e5f6..."']
  user_id uuid [not null, note: 'origen=oauth; evidencia=user:id; // "9f0a1c22-7bcd-4b90-a111-55aa22bbcc33"']
  client_id uuid [not null, note: 'origen=oauth; evidencia=client:id; // "07b8c9d0-e1f2-3456-07b8-c9d0e1f23456"']
  scope text [not null, note: 'origen=oauth; evidencia=scope; // "openid profile email"']
  redirect_uri text [note: 'origen=oauth; evidencia=uri; // "https://app.smartedify.com/callback"']
  code_challenge text [note: 'origen=oauth; evidencia=pkce; // "e5f6a7..."']
  code_challenge_method text [note: 'origen=oauth; evidencia=pkce; // "S256"']
  device_id text [note: 'origen=oauth; evidencia=device; // "web-chrome-win11"']
  issued_at timestamptz [note: 'origen=oauth; evidencia=event:issue; // "2025-10-04T10:12:50Z"']
  expires_at timestamptz [not null, note: 'origen=oauth; evidencia=ttl; // "2025-10-04T10:17:50Z"']
  consumed_at timestamptz [note: 'origen=oauth; evidencia=event:consume; // "null"']
  deleted_at timestamptz [note: 'origen=oauth; evidencia=event:delete; // "null"']

  Indexes {
    (tenant_id, code_hash) [unique, name: 'idx_oac_code_unique']
    (tenant_id, client_id) [name: 'idx_oac_client']
    (tenant_id, user_id) [name: 'idx_oac_user']
  }
}

Table refresh_tokens {
  id uuid [pk, note: 'origen=oauth; evidencia=rt:create; // "3ae1f2a3-b4c5-6789-3ae1-f2a3b4c56789"']
  tenant_id uuid [not null, note: 'origen=oauth; evidencia=tenant:id; // "4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10"']
  token_hash text [not null, note: 'origen=oauth; evidencia=hash:sha256; // "f6a7b8..."']
  user_id uuid [not null, note: 'origen=oauth; evidencia=user:id; // "9f0a1c22-7bcd-4b90-a111-55aa22bbcc33"']
  jkt text [not null, note: 'origen=oauth; evidencia=dpop:jkt; // "sha256~abc123..."']
  family_id uuid [not null, note: 'origen=oauth; evidencia=rt:family; // "3ae1f2a3-b4c5-6789-3ae1-f2a3b4c56789"']
  parent_id uuid [note: 'origen=oauth; evidencia=rt:parent; // "null"']
  replaced_by_id uuid [note: 'origen=oauth; evidencia=rt:replaced; // "null"']
  used_at timestamptz [note: 'origen=oauth; evidencia=event:use; // "null"']
  client_id uuid [not null, note: 'origen=oauth; evidencia=client:id; // "07b8c9d0-e1f2-3456-07b8-c9d0e1f23456"']
  device_id text [not null, note: 'origen=oauth; evidencia=device; // "web-chrome-win11"']
  session_id uuid [not null, note: 'origen=oauth; evidencia=session:id; // "4bf2a3b4-c5d6-7890-4bf2-a3b4c5d67890"']
  scope text [not null, note: 'origen=oauth; evidencia=scope; // "openid profile email offline_access"']
  expires_at timestamptz [not null, note: 'origen=oauth; evidencia=ttl; // "2025-11-03T10:12:55Z"']
  created_ip text [note: 'origen=oauth; evidencia=ip; // "192.0.2.1"']
  created_ua text [note: 'origen=oauth; evidencia=ua; // "Mozilla/5.0 ..."']
  revoked bool [not null, default: false, note: 'origen=oauth; evidencia=revoked; // "false"']
  revoked_reason text [note: 'origen=oauth; evidencia=reason; // "null"']
  created_at timestamptz [note: 'origen=oauth; evidencia=event:create; // "2025-10-04T10:12:55Z"']
  deleted_at timestamptz [note: 'origen=oauth; evidencia=event:delete; // "null"']

  Indexes {
    (tenant_id, token_hash) [unique, name: 'idx_rt_token_unique']
    (tenant_id, user_id) [name: 'idx_rt_user']
    (tenant_id, client_id) [name: 'idx_rt_client']
    (tenant_id, session_id) [name: 'idx_rt_session']
    (tenant_id, family_id) [name: 'idx_rt_family']
    (tenant_id, parent_id) [name: 'idx_rt_parent']
  }
}

Table sessions {
  id uuid [pk, note: 'origen=oauth; evidencia=session:create; // "4bf2a3b4-c5d6-7890-4bf2-a3b4c5d67890"']
  tenant_id uuid [not null, note: 'origen=oauth; evidencia=tenant:id; // "4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10"']
  user_id uuid [not null, note: 'origen=oauth; evidencia=user:id; // "9f0a1c22-7bcd-4b90-a111-55aa22bbcc33"']
  device_id text [not null, note: 'origen=oauth; evidencia=device; // "web-chrome-win11"']
  cnf_jkt text [not null, note: 'origen=oauth; evidencia=dpop:jkt; // "sha256~abc123..."']
  issued_at timestamptz [note: 'origen=oauth; evidencia=event:issue; // "2025-10-04T10:13:00Z"']
  not_after timestamptz [note: 'origen=oauth; evidencia=ttl; // "2025-10-05T10:13:00Z"']
  revoked_at timestamptz [note: 'origen=oauth; evidencia=event:revoke; // "null"']
  version int [not null, default: 1, note: 'origen=oauth; evidencia=version; // "1"']
  created_at timestamptz [note: 'origen=oauth; evidencia=event:create; // "2025-10-04T10:13:00Z"']
  deleted_at timestamptz [note: 'origen=oauth; evidencia=event:delete; // "null"']

  Indexes {
    (tenant_id, user_id) [name: 'idx_sessions_user']
    (tenant_id, device_id) [name: 'idx_sessions_device']
  }
}

Table consent_audits {
  id uuid [pk, note: 'origen=consent; evidencia=audit:create; // "5c03b4c5-d6e7-8901-5c03-b4c5d6e78901"']
  tenant_id uuid [not null, note: 'origen=consent; evidencia=tenant:id; // "4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10"']
  user_id uuid [not null, note: 'origen=consent; evidencia=user:id; // "9f0a1c22-7bcd-4b90-a111-55aa22bbcc33"']
  consent_type text [not null, note: 'origen=consent; evidencia=type; // "marketing_email"']
  consent_granted bool [not null, note: 'origen=consent; evidencia=granted; // "true"']
  granted_at timestamptz [note: 'origen=consent; evidencia=event:grant; // "2025-10-04T10:13:05Z"']
  ip_address text [note: 'origen=consent; evidencia=ip; // "192.0.2.1"']
  user_agent text [note: 'origen=consent; evidencia=ua; // "Mozilla/5.0 ..."']
  policy_version text [note: 'origen=consent; evidencia=version; // "v1.2"']
  purpose text [note: 'origen=consent; evidencia=purpose; // "Envío de novedades del producto"']
  country_code text [note: 'origen=consent; evidencia=country; // "PE"']
  evidence_ref text [note: 'origen=consent; evidencia=ref; // "consent-9f0a1c22"']

  Indexes {
    (tenant_id, user_id, consent_type) [name: 'idx_consent_user_type']
    (tenant_id, granted_at) [name: 'idx_consent_time']
  }
}

Table revocation_events {
  id uuid [pk, note: 'origen=revocation; evidencia=event:create; // "6d14c5d6-e7f8-9012-6d14-c5d6e7f89012"']
  tenant_id uuid [not null, note: 'origen=revocation; evidencia=tenant:id; // "4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10"']
  type text [not null, note: 'origen=revocation; evidencia=type; // "USER"']
  subject uuid [not null, note: 'origen=revocation; evidencia=subject; // "9f0a1c22-7bcd-4b90-a111-55aa22bbcc33"']
  session_id uuid [note: 'origen=revocation; evidencia=session; // "4bf2a3b4-c5d6-7890-4bf2-a3b4c5d67890"']
  jti text [note: 'origen=revocation; evidencia=jti; // "3ae1f2a3-b4c5-6789-3ae1-f2a3b4c56789"']
  not_before timestamptz [not null, note: 'origen=revocation; evidencia=nbf; // "2025-10-04T10:13:10Z"']
  created_at timestamptz [note: 'origen=revocation; evidencia=event:create; // "2025-10-04T10:13:10Z"']
  deleted_at timestamptz [note: 'origen=revocation; evidencia=event:delete; // "null"']

  Indexes {
    (tenant_id, type, subject, not_before) [name: 'idx_rev_subject']
    (tenant_id, jti) [name: 'idx_rev_jti']
    (tenant_id, session_id) [name: 'idx_rev_session']
  }
}

/* Relaciones compuestas multi-tenant */
Ref: password_credentials.(user_id, tenant_id) > users.(id, tenant_id)
Ref: webauthn_credentials.(user_id, tenant_id) > users.(id, tenant_id)
Ref: mfa_factors.(user_id, tenant_id) > users.(id, tenant_id)
Ref: totp_secrets.(user_id, tenant_id) > users.(id, tenant_id)
Ref: email_verification_tokens.(user_id, tenant_id) > users.(id, tenant_id)
Ref: sms_codes.(user_id, tenant_id) > users.(id, tenant_id)
Ref: oauth_client_secrets.(client_id, tenant_id) > oauth_clients.(id, tenant_id)
Ref: oauth_authorization_codes.(client_id, tenant_id) > oauth_clients.(id, tenant_id)
Ref: oauth_authorization_codes.(user_id, tenant_id) > users.(id, tenant_id)
Ref: refresh_tokens.(user_id, tenant_id) > users.(id, tenant_id)
Ref: refresh_tokens.(client_id, tenant_id) > oauth_clients.(id, tenant_id)
Ref: sessions.(user_id, tenant_id) > users.(id, tenant_id)
Ref: consent_audits.(user_id, tenant_id) > users.(id, tenant_id)
Ref: revocation_events.(session_id, tenant_id) > sessions.(id, tenant_id)
Ref: refresh_tokens.(parent_id, tenant_id) > refresh_tokens.(id, tenant_id)
Ref: refresh_tokens.(replaced_by_id, tenant_id) > refresh_tokens.(id, tenant_id)

/*
 * ==============================================================================
 * MOCKUP DE DATOS REALES (para QA / staging)
 * ==============================================================================
 *
 * tenant_id: 4f8f9b2e-9f9e-4e7e-9c4d-2c3a1b6f2a10a
 * user_id: 9f0a1c22-7bcd-4b90-a111-55aa22bbcc33
 * client_id: 07b8c9d0-e1f2-3456-07b8-c9d0e1f23456
 *
 * ==============================================================================
 */