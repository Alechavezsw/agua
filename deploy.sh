#!/bin/bash

# Script de deployment para Hostinger
# Asegúrate de tener permisos de ejecución: chmod +x deploy.sh

echo "🚀 Iniciando deployment de Sarmiento Reclamos..."

# Actualizar código desde Git
echo "📥 Actualizando código desde Git..."
git pull origin main

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Construir aplicación
echo "🔨 Construyendo aplicación..."
npm run build

# Reiniciar aplicación con PM2
echo "🔄 Reiniciando aplicación..."
pm2 restart sarmiento-reclamos || pm2 start npm --name "sarmiento-reclamos" -- start

echo "✅ Deployment completado!"
echo "📊 Estado de la aplicación:"
pm2 status

