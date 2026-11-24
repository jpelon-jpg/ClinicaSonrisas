INSERT INTO roles (nombre, descripcion) VALUES
('ADMINISTRADOR', 'Acceso total al sistema'),
('RECEPCIONISTA', 'Gestiona citas y registro de pacientes'),
('DENTISTA', 'Atiende citas y escribe notas clínicas'),
('PACIENTE', 'Gestiona sus propias citas y consulta su expediente');

INSERT INTO permisos (codigo, descripcion, categoria) VALUES
('CITAS_VER_TODAS', 'Ver todas las citas de la clínica', 'CITAS'),
('CITAS_CREAR', 'Crear o reprogramar citas', 'CITAS'),
('CITAS_CANCELAR', 'Cancelar citas', 'CITAS'),
('CITAS_ELIMINAR', 'Eliminar citas del sistema', 'CITAS'),
('CITAS_MARCAR_ATENDIDA', 'Marcar cita como atendida', 'CITAS'),
('PACIENTES_EDITAR', 'Registrar y editar datos de pacientes', 'PACIENTES'),
('EXPEDIENTE_VER', 'Ver expediente clínico', 'PACIENTES'),
('NOTAS_ESCRIBIR', 'Escribir notas clínicas y odontograma', 'PACIENTES'),
('AGENDA_VER_PROPIAS', 'Ver solo sus propias citas', 'AGENDA'),
('HORARIOS_CONFIGURAR', 'Configurar horarios de dentistas', 'AGENDA'),
('USUARIOS_GESTIONAR', 'Gestionar usuarios y roles', 'ADMINISTRACION'),
('REPORTES_VER', 'Ver reportes e indicadores', 'ADMINISTRACION'),
('TRATAMIENTOS_CONFIGURAR', 'Configurar tratamientos y precios', 'ADMINISTRACION');

-- Administrador
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p
WHERE r.nombre = 'ADMINISTRADOR' AND p.codigo IN (
 'CITAS_VER_TODAS','CITAS_CREAR','CITAS_CANCELAR','CITAS_ELIMINAR',
 'CITAS_MARCAR_ATENDIDA','PACIENTES_EDITAR','EXPEDIENTE_VER',
 'HORARIOS_CONFIGURAR','USUARIOS_GESTIONAR','REPORTES_VER','TRATAMIENTOS_CONFIGURAR');

-- Recepcionista
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p
WHERE r.nombre = 'RECEPCIONISTA' AND p.codigo IN (
 'CITAS_VER_TODAS','CITAS_CREAR','CITAS_CANCELAR','CITAS_MARCAR_ATENDIDA','PACIENTES_EDITAR');

-- Dentista
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p
WHERE r.nombre = 'DENTISTA' AND p.codigo IN (
 'CITAS_MARCAR_ATENDIDA','EXPEDIENTE_VER','NOTAS_ESCRIBIR','AGENDA_VER_PROPIAS');

-- Paciente
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p
WHERE r.nombre = 'PACIENTE' AND p.codigo IN (
 'CITAS_CREAR','CITAS_CANCELAR','EXPEDIENTE_VER','AGENDA_VER_PROPIAS');