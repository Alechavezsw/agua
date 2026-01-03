# 📢 Sarmiento Reclamos

Aplicación web interactiva para que los vecinos del Departamento Sarmiento puedan reportar y visualizar en un mapa diferentes tipos de problemas: falta de agua, cortes de luz, problemas en calles, recolección de residuos y reclamos anónimos.

## 🚀 Características

- 🗺️ Mapa interactivo centrado en el Departamento Sarmiento, San Juan
- 📍 Marcadores en tiempo real con diferentes tipos de reclamos
- 🎨 **Iconos y colores diferenciados** por tipo de reclamo:
  - 💧 Falta de Agua (azul)
  - ⚡ Corte de Luz (amarillo)
  - 🛣️ Problemas en Calles (morado)
  - 🗑️ Recolección de Residuos (verde)
  - 📢 Reclamos Anónimos (rojo)
- ✋ **Marcador arrastrable** - Ajusta la ubicación exacta arrastrando el marcador con el mouse
- ➕ Formulario fácil de usar para agregar nuevos reclamos
- 🔄 Actualización en tiempo real usando Supabase
- 📱 Diseño responsive para móviles y tablets
- 🎨 Interfaz moderna y fácil de usar
- 🗺️ Mapa pequeño dentro del formulario para ajustar la ubicación con precisión
- 🧹 **Limpieza automática** - Los reclamos de más de 7 días se ocultan automáticamente
- 📸 **Subida de fotos** - Puedes adjuntar hasta 5 fotos por reclamo para documentar el problema

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
NEXT_PUBLIC_ADMIN_PASSWORD=tu_contraseña_segura
```
**Nota**: `NEXT_PUBLIC_ADMIN_PASSWORD` es la contraseña para acceder al panel de administración. Si no se define, el valor por defecto es `admin123`.

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
  report_type TEXT DEFAULT 'agua' CHECK (report_type IN ('agua', 'luz', 'calles', 'residuos', 'reclamo')),
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

## 🚀 Deploy en Vercel

El proyecto está listo para desplegarse en Vercel:

1. **Conecta tu repositorio de GitHub a Vercel**:
   - Ve a [vercel.com](https://vercel.com)
   - Inicia sesión con tu cuenta de GitHub
   - Haz clic en "Add New Project"
   - Selecciona el repositorio `Alechavezsw/agua`

2. **Configura las variables de entorno**:
   - En la configuración del proyecto en Vercel, ve a "Environment Variables"
   - Agrega las siguientes variables:
     - `NEXT_PUBLIC_SUPABASE_URL` = tu URL de Supabase
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu clave anónima de Supabase
     - `NEXT_PUBLIC_ADMIN_PASSWORD` = tu contraseña para el panel de admin (opcional, por defecto: `admin123`)

3. **Deploy automático**:
   - Vercel detectará automáticamente que es un proyecto Next.js
   - Haz clic en "Deploy"
   - ¡Listo! Tu aplicación estará en línea en unos minutos

4. **Configuración de la base de datos**:
   - Asegúrate de haber ejecutado el script SQL en Supabase (ver `supabase-setup.sql`)
   - Verifica que las políticas RLS estén configuradas correctamente

5. **Configuración de Storage para fotos**:
   - Ve a Storage en el dashboard de Supabase
   - Crea un nuevo bucket llamado `reclamos-photos`
   - Marca el bucket como público
   - Configura las políticas de acceso:
     - **Política de lectura**: Permite lectura pública
     - **Política de escritura**: Permite inserción pública

## 📖 Uso

1. **Ver reclamos existentes**: Los marcadores en el mapa muestran diferentes tipos de reclamos con colores e iconos distintivos:
   - 💧 Azul: Falta de Agua
   - ⚡ Amarillo: Corte de Luz
   - 🛣️ Morado: Problemas en Calles
   - 🗑️ Verde: Recolección de Residuos
   - 📢 Rojo: Reclamos Anónimos

2. **Agregar un nuevo reclamo**:
   - Haz clic en cualquier lugar del mapa
   - O haz clic en el botón "+ Nuevo Reclamo"
   - Selecciona el tipo de reclamo en el formulario
   - **Arrastra el marcador rojo** en el mapa pequeño del formulario para ajustar la ubicación exacta
   - La dirección se actualiza automáticamente cuando mueves el marcador
   - Completa el formulario con los detalles
   - **Opcional**: Sube hasta 5 fotos para documentar el problema
   - Nota: Los reclamos anónimos no requieren nombre
   - Haz clic en "Guardar Reporte"

3. **Ver detalles**: Haz clic en cualquier marcador para ver los detalles del reclamo, incluyendo las fotos si fueron adjuntadas.

4. **Limpieza automática**: Los reclamos de más de 7 días se ocultan automáticamente de la vista general.

5. **Fotos**: Puedes subir hasta 5 fotos por reclamo. Las fotos se almacenan en Supabase Storage y se muestran en el popup del marcador.

6. **Panel de Administración**: Accede desde el enlace "🔐 Admin" en el header o visitando `/admin`. Desde aquí puedes:
   - Ver todos los reclamos (activos y resueltos)
   - Filtrar por tipo y estado
   - Marcar reclamos como resueltos
   - Reactivar reclamos resueltos
   - Eliminar reclamos
   - Ver estadísticas generales

## 🌍 Configuración del Mapa

El mapa está centrado en Media Agua, cabecera del Departamento Sarmiento, San Juan, Argentina. Las coordenadas por defecto son:
- Latitud: -31.9742
- Longitud: -68.4231
- Zoom: 13

Puedes ajustar estas coordenadas en `components/MapComponent.tsx` si necesitas centrar el mapa en otra ubicación.

## 📝 Notas

- Los reclamos se guardan con estado "active" por defecto
- La aplicación muestra solo reclamos activos de los últimos 7 días en el mapa
- Los cambios se sincronizan en tiempo real entre todos los usuarios
- La geocodificación inversa intenta obtener la dirección automáticamente al hacer clic en el mapa
- Los reclamos anónimos no muestran el nombre del reportante
- Existe una función SQL `clean_old_reports()` que marca como resueltos los reclamos de más de 7 días (ver `supabase-setup.sql`)
- Las fotos se almacenan en Supabase Storage en el bucket `reclamos-photos`
- Se pueden subir hasta 5 fotos por reclamo
- Las fotos se muestran en los popups del mapa y se pueden abrir en una nueva pestaña

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

