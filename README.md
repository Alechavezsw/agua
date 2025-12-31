# 💧 Agua Sarmiento

Aplicación web interactiva para que los vecinos del Departamento Sarmiento puedan reportar y visualizar en un mapa dónde falta agua.

## 🚀 Características

- 🗺️ Mapa interactivo centrado en el Departamento Sarmiento, San Juan
- 📍 Marcadores en tiempo real de reportes de falta de agua
- ✋ **Marcador arrastrable** - Ajusta la ubicación exacta arrastrando el marcador con el mouse
- ➕ Formulario fácil de usar para agregar nuevos reportes
- 🔄 Actualización en tiempo real usando Supabase
- 📱 Diseño responsive para móviles y tablets
- 🎨 Interfaz moderna y fácil de usar
- 🗺️ Mapa pequeño dentro del formulario para ajustar la ubicación con precisión

## 🛠️ Tecnologías

- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Leaflet** - Mapas interactivos
- **Supabase** - Base de datos y tiempo real
- **React Leaflet** - Componentes React para Leaflet

## 📋 Prerequisitos

- Node.js 18+ instalado
- Cuenta de Supabase (gratuita)

## 🔧 Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Crea un archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

3. Configura la base de datos en Supabase ejecutando el siguiente SQL en el SQL Editor:

```sql
-- Crear tabla para reportes de agua
CREATE TABLE water_reports (
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
CREATE INDEX idx_water_reports_location ON water_reports(latitude, longitude);

-- Crear índice para búsquedas por estado
CREATE INDEX idx_water_reports_status ON water_reports(status);
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📖 Uso

1. **Ver reportes existentes**: Los marcadores azules en el mapa muestran dónde se ha reportado falta de agua.

2. **Agregar un nuevo reporte**:
   - Haz clic en cualquier lugar del mapa
   - O haz clic en el botón "Reportar Falta de Agua"
   - **Arrastra el marcador rojo** en el mapa pequeño del formulario para ajustar la ubicación exacta
   - La dirección se actualiza automáticamente cuando mueves el marcador
   - Completa el formulario con los detalles
   - Haz clic en "Guardar Reporte"

3. **Ver detalles**: Haz clic en cualquier marcador para ver los detalles del reporte.

## 🌍 Configuración del Mapa

El mapa está centrado en el Departamento Sarmiento, San Juan, Argentina. Las coordenadas por defecto son:
- Latitud: -31.5333
- Longitud: -68.5333
- Zoom: 13

Puedes ajustar estas coordenadas en `components/MapComponent.tsx` si necesitas centrar el mapa en otra ubicación.

## 📝 Notas

- Los reportes se guardan con estado "active" por defecto
- La aplicación muestra solo reportes activos en el mapa
- Los cambios se sincronizan en tiempo real entre todos los usuarios
- La geocodificación inversa intenta obtener la dirección automáticamente al hacer clic en el mapa

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

