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
  ManyToOne,
  JoinColumns,
} from 'typeorm';
import { User } from './user.entity';
import { Session } from './session.entity';

@Entity({ name: 'refresh_tokens' })
@Unique('uq_refresh_tokens_id_per_tenant', ['tenantId', 'id'])
@Unique('uq_refresh_tokens_jti_per_tenant', ['tenantId', 'jti'])
@Check(`"expires_at" > "created_at"`)
@Index('idx_rt_tenant', ['tenantId'])
@Index('idx_rt_user', ['tenantId', 'userId'])
@Index('idx_rt_session', ['tenantId', 'sessionId'])
@Index('idx_rt_family_active', ['tenantId', 'familyId', 'usedAt'], {
  where: 'revoked = false AND expires_at > now()',
})
@Index('idx_rt_active_by_user', ['tenantId', 'userId', 'expiresAt'], {
  where: 'revoked = false AND used_at IS NULL AND expires_at > now()',
})
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column('uuid', { name: 'tenant_id' })
  tenantId!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('uuid', { name: 'session_id' })
  sessionId!: string;

  // Agrupa una familia de rotación
  @Column('uuid', { name: 'family_id' })
  familyId!: string;

  // Árbol de rotación
  @Column('uuid', { name: 'parent_id', nullable: true })
  parentId?: string | null;

  @Column('uuid', { name: 'replaced_by_id', nullable: true })
  replacedById?: string | null;

  // Identificadores criptográficos
  @Column('text', { name: 'jti' })
  jti!: string;

  @Column('text', { name: 'kid', nullable: true })
  kid?: string | null;

  // DPoP cnf thumbprint (jkt)
  @Column('text', { name: 'cnf_jkt', nullable: true })
  cnfJkt?: string | null;

  // Contexto del cliente
  @Column('text', { name: 'device_id', nullable: true })
  deviceId?: string | null;

  @Column('inet', { name: 'ip', nullable: true })
  ip?: string | null;

  @Column('text', { name: 'user_agent', nullable: true })
  userAgent?: string | null;

  // Ciclo de vida
  @Column('timestamptz', { name: 'used_at', nullable: true })
  usedAt?: Date | null;

  @Column('boolean', { name: 'revoked', default: false })
  revoked!: boolean;

  @Column('timestamptz', { name: 'revoked_at', nullable: true })
  revokedAt?: Date | null;

  @Column('text', { name: 'revoked_reason', nullable: true })
  revokedReason?: string | null;

  @Column('timestamptz', { name: 'expires_at' })
  expiresAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  // FK compuesta: (user_id, tenant_id) → users(id, tenant_id)
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumns([
    { name: 'user_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  user!: User;

  // FK compuesta: (session_id, tenant_id) → sessions(id, tenant_id)
  @ManyToOne(() => Session, { onDelete: 'RESTRICT' })
  @JoinColumns([
    { name: 'session_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  session!: Session;

  // Self-FK compuesta: (parent_id, tenant_id) → refresh_tokens(id, tenant_id)
  @ManyToOne(() => RefreshToken, { onDelete: 'SET NULL' })
  @JoinColumns([
    { name: 'parent_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  parent?: RefreshToken | null;

  // Self-FK compuesta: (replaced_by_id, tenant_id) → refresh_tokens(id, tenant_id)
  @ManyToOne(() => RefreshToken, { onDelete: 'SET NULL' })
  @JoinColumns([
    { name: 'replaced_by_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  replacedBy?: RefreshToken | null;
}

/**
 * Notas de migración SQL:
 *
 * -- RLS obligatorio:
 * ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY rls_refresh_tokens ON refresh_tokens
 *   FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid)
 *   WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
 *
 * -- FKs compuestas:
 * ALTER TABLE refresh_tokens
 *   ADD CONSTRAINT fk_rt_users
 *     FOREIGN KEY (user_id, tenant_id) REFERENCES users(id, tenant_id),
 *   ADD CONSTRAINT fk_rt_sessions
 *     FOREIGN KEY (session_id, tenant_id) REFERENCES sessions(id, tenant_id),
 *   ADD CONSTRAINT fk_rt_parent
 *     FOREIGN KEY (parent_id, tenant_id) REFERENCES refresh_tokens(id, tenant_id),
 *   ADD CONSTRAINT fk_rt_replaced_by
 *     FOREIGN KEY (replaced_by_id, tenant_id) REFERENCES refresh_tokens(id, tenant_id);
 *
 * -- Índices parciales (si no se usan decorators con "where"):
 * CREATE INDEX IF NOT EXISTS idx_rt_family_active
 *   ON refresh_tokens (tenant_id, family_id, used_at)
 *   WHERE revoked = false AND expires_at > now();
 * CREATE INDEX IF NOT EXISTS idx_rt_active_by_user
 *   ON refresh_tokens (tenant_id, user_id, expires_at)
 *   WHERE revoked = false AND used_at IS NULL AND expires_at > now();
 */
