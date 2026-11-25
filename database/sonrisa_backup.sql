-- Respaldo de la base de datos de Sonrisa (MySQL 8)
-- Estructura completa (migraciones Flyway V1-V3) + datos de prueba del DataSeeder.
-- Fecha de referencia de los datos: 2026-11-25. Contraseñas almacenadas con BCrypt ($2a$10$).
-- Restaurar:  mysql -u root -p < database/sonrisa_backup.sql
-- Credenciales: admin@sonrisa.com / Admin#2026 · recepcion@sonrisa.com / Recep#2026 · laura.ruiz@sonrisa.com / Dentista#2026 · sofia.hernandez@example.com / Paciente#2026

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET time_zone = '-06:00';

DROP DATABASE IF EXISTS sonrisa_db;
CREATE DATABASE sonrisa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sonrisa_db;

-- ===================== V1__esquema_inicial.sql =====================
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

-- ===================== V2__catalogos.sql =====================
-- =====================================================================
-- V2 · Catálogos base: roles y tratamientos
-- (Usuarios, pacientes, dentistas y citas de prueba se cargan con
--  DataSeeder porque las contraseñas deben cifrarse con BCrypt)
-- =====================================================================

INSERT INTO roles (nombre, descripcion) VALUES
('ADMIN',         'Administrador: acceso total, gestión de usuarios y de todos los módulos'),
('RECEPCIONISTA', 'Recepción: agenda, confirma y cancela citas; registra pacientes'),
('DENTISTA',      'Dentista: consulta su agenda y gestiona el expediente clínico'),
('PACIENTE',      'Paciente: agenda y consulta únicamente sus propias citas e historial');

INSERT INTO tratamientos (nombre, descripcion, duracion_min, precio, activo) VALUES
('Consulta de valoración', 'Revisión general, diagnóstico y plan de tratamiento',            30,  350.00, TRUE),
('Limpieza dental',        'Profilaxis y eliminación de sarro con ultrasonido',                 45,  600.00, TRUE),
('Resina',                 'Restauración estética de una pieza con resina compuesta',            60,  850.00, TRUE),
('Extracción simple',      'Extracción de pieza dental sin complicaciones',                      45,  900.00, TRUE),
('Extracción de tercer molar', 'Cirugía de muela del juicio',                                    90, 2800.00, TRUE),
('Endodoncia',             'Tratamiento de conductos en una pieza',                              90, 3500.00, TRUE),
('Blanqueamiento',         'Blanqueamiento dental en consultorio',                               60, 3200.00, TRUE),
('Ortodoncia: ajuste',     'Ajuste mensual de brackets',                                         30,  700.00, TRUE),
('Corona de porcelana',    'Preparación y colocación de corona',                                 90, 5500.00, TRUE),
('Aplicación de flúor',    'Aplicación tópica de flúor (prevención)',                             20,  250.00, TRUE),
('Sellador de fosetas',    'Sellado preventivo por pieza',                                       20,  300.00, TRUE),
('Guarda oclusal',         'Toma de impresión para guarda nocturna',                             40, 1800.00, FALSE);

-- ===================== V3__permisos.sql =====================
-- Catálogo de permisos y su relación N:M con roles (modelo propuesto por el equipo en el primer avance).
-- Documenta qué puede hacer cada rol; la autorización efectiva se aplica en SecurityConfig y @PreAuthorize.
CREATE TABLE permisos (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo      VARCHAR(60)  NOT NULL UNIQUE,
    descripcion VARCHAR(150) NOT NULL,
    categoria   VARCHAR(40)  NOT NULL
) ENGINE = InnoDB;

CREATE TABLE rol_permiso (
    rol_id     BIGINT NOT NULL,
    permiso_id BIGINT NOT NULL,
    PRIMARY KEY (rol_id, permiso_id),
    CONSTRAINT fk_rol_permiso_rol     FOREIGN KEY (rol_id)     REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_rol_permiso_permiso FOREIGN KEY (permiso_id) REFERENCES permisos (id) ON DELETE CASCADE
) ENGINE = InnoDB;

INSERT INTO permisos (codigo, descripcion, categoria) VALUES
('CITAS_VER_TODAS', 'Ver todas las citas de la clínica', 'CITAS'),
('CITAS_CREAR', 'Crear o reprogramar citas', 'CITAS'),
('CITAS_CONFIRMAR', 'Confirmar o rechazar solicitudes en línea', 'CITAS'),
('CITAS_CANCELAR', 'Cancelar citas', 'CITAS'),
('CITAS_ELIMINAR', 'Eliminar citas del sistema', 'CITAS'),
('CITAS_MARCAR_ATENDIDA', 'Marcar cita como atendida o no asistió', 'CITAS'),
('PACIENTES_EDITAR', 'Registrar y editar datos de pacientes', 'PACIENTES'),
('EXPEDIENTE_VER', 'Ver expediente clínico', 'PACIENTES'),
('NOTAS_ESCRIBIR', 'Escribir notas de evolución y odontograma', 'PACIENTES'),
('AGENDA_VER_PROPIAS', 'Ver solo sus propias citas', 'AGENDA'),
('HORARIOS_CONFIGURAR', 'Configurar horarios de dentistas', 'AGENDA'),
('USUARIOS_GESTIONAR', 'Gestionar usuarios y roles', 'ADMINISTRACION'),
('REPORTES_VER', 'Ver reportes e indicadores', 'ADMINISTRACION'),
('TRATAMIENTOS_CONFIGURAR', 'Configurar tratamientos y precios', 'ADMINISTRACION');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p
WHERE r.nombre = 'ADMIN' AND p.codigo IN ('CITAS_VER_TODAS','CITAS_CREAR','CITAS_CONFIRMAR','CITAS_CANCELAR','CITAS_ELIMINAR',
 'CITAS_MARCAR_ATENDIDA','PACIENTES_EDITAR','EXPEDIENTE_VER','HORARIOS_CONFIGURAR','USUARIOS_GESTIONAR','REPORTES_VER','TRATAMIENTOS_CONFIGURAR');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p
WHERE r.nombre = 'RECEPCIONISTA' AND p.codigo IN ('CITAS_VER_TODAS','CITAS_CREAR','CITAS_CONFIRMAR','CITAS_CANCELAR','CITAS_MARCAR_ATENDIDA','PACIENTES_EDITAR');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p
WHERE r.nombre = 'DENTISTA' AND p.codigo IN ('CITAS_MARCAR_ATENDIDA','EXPEDIENTE_VER','NOTAS_ESCRIBIR','AGENDA_VER_PROPIAS');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p
WHERE r.nombre = 'PACIENTE' AND p.codigo IN ('CITAS_CREAR','CITAS_CANCELAR','EXPEDIENTE_VER','AGENDA_VER_PROPIAS');

-- ===================== Historial de Flyway =====================
CREATE TABLE flyway_schema_history (
  installed_rank INT NOT NULL,
  version VARCHAR(50) DEFAULT NULL,
  description VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL,
  script VARCHAR(1000) NOT NULL,
  checksum INT DEFAULT NULL,
  installed_by VARCHAR(100) NOT NULL,
  installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  execution_time INT NOT NULL,
  success TINYINT(1) NOT NULL,
  PRIMARY KEY (installed_rank),
  KEY flyway_schema_history_s_idx (success)
) ENGINE=InnoDB;
INSERT INTO flyway_schema_history VALUES (1, '1', 'esquema inicial', 'SQL', 'V1__esquema_inicial.sql', 797750827, 'sonrisa_app', '2026-11-25 09:00:00', 120, 1);
INSERT INTO flyway_schema_history VALUES (2, '2', 'catalogos', 'SQL', 'V2__catalogos.sql', -2025746644, 'sonrisa_app', '2026-11-25 09:00:00', 120, 1);
INSERT INTO flyway_schema_history VALUES (3, '3', 'permisos', 'SQL', 'V3__permisos.sql', 1178381626, 'sonrisa_app', '2026-11-25 09:00:00', 120, 1);

-- usuarios: 18 registros
INSERT INTO usuarios (id, nombre, apellidos, email, password_hash, telefono, avatar_url, proveedor, proveedor_id, activo, debe_cambiar_password, creado_en, actualizado_en) VALUES
  (1, 'Roberto', 'Salinas Ortiz', 'admin@sonrisa.com', '$2a$10$B.6vw9pGOy61vq3MsCWG4.Td/.dDiBK0xz1L4fJx4Rz5xilzmSZ2O', '9511000001', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (2, 'María', 'González Pérez', 'recepcion@sonrisa.com', '$2a$10$7XpIb1St5F8gx/hM8p0tQeVjmn/E3wB4F6ZEVgMs2AN80C4Mr1JCi', '9511000002', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (3, 'Daniela', 'Cruz Martínez', 'recepcion2@sonrisa.com', '$2a$10$7XpIb1St5F8gx/hM8p0tQeVjmn/E3wB4F6ZEVgMs2AN80C4Mr1JCi', '9511000003', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (4, 'Laura', 'Ruiz Castillo', 'laura.ruiz@sonrisa.com', '$2a$10$DhCaxByoZNifWn7BsG/a9uOk6HnCaIpULo1z1zifjPwk/yHi4/K9y', '9511000004', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (5, 'Andrés', 'Méndez Luna', 'andres.mendez@sonrisa.com', '$2a$10$DhCaxByoZNifWn7BsG/a9uOk6HnCaIpULo1z1zifjPwk/yHi4/K9y', '9511000005', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (6, 'Patricia', 'Vásquez Reyes', 'patricia.vasquez@sonrisa.com', '$2a$10$DhCaxByoZNifWn7BsG/a9uOk6HnCaIpULo1z1zifjPwk/yHi4/K9y', '9511000006', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (7, 'Sofía', 'Hernández López', 'sofia.hernandez@example.com', '$2a$10$voDykH2McfMzLAf6NKw2meDm8W7dbamY9Vm3weFe/xz1nOqV3iFhG', '9512000001', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (8, 'Carlos', 'Ramírez Torres', 'carlos.ramirez@example.com', '$2a$10$voDykH2McfMzLAf6NKw2meDm8W7dbamY9Vm3weFe/xz1nOqV3iFhG', '9512000002', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (9, 'Valeria', 'Jiménez Ruiz', 'valeria.jimenez@example.com', NULL, '9512000003', NULL, 'GOOGLE', 'google-9', 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (10, 'Miguel', 'Santiago Cruz', 'miguel.santiago@example.com', '$2a$10$voDykH2McfMzLAf6NKw2meDm8W7dbamY9Vm3weFe/xz1nOqV3iFhG', '9512000004', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (11, 'Fernanda', 'López García', 'fernanda.lopez@example.com', NULL, '9512000005', NULL, 'FACEBOOK', 'facebook-11', 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (12, 'José', 'Martínez Aquino', 'jose.martinez@example.com', '$2a$10$voDykH2McfMzLAf6NKw2meDm8W7dbamY9Vm3weFe/xz1nOqV3iFhG', '9512000006', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (13, 'Ana', 'Morales Vásquez', 'ana.morales@example.com', '$2a$10$voDykH2McfMzLAf6NKw2meDm8W7dbamY9Vm3weFe/xz1nOqV3iFhG', '9512000007', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (14, 'Luis', 'Pérez Mendoza', 'luis.perez@example.com', NULL, '9512000008', NULL, 'GOOGLE', 'google-14', 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (15, 'Gabriela', 'Reyes Ortiz', 'gabriela.reyes@example.com', '$2a$10$voDykH2McfMzLAf6NKw2meDm8W7dbamY9Vm3weFe/xz1nOqV3iFhG', '9512000009', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (16, 'Diego', 'Castillo Díaz', 'diego.castillo@example.com', '$2a$10$voDykH2McfMzLAf6NKw2meDm8W7dbamY9Vm3weFe/xz1nOqV3iFhG', '9512000010', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (17, 'Camila', 'Vargas Sánchez', 'camila.vargas@example.com', '$2a$10$voDykH2McfMzLAf6NKw2meDm8W7dbamY9Vm3weFe/xz1nOqV3iFhG', '9512000011', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (18, 'Ricardo', 'Flores Bautista', 'ricardo.flores@example.com', NULL, '9512000012', NULL, 'LOCAL', NULL, 1, 0, '2026-11-25 09:00:00', '2026-11-25 09:00:00');

-- usuario_roles: 18 registros
INSERT INTO usuario_roles (usuario_id, rol_id) VALUES
  (1, 1),
  (2, 2),
  (3, 2),
  (4, 3),
  (5, 3),
  (6, 3),
  (7, 4),
  (8, 4),
  (9, 4),
  (10, 4),
  (11, 4),
  (12, 4),
  (13, 4),
  (14, 4),
  (15, 4),
  (16, 4),
  (17, 4),
  (18, 4);

-- dentistas: 3 registros
INSERT INTO dentistas (id, usuario_id, especialidad, cedula_profesional, consultorio, hora_inicio, hora_fin) VALUES
  (1, 4, 'Odontología general', '12345678', 'Consultorio 1', '09:00:00', '17:00:00'),
  (2, 5, 'Ortodoncia', '23456789', 'Consultorio 2', '10:00:00', '19:00:00'),
  (3, 6, 'Endodoncia', '3456789', 'Consultorio 3', '09:00:00', '15:00:00');

-- pacientes: 12 registros
INSERT INTO pacientes (id, usuario_id, fecha_nacimiento, alergias, antecedentes, contacto_emergencia) VALUES
  (1, 7, '1995-03-14', 'Penicilina', 'Sin antecedentes patológicos relevantes', 'Familiar · 9513862474'),
  (2, 8, '1988-07-02', NULL, 'Sin antecedentes patológicos relevantes', 'Familiar · 9513292914'),
  (3, 9, '2001-11-20', NULL, 'Sin antecedentes patológicos relevantes', 'Familiar · 9513938464'),
  (4, 10, '1979-01-30', 'Látex', 'Sin antecedentes patológicos relevantes', 'Familiar · 9513477946'),
  (5, 11, '1999-05-09', NULL, 'Sin antecedentes patológicos relevantes', 'Familiar · 9513885987'),
  (6, 12, '1965-09-12', 'Ibuprofeno', 'Hipertensión controlada', 'Familiar · 9513681722'),
  (7, 13, '1992-12-01', NULL, 'Sin antecedentes patológicos relevantes', 'Familiar · 9513260508'),
  (8, 14, '2004-04-18', NULL, 'Sin antecedentes patológicos relevantes', 'Familiar · 9513885590'),
  (9, 15, '1985-08-25', NULL, 'Hipertensión controlada', 'Familiar · 9513234913'),
  (10, 16, '1997-02-14', 'Lidocaína con epinefrina', 'Sin antecedentes patológicos relevantes', 'Familiar · 9513790819'),
  (11, 17, '2010-06-06', NULL, 'Sin antecedentes patológicos relevantes', 'Familiar · 9513441327'),
  (12, 18, '1972-10-10', NULL, 'Hipertensión controlada', 'Familiar · 9513208128');

-- citas: 30 registros
INSERT INTO citas (id, paciente_id, dentista_id, fecha_hora, duracion_min, estado, origen, motivo, motivo_rechazo, creado_por, creado_en, actualizado_en) VALUES
  (1, 1, 1, '2026-11-16 09:00:00', 30, 'ATENDIDA', 'EN_LINEA', 'Limpieza semestral', NULL, 7, '2026-11-13 09:00:00', '2026-11-13 09:00:00'),
  (2, 2, 2, '2026-11-16 11:30:00', 60, 'ATENDIDA', 'RECEPCION', 'Dolor en muela inferior derecha', NULL, 2, '2026-11-13 11:30:00', '2026-11-13 11:30:00'),
  (3, 3, 3, '2026-11-17 11:00:00', 30, 'ATENDIDA', 'RECEPCION', 'Revisión de brackets', NULL, 2, '2026-11-14 11:00:00', '2026-11-14 11:00:00'),
  (4, 4, 1, '2026-11-18 12:30:00', 90, 'NO_ASISTIO', 'RECEPCION', 'Sensibilidad al frío', NULL, 2, '2026-11-15 12:30:00', '2026-11-15 12:30:00'),
  (5, 5, 2, '2026-11-19 14:00:00', 90, 'CANCELADA', 'EN_LINEA', 'Valoración para blanqueamiento', NULL, 11, '2026-11-16 14:00:00', '2026-11-16 14:00:00'),
  (6, 6, 3, '2026-11-20 09:30:00', 90, 'ATENDIDA', 'RECEPCION', 'Encía inflamada', NULL, 2, '2026-11-17 09:30:00', '2026-11-17 09:30:00'),
  (7, 7, 1, '2026-11-21 10:00:00', 45, 'ATENDIDA', 'RECEPCION', 'Revisión general', NULL, 2, '2026-11-18 10:00:00', '2026-11-18 10:00:00'),
  (8, 8, 2, '2026-11-23 12:30:00', 45, 'ATENDIDA', 'RECEPCION', 'Diente fracturado', NULL, 2, '2026-11-20 12:30:00', '2026-11-20 12:30:00'),
  (9, 9, 3, '2026-11-23 12:00:00', 30, 'ATENDIDA', 'EN_LINEA', 'Limpieza semestral', NULL, 15, '2026-11-20 12:00:00', '2026-11-20 12:00:00'),
  (10, 10, 1, '2026-11-24 13:30:00', 60, 'ATENDIDA', 'RECEPCION', 'Dolor en muela inferior derecha', NULL, 2, '2026-11-21 13:30:00', '2026-11-21 13:30:00'),
  (11, 11, 2, '2026-11-25 10:00:00', 30, 'CONFIRMADA', 'RECEPCION', 'Revisión de brackets', NULL, 2, '2026-11-22 10:00:00', '2026-11-22 10:00:00'),
  (12, 12, 3, '2026-11-25 10:30:00', 30, 'CONFIRMADA', 'RECEPCION', 'Sensibilidad al frío', NULL, 2, '2026-11-22 10:30:00', '2026-11-22 10:30:00'),
  (13, 1, 1, '2026-11-25 11:00:00', 60, 'CONFIRMADA', 'EN_LINEA', 'Valoración para blanqueamiento', NULL, 7, '2026-11-22 11:00:00', '2026-11-22 11:00:00'),
  (14, 2, 2, '2026-11-26 13:30:00', 30, 'CONFIRMADA', 'RECEPCION', 'Encía inflamada', NULL, 2, '2026-11-23 13:30:00', '2026-11-23 13:30:00'),
  (15, 3, 3, '2026-11-26 13:00:00', 90, 'CONFIRMADA', 'RECEPCION', 'Revisión general', NULL, 2, '2026-11-23 13:00:00', '2026-11-23 13:00:00'),
  (16, 4, 1, '2026-11-27 09:30:00', 90, 'CONFIRMADA', 'RECEPCION', 'Diente fracturado', NULL, 2, '2026-11-24 09:30:00', '2026-11-24 09:30:00'),
  (17, 5, 2, '2026-11-27 11:00:00', 90, 'PENDIENTE', 'EN_LINEA', 'Limpieza semestral', NULL, 11, '2026-11-24 11:00:00', '2026-11-24 11:00:00'),
  (18, 6, 3, '2026-11-28 11:30:00', 45, 'CONFIRMADA', 'RECEPCION', 'Dolor en muela inferior derecha', NULL, 2, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (19, 7, 1, '2026-11-28 12:00:00', 45, 'CONFIRMADA', 'RECEPCION', 'Revisión de brackets', NULL, 2, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (20, 8, 2, '2026-11-30 14:30:00', 30, 'CONFIRMADA', 'RECEPCION', 'Sensibilidad al frío', NULL, 2, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (21, 9, 3, '2026-11-30 09:00:00', 60, 'CONFIRMADA', 'EN_LINEA', 'Valoración para blanqueamiento', NULL, 15, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (22, 10, 1, '2026-12-01 10:30:00', 30, 'CONFIRMADA', 'RECEPCION', 'Encía inflamada', NULL, 2, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (23, 11, 2, '2026-12-02 12:00:00', 30, 'CONFIRMADA', 'RECEPCION', 'Revisión general', NULL, 2, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (24, 12, 3, '2026-12-03 12:30:00', 60, 'CONFIRMADA', 'RECEPCION', 'Diente fracturado', NULL, 2, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (25, 1, 1, '2026-12-04 13:00:00', 30, 'RECHAZADA', 'EN_LINEA', 'Limpieza semestral', 'El dentista no está disponible ese día; por favor elige otra fecha', 7, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (26, 2, 2, '2026-12-05 10:30:00', 90, 'CONFIRMADA', 'RECEPCION', 'Dolor en muela inferior derecha', NULL, 2, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (27, 3, 3, '2026-11-27 10:00:00', 90, 'CONFIRMADA', 'RECEPCION', 'Revisión de brackets', NULL, 2, '2026-11-24 10:00:00', '2026-11-24 10:00:00'),
  (28, 4, 1, '2026-11-28 13:30:00', 90, 'CONFIRMADA', 'RECEPCION', 'Sensibilidad al frío', NULL, 2, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (29, 5, 2, '2026-11-30 13:00:00', 45, 'PENDIENTE', 'EN_LINEA', 'Valoración para blanqueamiento', NULL, 11, '2026-11-25 09:00:00', '2026-11-25 09:00:00'),
  (30, 6, 3, '2026-11-30 13:30:00', 45, 'CONFIRMADA', 'RECEPCION', 'Encía inflamada', NULL, 2, '2026-11-25 09:00:00', '2026-11-25 09:00:00');

-- cita_tratamientos: 30 registros
INSERT INTO cita_tratamientos (cita_id, tratamiento_id) VALUES
  (1, 10),
  (2, 7),
  (3, 1),
  (4, 9),
  (5, 6),
  (6, 5),
  (7, 4),
  (8, 2),
  (9, 8),
  (10, 3),
  (11, 11),
  (12, 10),
  (13, 7),
  (14, 1),
  (15, 9),
  (16, 6),
  (17, 5),
  (18, 4),
  (19, 2),
  (20, 8),
  (21, 3),
  (22, 11),
  (23, 10),
  (24, 7),
  (25, 1),
  (26, 9),
  (27, 6),
  (28, 5),
  (29, 4),
  (30, 2);

-- notas_evolucion: 12 registros
INSERT INTO notas_evolucion (id, paciente_id, dentista_id, cita_id, motivo_consulta, diagnostico, tratamiento_realizado, pronostico, indicaciones, creado_en) VALUES
  (1, 1, 1, 1, 'Limpieza semestral', 'Caries de esmalte en pieza 16', 'Aplicación de flúor', 'Reservado', 'Cepillado 3 veces al día, uso de hilo dental. Evitar alimentos duros por 24 h.', '2026-11-16 09:30:00'),
  (2, 2, 2, 2, 'Dolor en muela inferior derecha', 'Gingivitis leve generalizada', 'Blanqueamiento', 'Favorable', 'Cepillado 3 veces al día, uso de hilo dental. Evitar alimentos duros por 24 h.', '2026-11-16 12:30:00'),
  (3, 3, 3, 3, 'Revisión de brackets', 'Pulpitis irreversible en pieza 46', 'Consulta de valoración', 'Favorable', 'Cepillado 3 veces al día, uso de hilo dental. Evitar alimentos duros por 24 h.', '2026-11-17 11:30:00'),
  (4, 6, 3, 6, 'Encía inflamada', 'Maloclusión clase II', 'Extracción de tercer molar', 'Reservado', 'Cepillado 3 veces al día, uso de hilo dental. Evitar alimentos duros por 24 h.', '2026-11-20 11:00:00'),
  (5, 7, 1, 7, 'Revisión general', 'Sin hallazgos patológicos', 'Extracción simple', 'Favorable', 'Cepillado 3 veces al día, uso de hilo dental. Evitar alimentos duros por 24 h.', '2026-11-21 10:45:00'),
  (6, 8, 2, 8, 'Diente fracturado', 'Fractura coronal no complicada en pieza 21', 'Limpieza dental', 'Favorable', 'Cepillado 3 veces al día, uso de hilo dental. Evitar alimentos duros por 24 h.', '2026-11-23 13:15:00'),
  (7, 9, 3, 9, 'Limpieza semestral', 'Caries de esmalte en pieza 16', 'Ortodoncia: ajuste', 'Reservado', 'Cepillado 3 veces al día, uso de hilo dental. Evitar alimentos duros por 24 h.', '2026-11-23 12:30:00'),
  (8, 10, 1, 10, 'Dolor en muela inferior derecha', 'Gingivitis leve generalizada', 'Resina', 'Favorable', 'Cepillado 3 veces al día, uso de hilo dental. Evitar alimentos duros por 24 h.', '2026-11-24 14:30:00'),
  (9, 9, 3, NULL, 'Revisión general', 'Pulpitis irreversible en pieza 46', 'Exploración y diagnóstico', 'Favorable', 'Acudir a su siguiente cita programada.', '2026-11-25 09:00:00'),
  (10, 10, 1, NULL, 'Revisión general', 'Maloclusión clase II', 'Exploración y diagnóstico', 'Favorable', 'Acudir a su siguiente cita programada.', '2026-11-25 09:00:00'),
  (11, 11, 2, NULL, 'Revisión general', 'Sin hallazgos patológicos', 'Exploración y diagnóstico', 'Favorable', 'Acudir a su siguiente cita programada.', '2026-11-25 09:00:00'),
  (12, 12, 3, NULL, 'Revisión general', 'Fractura coronal no complicada en pieza 21', 'Exploración y diagnóstico', 'Favorable', 'Acudir a su siguiente cita programada.', '2026-11-25 09:00:00');

-- odontograma_registros: 15 registros
INSERT INTO odontograma_registros (id, paciente_id, dentista_id, pieza, estado, observacion, creado_en) VALUES
  (1, 1, 1, 16, 'CARIES', 'Registrado en consulta del 2026-11-16', '2026-11-16 09:00:00'),
  (2, 2, 2, 26, 'RESINA', 'Registrado en consulta del 2026-11-16', '2026-11-16 11:30:00'),
  (3, 3, 3, 36, 'AMALGAMA', 'Registrado en consulta del 2026-11-17', '2026-11-17 11:00:00'),
  (4, 4, 1, 46, 'ENDODONCIA', 'Registrado en consulta del 2026-11-18', '2026-11-18 12:30:00'),
  (5, 5, 2, 11, 'SANA', 'Registrado en consulta del 2026-11-19', '2026-11-19 14:00:00'),
  (6, 6, 3, 21, 'CORONA', 'Registrado en consulta del 2026-11-20', '2026-11-20 09:30:00'),
  (7, 7, 1, 18, 'AUSENTE', 'Registrado en consulta del 2026-11-21', '2026-11-21 10:00:00'),
  (8, 8, 2, 38, 'POR_EXTRAER', 'Registrado en consulta del 2026-11-23', '2026-11-23 12:30:00'),
  (9, 9, 3, 47, 'IMPLANTE', 'Registrado en consulta del 2026-11-23', '2026-11-23 12:00:00'),
  (10, 10, 1, 14, 'CARIES', 'Registrado en consulta del 2026-11-24', '2026-11-24 13:30:00'),
  (11, 11, 2, 24, 'RESINA', 'Registrado en consulta del 2026-11-25', '2026-11-25 09:00:00'),
  (12, 12, 3, 35, 'AMALGAMA', 'Registrado en consulta del 2026-11-25', '2026-11-25 09:00:00'),
  (13, 1, 1, 45, 'ENDODONCIA', 'Registrado en consulta del 2026-11-25', '2026-11-25 09:00:00'),
  (14, 2, 2, 12, 'SANA', 'Registrado en consulta del 2026-11-26', '2026-11-25 09:00:00'),
  (15, 3, 3, 37, 'CORONA', 'Registrado en consulta del 2026-11-26', '2026-11-25 09:00:00');

-- notificaciones: 12 registros
INSERT INTO notificaciones (id, usuario_id, cita_id, canal, destino, asunto, estado, error, creado_en) VALUES
  (1, 17, 11, 'EMAIL', 'camila.vargas@example.com', 'Cita confirmada', 'ENVIADA', NULL, '2026-11-25 09:00:00'),
  (2, 18, 12, 'SMS', '+529512000012', 'Cita confirmada', 'ENVIADA', NULL, '2026-11-25 09:00:00'),
  (3, 7, 13, 'WHATSAPP', '+529512000001', 'Cita confirmada', 'ENVIADA', NULL, '2026-11-25 09:00:00'),
  (4, 8, 14, 'EMAIL', 'carlos.ramirez@example.com', 'Cita confirmada', 'ENVIADA', NULL, '2026-11-25 09:00:00'),
  (5, 9, 15, 'SMS', '+529512000003', 'Cita confirmada', 'FALLIDA', 'Número no verificado en la cuenta de prueba de Twilio', '2026-11-25 09:00:00'),
  (6, 10, 16, 'WHATSAPP', '+529512000004', 'Cita confirmada', 'ENVIADA', NULL, '2026-11-25 09:00:00'),
  (7, 11, 17, 'EMAIL', 'fernanda.lopez@example.com', 'Cita confirmada', 'ENVIADA', NULL, '2026-11-25 09:00:00'),
  (8, 12, 18, 'SMS', '+529512000006', 'Cita confirmada', 'ENVIADA', NULL, '2026-11-25 09:00:00'),
  (9, 13, 19, 'WHATSAPP', '+529512000007', 'Cita confirmada', 'ENVIADA', NULL, '2026-11-25 09:00:00'),
  (10, 14, 20, 'EMAIL', 'luis.perez@example.com', 'Cita confirmada', 'FALLIDA', 'Número no verificado en la cuenta de prueba de Twilio', '2026-11-25 09:00:00'),
  (11, 15, 21, 'SMS', '+529512000009', 'Cita confirmada', 'ENVIADA', NULL, '2026-11-25 09:00:00'),
  (12, 16, 22, 'WHATSAPP', '+529512000010', 'Cita confirmada', 'ENVIADA', NULL, '2026-11-25 09:00:00');

SET FOREIGN_KEY_CHECKS = 1;
