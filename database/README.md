# Base de datos · MySQL 8

| Archivo | Para qué sirve |
|---|---|
| `crear_bd.sql` | Crea la base `sonrisa_db` y el usuario `sonrisa_app` (se ejecuta una sola vez). |
| `../backend/src/main/resources/db/migration/` | Migraciones **Flyway**: V1 esquema, V2 catálogos, V3 permisos. Se aplican solas al arrancar el backend. |
| `sonrisa_backup.sql` | **Respaldo completo**: estructura, historial de Flyway y datos de prueba (18 usuarios, 12 pacientes, 30 citas, 12 notas, 15 registros de odontograma, 12 notificaciones). Las contraseñas están en BCrypt. |
| `respaldo.sh` | Genera un respaldo nuevo con `mysqldump` o restaura el existente. |

## Opción A · Dejar que el backend cree todo (recomendada)
```bash
mysql -u root -p < database/crear_bd.sql
cd backend && ./mvnw spring-boot:run      # Flyway crea las tablas y el DataSeeder carga los datos
```

## Opción B · Restaurar el respaldo
```bash
mysql -u root -p < database/crear_bd.sql          # solo la primera vez (crea el usuario)
mysql -u root -p < database/sonrisa_backup.sql    # borra y vuelve a crear sonrisa_db con todos los datos
```
El respaldo incluye la tabla `flyway_schema_history`, así que al arrancar el backend Flyway reconoce las migraciones como aplicadas y el seeder no duplica datos.

En **MySQL Workbench**: *Server → Data Import → Import from Self-Contained File* → elige `sonrisa_backup.sql` → *Start Import*.

## Generar un respaldo nuevo (por ejemplo, desde el VPS)
```bash
./database/respaldo.sh            # escribe database/sonrisa_backup.sql
./database/respaldo.sh restaurar  # lo vuelve a cargar
```
> Solo contiene datos ficticios (`@example.com`). Nunca subas al repositorio un respaldo con datos reales de pacientes.
