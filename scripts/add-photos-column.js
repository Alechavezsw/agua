// Script para agregar la columna photos a la tabla water_reports
// Ejecuta: node scripts/add-photos-column.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno')
  console.error('Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addPhotosColumn() {
  console.log('🔄 Agregando columna photos a la tabla water_reports...')
  
  try {
    // Ejecutar el SQL usando RPC o directamente
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE water_reports ADD COLUMN IF NOT EXISTS photos TEXT[];'
    })

    if (error) {
      // Si RPC no funciona, intentar con query directa
      console.log('⚠️  RPC no disponible, intentando método alternativo...')
      
      // Usar el método directo de Supabase
      const { error: alterError } = await supabase
        .from('water_reports')
        .select('id')
        .limit(1)
      
      // Si llegamos aquí, la tabla existe, ahora necesitamos ejecutar el ALTER
      // Como no podemos ejecutar ALTER directamente desde el cliente,
      // mostramos las instrucciones
      console.log('\n❌ No se puede ejecutar ALTER TABLE desde el cliente de Supabase.')
      console.log('📝 Por favor, ejecuta este SQL manualmente en el SQL Editor de Supabase:\n')
      console.log('ALTER TABLE water_reports ADD COLUMN IF NOT EXISTS photos TEXT[];')
      console.log('\n✅ Después de ejecutarlo, la columna estará disponible.')
      return
    }

    console.log('✅ Columna photos agregada exitosamente!')
  } catch (err) {
    console.error('❌ Error:', err.message)
    console.log('\n📝 Por favor, ejecuta este SQL manualmente en el SQL Editor de Supabase:\n')
    console.log('ALTER TABLE water_reports ADD COLUMN IF NOT EXISTS photos TEXT[];')
  }
}

addPhotosColumn()

