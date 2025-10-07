import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  Unique,
  Check,
} from 'typeorm';

export enum PreferredLogin {
  PASSWORD = 'PASSWORD',
  OIDC = 'OIDC',
}

export enum MfaMethod {
  NONE = 'NONE',
  TOTP = 'TOTP',
}

@Entity({ name: 'users' })
@Unique('uq_users_id_per_tenant', ['tenantId', 'id'])
@Unique('uq_users_username_per_tenant', ['tenantId', 'username'])
@Unique('uq_users_email_ci_per_tenant', ['tenantId', 'email']) // requiere EXTENSION citext en PostgreSQL
@Check(`("preferred_login" <> 'PASSWORD') OR ("password_hash" IS NOT NULL)`)
@Check(`("mfa_method" <> 'TOTP') OR ("mfa_secret" IS NOT NULL)`)
@Index('idx_users_tenant', ['tenantId'])
@Index('idx_users_last_login', ['tenantId', 'lastLoginAt'])
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column('uuid', { name: 'tenant_id' })
  tenantId!: string;

  @Column('text', { name: 'username', length: 64 })
  username!: string;

  // Usar migración para: CREATE EXTENSION IF NOT EXISTS citext;
  @Column('citext', { name: 'email' })
  email!: string;

  // Nulo si preferred_login <> PASSWORD
  @Column('text', { name: 'password_hash', nullable: true, select: false })
  passwordHash?: string | null;

  @Column('enum', {
    name: 'preferred_login',
    enum: PreferredLogin,
    default: PreferredLogin.PASSWORD,
  })
  preferredLogin!: PreferredLogin;

  @Column('enum', {
    name: 'mfa_method',
    enum: MfaMethod,
    default: MfaMethod.NONE,
  })
  mfaMethod!: MfaMethod;

  // Requerido cuando mfa_method = TOTP
  @Column('text', { name: 'mfa_secret', nullable: true, select: false })
  mfaSecret?: string | null;

  @Column('timestamptz', { name: 'email_verified_at', nullable: true })
  emailVerifiedAt?: Date | null;

  @Column('timestamptz', { name: 'last_login_at', nullable: true })
  lastLoginAt?: Date | null;

  @Column('timestamptz', { name: 'locked_at', nullable: true })
  lockedAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // Soft delete opcional según dominio
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}

/**
 * Notas de migración requeridas para cumplir el estándar:
 *
 * 1) Extensión para email case-insensitive:
 *    CREATE EXTENSION IF NOT EXISTS citext;
 *
 * 2) Índice funcional recomendado para búsquedas por email:
 *    CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_ci_per_tenant
 *      ON users (tenant_id, email);
 *
 * 3) Endurecimiento de consultas frecuentes:
 *    CREATE INDEX IF NOT EXISTS idx_users_active
 *      ON users (tenant_id, locked_at);
 *
 * 4) RLS se gestiona a nivel de BD (políticas USING/WITH CHECK por tenant_id).
 */
