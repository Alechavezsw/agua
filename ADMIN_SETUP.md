# Configuración del Panel de Administración

## Acceso al Panel

El panel de administración está disponible en `/admin` o haciendo clic en el enlace "🔐 Admin" en el header de la aplicación.

## Autenticación

El panel utiliza autenticación simple basada en contraseña. La contraseña se configura mediante la variable de entorno `NEXT_PUBLIC_ADMIN_PASSWORD`.

### Configuración de la Contraseña

1. **En desarrollo local**:
   - Agrega `NEXT_PUBLIC_ADMIN_PASSWORD=tu_contraseña_segura` a tu archivo `.env.local`
   - Si no se define, el valor por defecto es `admin123`

2. **En producción (Vercel)**:
   - Ve a la configuración del proyecto en Vercel
   - Agrega la variable de entorno `NEXT_PUBLIC_ADMIN_PASSWORD` con tu contraseña
   - Reinicia el deployment para que tome efecto

### Seguridad

⚠️ **Importante**: 
- La contraseña se almacena en el cliente (variable `NEXT_PUBLIC_*`), por lo que es visible en el código del navegador
- Para mayor seguridad en producción, considera:
  - Usar una contraseña fuerte y única
  - Implementar autenticación con Supabase Auth
  - Usar políticas RLS en Supabase para restringir acceso a datos sensibles

## Funcionalidades del Panel

### Vista General
- **Estadísticas**: Muestra el total de reclamos, activos y resueltos
- **Filtros**: Filtra por estado (Todos, Activos, Resueltos) y tipo de reclamo
- **Tabla de reclamos**: Lista completa con todos los detalles

### Acciones Disponibles

1. **Marcar como Resuelto** (✓):
   - Cambia el estado del reclamo de "activo" a "resuelto"
   - El reclamo desaparecerá de la vista pública (solo muestra últimos 7 días activos)

2. **Reactivar** (↻):
   - Cambia el estado del reclamo de "resuelto" a "activo"
   - El reclamo volverá a aparecer en la vista pública

3. **Eliminar** (🗑️):
   - Elimina permanentemente el reclamo de la base de datos
   - ⚠️ Esta acción no se puede deshacer

### Información Mostrada

Para cada reclamo se muestra:
- Tipo de reclamo (con icono y color)
- Dirección
- Descripción
- Reportado por (nombre o "Anónimo")
- Fecha y hora de creación
- Estado (Activo/Resuelto)
- Cantidad de fotos adjuntas
- Acciones disponibles

## Mejoras Futuras

Para mayor seguridad, considera implementar:
- Autenticación con Supabase Auth
- Roles de usuario (admin, moderador, etc.)
- Logs de acciones administrativas
- Políticas RLS más restrictivas en Supabase
- Dashboard con gráficos y estadísticas avanzadas

