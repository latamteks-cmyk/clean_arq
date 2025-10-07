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
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'sessions' })
@Unique('uq_sessions_id_per_tenant', ['tenantId', 'id'])
@Check(`"not_after" > "issued_at"`)
@Check(`"not_before" <= "not_after"`)
@Index('idx_sessions_tenant', ['tenantId'])
@Index('idx_sessions_tenant_user', ['tenantId', 'userId'])
export class Session {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column('uuid', { name: 'tenant_id' })
  tenantId!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  // DPoP/JWT cnf thumbprint (jkt). Opcional.
  @Column('text', { name: 'cnf_jkt', nullable: true })
  cnfJkt?: string | null;

  // Identificador opcional del dispositivo/cliente.
  @Column('text', { name: 'device_id', nullable: true })
  deviceId?: string | null;

  // Metadatos de contexto.
  @Column('inet', { name: 'ip', nullable: true })
  ip?: string | null;

  @Column('text', { name: 'user_agent', nullable: true })
  userAgent?: string | null;

  // Ventana de validez de la sesión.
  @Column('timestamptz', { name: 'issued_at', default: () => 'now()' })
  issuedAt!: Date;

  @Column('timestamptz', { name: 'not_before', default: () => 'now()' })
  notBefore!: Date;

  @Column('timestamptz', { name: 'not_after' })
  notAfter!: Date;

  // Revocación.
  @Column('timestamptz', { name: 'revoked_at', nullable: true })
  revokedAt?: Date | null;

  @Column('text', { name: 'revoked_reason', nullable: true })
  revokedReason?: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // Soft delete opcional.
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  // FK compuesta por tenant: (user_id, tenant_id) → users(id, tenant_id)
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumns([
    { name: 'user_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  @JoinColumn()
  user!: User;
}

/**
 * Notas de migración requeridas:
 *
 * 1) RLS por tabla (en SQL):
 *    ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
 *    CREATE POLICY rls_sessions ON sessions
 *      FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid)
 *      WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
 *
 * 2) Índices operacionales:
 *    -- Activas por usuario (parcial). Crear vía SQL para control fino del predicado.
 *    CREATE INDEX IF NOT EXISTS idx_sessions_active_by_user
 *      ON sessions (tenant_id, user_id, not_after)
 *      WHERE revoked_at IS NULL;
 *
 * 3) Integridad temporal ya cubierta por CHECKs:
 *    -- "not_after" > "issued_at" y "not_before" <= "not_after".
 *
 * 4) Consultas comunes:
 *    CREATE INDEX IF NOT EXISTS idx_sessions_revoked_at
 *      ON sessions (tenant_id, revoked_at);
 *
 * 5) Alineación multi-tenant:
 *    -- FK compuesta ya definida en el modelo; verificar que la migración genere:
 *    -- ALTER TABLE sessions
 *    --   ADD CONSTRAINT fk_sessions_users
 *    --   FOREIGN KEY (user_id, tenant_id) REFERENCES users(id, tenant_id);
 */
