# Configuración de Supabase Storage para Fotos

Este documento explica cómo configurar Supabase Storage para permitir la subida de fotos en los reclamos.

## Pasos para configurar Storage

### 1. Crear el bucket

1. Ve al dashboard de Supabase
2. Navega a **Storage** en el menú lateral
3. Haz clic en **"New bucket"**
4. Configura el bucket:
   - **Name**: `reclamos-photos`
   - **Public bucket**: ✅ Marca esta opción (permite acceso público a las fotos)
5. Haz clic en **"Create bucket"**

### 2. Configurar políticas de acceso

Después de crear el bucket, necesitas configurar las políticas de acceso para permitir que los usuarios suban y lean fotos.

#### Opción A: Usando el SQL Editor (Recomendado)

Ejecuta el siguiente SQL en el SQL Editor de Supabase:

```sql
-- Política para permitir lectura pública de fotos
CREATE POLICY "Permitir lectura pública de fotos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'reclamos-photos');

-- Política para permitir subida pública de fotos
CREATE POLICY "Permitir subida pública de fotos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'reclamos-photos');

-- Política para permitir actualización de fotos (opcional)
CREATE POLICY "Permitir actualización de fotos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'reclamos-photos');

-- Política para permitir eliminación de fotos (opcional, solo si quieres que los usuarios puedan eliminar)
-- CREATE POLICY "Permitir eliminación de fotos"
-- ON storage.objects
-- FOR DELETE
-- USING (bucket_id = 'reclamos-photos');
```

#### Opción B: Usando la interfaz de Supabase

1. Ve a **Storage** > **Policies** en el dashboard
2. Selecciona el bucket `reclamos-photos`
3. Haz clic en **"New Policy"**
4. Crea las siguientes políticas:

   **Política 1: Lectura pública**
   - Policy name: `Permitir lectura pública de fotos`
   - Allowed operation: `SELECT`
   - Target roles: `public`
   - USING expression: `bucket_id = 'reclamos-photos'`

   **Política 2: Subida pública**
   - Policy name: `Permitir subida pública de fotos`
   - Allowed operation: `INSERT`
   - Target roles: `public`
   - WITH CHECK expression: `bucket_id = 'reclamos-photos'`

### 3. Verificar la configuración

Para verificar que todo está configurado correctamente:

1. Intenta crear un reclamo con una foto desde la aplicación
2. Si hay errores, revisa la consola del navegador para ver los mensajes de error
3. Verifica en el dashboard de Supabase que las fotos se están subiendo al bucket

### 4. Límites y consideraciones

- **Tamaño máximo de archivo**: Por defecto, Supabase permite archivos de hasta 50MB. Puedes ajustar esto en la configuración del bucket.
- **Formatos soportados**: La aplicación acepta cualquier formato de imagen (`image/*`)
- **Límite de fotos**: Máximo 5 fotos por reclamo
- **Almacenamiento**: Ten en cuenta los límites de almacenamiento de tu plan de Supabase

### 5. Solución de problemas

**Error: "new row violates row-level security policy"**
- Verifica que las políticas de Storage estén configuradas correctamente
- Asegúrate de que el bucket sea público

**Error: "Bucket not found"**
- Verifica que el bucket se llame exactamente `reclamos-photos`
- Verifica que el bucket esté creado y activo

**Las fotos no se muestran**
- Verifica que el bucket sea público
- Verifica que la política de lectura esté configurada
- Revisa la consola del navegador para ver si hay errores de CORS

### 6. Actualizar la base de datos

Asegúrate de haber ejecutado el script SQL que agrega el campo `photos` a la tabla:

```sql
ALTER TABLE water_reports 
ADD COLUMN IF NOT EXISTS photos TEXT[];
```

Esto ya está incluido en `supabase-setup.sql`.

