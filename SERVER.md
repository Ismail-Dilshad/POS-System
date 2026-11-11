# Linux deployment: kurduinotech.com

Use Caddy + PHP-FPM, managed by systemd. The React frontend is built once and
served from public/build. No PM2, PHP development server, or Vite process is needed.
This guide assumes /var/www/pos-system and PHP 8.3; adjust both to your server.

## Prepare the app

Install PHP 8.3 CLI/FPM with Laravel's extensions plus PostgreSQL support,
Composer, Node.js, Caddy, PostgreSQL, and Redis. Copy the project to
/var/www/pos-system. Install dependencies on Linux; do not copy Windows
node_modules, vendor, caches, or the Windows public/storage link.

Keep your server's existing APP_KEY and database credentials. For a new
installation, copy .env.example to .env and run php artisan key:generate once.
Set these values in the server's .env:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://kurduinotech.com
ASSET_URL=https://kurduinotech.com
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=true
LOG_LEVEL=warning
```

From the project directory:

```bash
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
composer install --no-dev --optimize-autoloader
composer check-platform-reqs --no-dev
npm ci
npm run build
rm -f public/hot
php artisan optimize:clear
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan view:cache
```

Keep an existing valid public/storage link. Back up an existing database before
migrating. PHP needs write access to storage and bootstrap/cache; Caddy needs read
access to public and storage/app/public. On Debian/Ubuntu, PHP-FPM commonly uses
www-data. Allow Caddy to access that group's socket and files:

```bash
sudo usermod -aG www-data caddy
sudo chgrp -R www-data storage bootstrap/cache
sudo chmod -R ug+rwX storage bootstrap/cache
sudo systemctl enable --now php8.3-fpm
```

## Connect Caddy

Point kurduinotech.com's DNS to the server and allow inbound ports 80 and 443.
Add the project's Caddyfile block to your active server configuration, preserving
other domain blocks. The default systemd service normally reads
/etc/caddy/Caddyfile (lowercase f). Linux filenames are case-sensitive. If you use
/etc/caddy/CaddyFile as requested, first ensure the service uses that exact path:

```bash
sudo systemctl edit caddy
```

Add this override only when using the capital-F filename:

```ini
[Service]
ExecStart=
ExecStart=/usr/bin/caddy run --environ --config /etc/caddy/CaddyFile --adapter caddyfile
ExecReload=
ExecReload=/usr/bin/caddy reload --config /etc/caddy/CaddyFile --adapter caddyfile --force
```

Check the installed Caddy binary path if it differs from /usr/bin/caddy. Then:

```bash
sudo caddy validate --config /etc/caddy/CaddyFile --adapter caddyfile
sudo systemctl daemon-reload
sudo systemctl enable caddy
sudo systemctl restart caddy
```

For the default lowercase filename, skip the override and daemon-reload, and use
/etc/caddy/Caddyfile in the validation command. Caddy obtains HTTPS certificates
for the domain automatically. The PHP socket must match the installed FPM pool's
listen setting, and Caddy must have permission to connect to it.

Check https://kurduinotech.com/up, then /admin/login, /cashier/login, and
/data-entry/login. Application errors are in storage/logs/laravel.log; web server
logs are available with journalctl -u caddy.

## Updates

Install changed dependencies, rebuild frontend assets, run required migrations,
and rebuild Laravel's caches with the commands above. Reload PHP afterward:

```bash
sudo systemctl reload php8.3-fpm
```

## Start a fresh Git repository

The supplied .gitignore excludes environment secrets, dependencies, generated
assets and runtime files. The existing .git folder must be removed locally before
initializing a new repository. In PowerShell, from this project's root:

```powershell
Remove-Item -LiteralPath .git -Recurse -Force
git init
git status
```

Review git status before the first commit. Source files, lock files, migrations,
and the logo should be committed. Dependencies and frontend assets are recreated
during deployment.

References: https://laravel.com/docs/12.x/deployment and
https://caddyserver.com/docs/caddyfile/directives/php_fastcgi
