# Despliegue en VPS (Ubuntu 24.04)

Arquitectura: **Nginx** (HTTPS, sirve el build de React y hace proxy de `/api`) → **Spring Boot** como JAR con **systemd** (puerto 8080, solo local) → **MySQL 8** (solo local). El correo sale por **Postfix** del propio VPS firmado con **OpenDKIM**; SMS/WhatsApp por **Twilio**.

> Requisitos previos: un dominio propio apuntando al VPS (registro **A** → IP del VPS) y el puerto **25 de salida** habilitado por el proveedor (DigitalOcean, Vultr y otros lo bloquean por defecto: hay que pedir que lo abran o usar un proveedor que lo permita).

## 1. Paquetes y usuario
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y openjdk-21-jdk-headless maven mysql-server nginx certbot python3-certbot-nginx git rsync ufw
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
sudo useradd --system --home /opt/sonrisa --shell /usr/sbin/nologin sonrisa
sudo mkdir -p /opt/sonrisa /var/www/sonrisa && sudo chown sonrisa:sonrisa /opt/sonrisa
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

## 2. MySQL 8
```bash
sudo mysql_secure_installation
sudo mysql < database/crear_bd.sql        # edita antes la contraseña
```

## 3. Backend
```bash
git clone https://github.com/USUARIO/ClinicaSonrisas.git && cd ClinicaSonrisas
cd backend && mvn -DskipTests package && cd ..
sudo cp backend/target/sonrisa-api.jar /opt/sonrisa/
sudo cp backend/src/main/resources/application.properties.example /opt/sonrisa/application.properties
sudo nano /opt/sonrisa/application.properties   # valores reales (JWT, BD, Twilio, OAuth, dominio)
sudo chown sonrisa:sonrisa /opt/sonrisa/application.properties && sudo chmod 600 /opt/sonrisa/application.properties
sudo cp deploy/sonrisa-api.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now sonrisa-api
journalctl -u sonrisa-api -f        # verás "Seeder: ... usuarios" la primera vez
```
Genera la clave JWT con `openssl rand -base64 64 | tr -d '\n'`.

## 4. Frontend
```bash
cd frontend && cp .env.example .env.production.local   # pon VITE_GOOGLE_CLIENT_ID y VITE_FACEBOOK_APP_ID
npm ci && npm run build && sudo rsync -a --delete dist/ /var/www/sonrisa/
sudo cp ../deploy/nginx-sonrisa.conf /etc/nginx/sites-available/sonrisa   # cambia TU-DOMINIO.com
sudo ln -s /etc/nginx/sites-available/sonrisa /etc/nginx/sites-enabled/ && sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 5. HTTPS con Let's Encrypt
```bash
sudo certbot --nginx -d TU-DOMINIO.com -d www.TU-DOMINIO.com --redirect -m tu@correo.com --agree-tos
sudo certbot renew --dry-run      # la renovación automática queda en un timer de systemd
```

## 6. Correo propio: Postfix + OpenDKIM
```bash
sudo apt install -y postfix opendkim opendkim-tools mailutils   # tipo "Internet Site", nombre: TU-DOMINIO.com
sudo postconf -e "myhostname = mail.TU-DOMINIO.com" "inet_interfaces = loopback-only" \
  "smtpd_milters = inet:localhost:8891" "non_smtpd_milters = inet:localhost:8891" "milter_default_action = accept" \
  "smtp_tls_security_level = may"
sudo mkdir -p /etc/opendkim/keys/TU-DOMINIO.com
sudo opendkim-genkey -b 2048 -d TU-DOMINIO.com -D /etc/opendkim/keys/TU-DOMINIO.com -s mail -v
sudo chown -R opendkim:opendkim /etc/opendkim/keys
sudo cp deploy/opendkim.conf /etc/opendkim.conf          # cambia TU-DOMINIO.com
sudo systemctl restart opendkim postfix
sudo cat /etc/opendkim/keys/TU-DOMINIO.com/mail.txt      # valor del registro DKIM
echo "Prueba" | mail -s "Prueba Sonrisa" -a "From: no-reply@TU-DOMINIO.com" tu@gmail.com
```
`inet_interfaces = loopback-only` hace que Postfix solo acepte correos del propio servidor (el backend se conecta a `localhost:25`), así no queda como relay abierto.

### Registros DNS
| Tipo | Nombre | Valor |
|---|---|---|
| A | `@` y `mail` | IP del VPS |
| MX | `@` | `10 mail.TU-DOMINIO.com.` |
| TXT (SPF) | `@` | `v=spf1 a mx ip4:IP_DEL_VPS -all` |
| TXT (DKIM) | `mail._domainkey` | `v=DKIM1; k=rsa; p=…` (de `mail.txt`, sin comillas ni saltos) |
| TXT (DMARC) | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:postmaster@TU-DOMINIO.com` |
| PTR (rDNS) | en el panel del VPS | `mail.TU-DOMINIO.com` |

Comprueba con `dig TXT mail._domainkey.TU-DOMINIO.com +short` y enviando un correo a https://www.mail-tester.com (meta: 9/10 o más). En Gmail → "Mostrar original" debe decir **SPF: PASS** y **DKIM: PASS**.

## 7. Twilio (SMS y WhatsApp)
1. Crea la cuenta en twilio.com, copia **Account SID** y **Auth Token** a `application.properties`.
2. SMS: compra/usa el número de prueba como `app.twilio.sms-from`. En cuenta trial solo llega a **números verificados**.
3. WhatsApp: Messaging → Try it out → *Send a WhatsApp message*. Cada teléfono de prueba debe enviar `join <palabra>` al `+1 415 523 8886` (sandbox). Los celulares de México a veces requieren el prefijo `+521`.
4. Revisa la bitácora en **Admin → Notificaciones**: cada envío queda como ENVIADA, FALLIDA (con el error de Twilio) u OMITIDA.

## 8. Google y Facebook
- **Google**: Google Cloud Console → APIs y servicios → Credenciales → ID de cliente OAuth (aplicación web). Orígenes autorizados: `https://TU-DOMINIO.com` y `http://localhost:5173`. El mismo Client ID va en `app.oauth.google.client-id` y en `VITE_GOOGLE_CLIENT_ID`.
- **Facebook**: developers.facebook.com → Crear app (Consumidor) → *Facebook Login* → dominio `TU-DOMINIO.com`, URL del sitio `https://TU-DOMINIO.com/`. URL de la política de privacidad: `https://TU-DOMINIO.com/privacidad` (ya existe en el frontend). App ID y App Secret en `application.properties`; el App ID también en `VITE_FACEBOOK_APP_ID`. Facebook Login exige HTTPS.

## 9. Actualizaciones
`./deploy/actualizar.sh` (git pull, compila, reinicia el servicio y publica el build).
