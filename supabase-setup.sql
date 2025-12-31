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

