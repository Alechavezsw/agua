-- Script para agregar la columna 'photos' a la tabla water_reports
-- Ejecuta este script en el SQL Editor de Supabase

-- Agregar columna de fotos si no existe
ALTER TABLE water_reports 
ADD COLUMN IF NOT EXISTS photos TEXT[];

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'water_reports' AND column_name = 'photos';

