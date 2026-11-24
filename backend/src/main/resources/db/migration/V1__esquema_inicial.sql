CREATE TABLE roles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE,
  descripcion VARCHAR(150)
);

CREATE TABLE permisos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(60) NOT NULL UNIQUE,
  descripcion VARCHAR(150) NOT NULL,
  categoria VARCHAR(40) NOT NULL
);

CREATE TABLE rol_permiso (
  rol_id BIGINT NOT NULL,
  permiso_id BIGINT NOT NULL,
  PRIMARY KEY (rol_id, permiso_id),
  FOREIGN KEY (rol_id) REFERENCES roles(id),
  FOREIGN KEY (permiso_id) REFERENCES permisos(id)
);

CREATE TABLE usuarios (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  avatar_url VARCHAR(255),
  proveedor_auth VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_ingreso DATETIME NULL,
  rol_id BIGINT NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id),
  INDEX idx_usuarios_rol (rol_id)
);

CREATE TABLE dentistas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL UNIQUE,
  especialidad VARCHAR(80),
  consultorio VARCHAR(40),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE pacientes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  direccion VARCHAR(200),
  antecedentes TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE tratamientos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  precio DECIMAL(10,2) NOT NULL,
  duracion_min INT NOT NULL DEFAULT 30,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE citas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  paciente_id BIGINT NOT NULL,
  dentista_id BIGINT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADA',
  motivo VARCHAR(255),
  creado_por_id BIGINT NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (dentista_id) REFERENCES dentistas(id),
  FOREIGN KEY (creado_por_id) REFERENCES usuarios(id),
  INDEX idx_citas_fecha (fecha_hora),
  INDEX idx_citas_estado (estado)
);

CREATE TABLE cita_tratamiento (
  cita_id BIGINT NOT NULL,
  tratamiento_id BIGINT NOT NULL,
  precio_aplicado DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (cita_id, tratamiento_id),
  FOREIGN KEY (cita_id) REFERENCES citas(id),
  FOREIGN KEY (tratamiento_id) REFERENCES tratamientos(id)
);

CREATE TABLE notas_clinicas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cita_id BIGINT NOT NULL,
  dentista_id BIGINT NOT NULL,
  nota TEXT NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cita_id) REFERENCES citas(id),
  FOREIGN KEY (dentista_id) REFERENCES dentistas(id)
);

CREATE TABLE tokens_revocados (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expira_en DATETIME NOT NULL
);

CREATE TABLE password_reset_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL,
  token VARCHAR(100) NOT NULL UNIQUE,
  expira_en DATETIME NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);