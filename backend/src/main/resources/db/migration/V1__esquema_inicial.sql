-- =====================================================================
-- V1 · Esquema inicial de la base de datos de Sonrisa
-- =====================================================================

CREATE TABLE roles (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(30)  NOT NULL UNIQUE,
    descripcion VARCHAR(255) NOT NULL
) ENGINE = InnoDB;

CREATE TABLE usuarios (
    id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre                 VARCHAR(80)  NOT NULL,
    apellidos              VARCHAR(120) NOT NULL,
    email                  VARCHAR(150) NOT NULL UNIQUE,
    password_hash          VARCHAR(100) NULL,
    telefono               VARCHAR(20)  NULL,
    avatar_url             VARCHAR(500) NULL,
    proveedor              VARCHAR(20)  NOT NULL DEFAULT 'LOCAL',
    proveedor_id           VARCHAR(100) NULL,
    activo                 BOOLEAN      NOT NULL DEFAULT TRUE,
    debe_cambiar_password  BOOLEAN      NOT NULL DEFAULT FALSE,
    creado_en              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- Relación muchos a muchos: usuarios <-> roles
CREATE TABLE usuario_roles (
    usuario_id BIGINT NOT NULL,
    rol_id     BIGINT NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    CONSTRAINT fk_usuario_roles_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_roles_rol     FOREIGN KEY (rol_id)     REFERENCES roles (id)
) ENGINE = InnoDB;

CREATE TABLE pacientes (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id         BIGINT       NOT NULL UNIQUE,
    fecha_nacimiento   DATE         NULL,
    alergias           VARCHAR(255) NULL,
    antecedentes       TEXT         NULL,
    contacto_emergencia VARCHAR(150) NULL,
    CONSTRAINT fk_pacientes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE dentistas (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id          BIGINT       NOT NULL UNIQUE,
    especialidad        VARCHAR(100) NOT NULL,
    cedula_profesional  VARCHAR(20)  NOT NULL UNIQUE,
    consultorio         VARCHAR(50)  NOT NULL,
    hora_inicio         TIME         NOT NULL DEFAULT '09:00:00',
    hora_fin            TIME         NOT NULL DEFAULT '19:00:00',
    CONSTRAINT fk_dentistas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE tratamientos (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(100)  NOT NULL UNIQUE,
    descripcion   VARCHAR(255)  NOT NULL,
    duracion_min  INT           NOT NULL,
    precio        DECIMAL(10,2) NOT NULL,
    activo        BOOLEAN       NOT NULL DEFAULT TRUE
) ENGINE = InnoDB;

CREATE TABLE citas (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    paciente_id  BIGINT       NOT NULL,
    dentista_id  BIGINT       NOT NULL,
    fecha_hora   DATETIME     NOT NULL,
    duracion_min INT          NOT NULL,
    estado       VARCHAR(20)  NOT NULL,
    origen       VARCHAR(20)  NOT NULL,
    motivo       VARCHAR(255) NULL,
    motivo_rechazo VARCHAR(255) NULL,
    creado_por   BIGINT       NULL,
    creado_en    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_citas_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes (id) ON DELETE CASCADE,
    CONSTRAINT fk_citas_dentista FOREIGN KEY (dentista_id) REFERENCES dentistas (id),
    CONSTRAINT fk_citas_creador  FOREIGN KEY (creado_por)  REFERENCES usuarios (id) ON DELETE SET NULL,
    INDEX idx_citas_fecha (fecha_hora),
    INDEX idx_citas_estado (estado)
) ENGINE = InnoDB;

-- Relación muchos a muchos: citas <-> tratamientos
CREATE TABLE cita_tratamientos (
    cita_id        BIGINT NOT NULL,
    tratamiento_id BIGINT NOT NULL,
    PRIMARY KEY (cita_id, tratamiento_id),
    CONSTRAINT fk_cita_trat_cita        FOREIGN KEY (cita_id)        REFERENCES citas (id) ON DELETE CASCADE,
    CONSTRAINT fk_cita_trat_tratamiento FOREIGN KEY (tratamiento_id) REFERENCES tratamientos (id)
) ENGINE = InnoDB;

-- Notas de evolución del expediente (NOM-004-SSA3-2012). No se eliminan.
CREATE TABLE notas_evolucion (
    id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    paciente_id            BIGINT       NOT NULL,
    dentista_id            BIGINT       NOT NULL,
    cita_id                BIGINT       NULL,
    motivo_consulta        VARCHAR(255) NOT NULL,
    diagnostico            TEXT         NOT NULL,
    tratamiento_realizado  TEXT         NOT NULL,
    pronostico             VARCHAR(255) NULL,
    indicaciones           TEXT         NULL,
    creado_en              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notas_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes (id) ON DELETE CASCADE,
    CONSTRAINT fk_notas_dentista FOREIGN KEY (dentista_id) REFERENCES dentistas (id),
    CONSTRAINT fk_notas_cita     FOREIGN KEY (cita_id)     REFERENCES citas (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- Odontograma: cada cambio de una pieza se guarda como un registro nuevo (historial)
CREATE TABLE odontograma_registros (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    paciente_id  BIGINT       NOT NULL,
    dentista_id  BIGINT       NOT NULL,
    pieza        INT          NOT NULL,
    estado       VARCHAR(20)  NOT NULL,
    observacion  VARCHAR(255) NULL,
    creado_en    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_odonto_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes (id) ON DELETE CASCADE,
    CONSTRAINT fk_odonto_dentista FOREIGN KEY (dentista_id) REFERENCES dentistas (id),
    INDEX idx_odonto_paciente_pieza (paciente_id, pieza)
) ENGINE = InnoDB;

CREATE TABLE password_reset_tokens (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT      NOT NULL,
    token      VARCHAR(80) NOT NULL UNIQUE,
    expira_en  DATETIME    NOT NULL,
    usado      BOOLEAN     NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_reset_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Tokens JWT invalidados al cerrar sesión
CREATE TABLE tokens_revocados (
    jti       VARCHAR(64) PRIMARY KEY,
    expira_en DATETIME    NOT NULL
) ENGINE = InnoDB;

-- Bitácora de correos, SMS y WhatsApp enviados
CREATE TABLE notificaciones (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT       NULL,
    cita_id    BIGINT       NULL,
    canal      VARCHAR(20)  NOT NULL,
    destino    VARCHAR(150) NOT NULL,
    asunto     VARCHAR(150) NOT NULL,
    estado     VARCHAR(20)  NOT NULL,
    error      VARCHAR(500) NULL,
    creado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL,
    CONSTRAINT fk_notif_cita    FOREIGN KEY (cita_id)    REFERENCES citas (id) ON DELETE SET NULL
) ENGINE = InnoDB;
