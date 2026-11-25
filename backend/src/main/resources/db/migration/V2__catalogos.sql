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
