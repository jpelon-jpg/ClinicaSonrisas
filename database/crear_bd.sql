-- Ejecutar una sola vez como root de MySQL 8:  sudo mysql < database/crear_bd.sql
-- Cambia 'CAMBIA_ESTA_CLAVE' por una contraseña real y ponla también en application.properties.
CREATE DATABASE IF NOT EXISTS sonrisa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sonrisa_app'@'localhost' IDENTIFIED BY 'CAMBIA_ESTA_CLAVE';
GRANT ALL PRIVILEGES ON sonrisa_db.* TO 'sonrisa_app'@'localhost';
FLUSH PRIVILEGES;
