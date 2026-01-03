-- Script de configuración de base de datos para Agua Sarmiento
-- Ejecuta este script en el SQL Editor de Supabase

-- Crear tabla para reportes de agua
CREATE TABLE IF NOT EXISTS water_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  description TEXT,
  reported_by TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  report_type TEXT DEFAULT 'agua' CHECK (report_type IN ('agua', 'luz', 'calles', 'residuos', 'reclamo')),
  photos TEXT[], -- Array de URLs de fotos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar Row Level Security
ALTER TABLE water_reports ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública
CREATE POLICY "Permitir lectura pública" ON water_reports
  FOR SELECT USING (true);

-- Política para permitir inserción pública
CREATE POLICY "Permitir inserción pública" ON water_reports
  FOR INSERT WITH CHECK (true);

-- Crear índice para búsquedas por ubicación
CREATE INDEX IF NOT EXISTS idx_water_reports_location ON water_reports(latitude, longitude);

-- Crear índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_water_reports_status ON water_reports(status);

-- Crear índice para ordenamiento por fecha
CREATE INDEX IF NOT EXISTS idx_water_reports_created_at ON water_reports(created_at DESC);

-- Crear índice para búsquedas por tipo de reporte
CREATE INDEX IF NOT EXISTS idx_water_reports_type ON water_reports(report_type);

-- Agregar columna de fotos si no existe (para bases de datos existentes)
ALTER TABLE water_reports 
ADD COLUMN IF NOT EXISTS photos TEXT[];

-- Función para limpiar automáticamente reportes antiguos (más de 7 días)
-- Esta función marca como 'resolved' los reportes activos que tienen más de 7 días
CREATE OR REPLACE FUNCTION clean_old_reports()
RETURNS void AS $$
BEGIN
  UPDATE water_reports
  SET status = 'resolved'
  WHERE status = 'active'
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Crear bucket de Storage para las fotos de reclamos
-- Nota: Esto debe ejecutarse manualmente en el dashboard de Supabase Storage
-- O usar la API de Supabase para crear el bucket programáticamente
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reclamos-photos', 'reclamos-photos', true);

-- Política para permitir subida pública de fotos
-- CREATE POLICY "Permitir subida pública de fotos" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'reclamos-photos');

-- Política para permitir lectura pública de fotos
-- CREATE POLICY "Permitir lectura pública de fotos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'reclamos-photos');

-- Crear un cron job para ejecutar la limpieza automáticamente cada día a las 2 AM
-- Nota: Esto requiere la extensión pg_cron en Supabase
-- Si no está disponible, puedes ejecutar manualmente la función clean_old_reports() periódicamente
-- o usar Supabase Edge Functions con un cron trigger

-- Para habilitar pg_cron (si está disponible en tu plan de Supabase):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('clean-old-reports', '0 2 * * *', 'SELECT clean_old_reports();');



