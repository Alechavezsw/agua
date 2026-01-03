# Guía de Deployment en Hostinger

Esta guía te ayudará a desplegar la aplicación Sarmiento Reclamos en Hostinger.

## Prerequisitos

1. Cuenta de Hostinger con acceso a Node.js
2. Acceso SSH o panel de control de Hostinger
3. Variables de entorno de Supabase configuradas

## Opción 1: Deployment Manual

### Paso 1: Preparar el proyecto

1. Asegúrate de tener todos los cambios pusheados a GitHub
2. Clona el repositorio en tu servidor Hostinger o descarga los archivos

### Paso 2: Configurar variables de entorno

Crea un archivo `.env` o `.env.production` en la raíz del proyecto con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
NEXT_PUBLIC_ADMIN_PASSWORD=tu_contraseña_admin
NODE_ENV=production
```

### Paso 3: Instalar dependencias y construir

```bash
npm install
npm run build
```

### Paso 4: Ejecutar la aplicación

```bash
npm start
```

O si usas PM2 (recomendado para producción):

```bash
npm install -g pm2
pm2 start npm --name "sarmiento-reclamos" -- start
pm2 save
pm2 startup
```

## Opción 2: Usando Git y Auto-Deploy

### Paso 1: Configurar Git en Hostinger

1. Conecta tu servidor Hostinger a tu repositorio de GitHub
2. Configura un webhook o script de auto-deploy

### Paso 2: Script de deployment

Crea un archivo `deploy.sh` en la raíz:

```bash
#!/bin/bash
git pull origin main
npm install
npm run build
pm2 restart sarmiento-reclamos
```

### Paso 3: Hacer el script ejecutable

```bash
chmod +x deploy.sh
```

## Opción 3: Usando el Panel de Control de Hostinger

1. **Accede al Panel de Control de Hostinger**
2. **Ve a Node.js** (si está disponible en tu plan)
3. **Crea una nueva aplicación Node.js**
4. **Configura:**
   - **Versión de Node.js**: 18.x o superior
   - **Puerto**: El que Hostinger asigne
   - **Directorio raíz**: `/public_html` o el directorio que uses
   - **Comando de inicio**: `npm start`

5. **Sube los archivos** usando FTP o el File Manager
6. **Configura las variables de entorno** en el panel de Node.js
7. **Instala dependencias y construye:**
   ```bash
   npm install
   npm run build
   ```

## Configuración de Next.js para Hostinger

### next.config.js

Asegúrate de que tu `next.config.js` esté configurado para producción:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Opcional: para optimizar el build
  // O usa 'export' si quieres generar archivos estáticos
}

module.exports = nextConfig
```

## Configuración de PM2 (Recomendado)

PM2 es un gestor de procesos para Node.js que mantiene tu aplicación corriendo.

### Instalación

```bash
npm install -g pm2
```

### Configuración

Crea un archivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'sarmiento-reclamos',
    script: 'npm',
    args: 'start',
    cwd: '/ruta/a/tu/proyecto',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### Comandos PM2 útiles

```bash
# Iniciar aplicación
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs
pm2 logs sarmiento-reclamos

# Reiniciar
pm2 restart sarmiento-reclamos

# Detener
pm2 stop sarmiento-reclamos

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

## Configuración de Nginx (Si es necesario)

Si necesitas usar Nginx como proxy reverso, configura:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Verificación

1. **Verifica que la aplicación esté corriendo:**
   ```bash
   pm2 status
   ```

2. **Revisa los logs:**
   ```bash
   pm2 logs sarmiento-reclamos
   ```

3. **Prueba la aplicación:**
   - Visita tu dominio
   - Verifica que el mapa cargue
   - Prueba crear un reclamo
   - Accede al panel de admin

## Troubleshooting

### Error: Puerto en uso
```bash
# Ver qué proceso usa el puerto
lsof -i :3000
# O
netstat -tulpn | grep :3000
```

### Error: Permisos
```bash
chmod -R 755 /ruta/a/tu/proyecto
```

### Error: Memoria insuficiente
- Aumenta el límite de memoria en PM2
- O usa `output: 'standalone'` en next.config.js

### La aplicación no inicia
- Verifica las variables de entorno
- Revisa los logs: `pm2 logs`
- Verifica que todas las dependencias estén instaladas

## Notas Importantes

1. **Base de datos**: Asegúrate de que Supabase esté accesible desde Hostinger
2. **Storage**: Configura el bucket de Supabase Storage para las fotos
3. **SSL**: Configura HTTPS en Hostinger para seguridad
4. **Backups**: Configura backups regulares de la base de datos

## Soporte

Si tienes problemas:
1. Revisa los logs de PM2
2. Verifica las variables de entorno
3. Asegúrate de que Node.js 18+ esté instalado
4. Contacta al soporte de Hostinger si es necesario

