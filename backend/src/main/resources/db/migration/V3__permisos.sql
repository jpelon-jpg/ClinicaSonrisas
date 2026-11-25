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
