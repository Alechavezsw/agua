import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Intentar obtener información de cortes programados de Naturgy San Juan
    // Nota: Esto puede requerir ajustes según la estructura real de la página
    
    const response = await fetch('https://oficinavirtual.naturgysj.com.ar/publico/formularios/categorias', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 3600 } // Cache por 1 hora
    })

    if (!response.ok) {
      throw new Error('Error al obtener información de Naturgy')
    }

    const html = await response.text()
    
    // Intentar parsear el HTML para extraer información de cortes
    // Esto puede necesitar ajustes según la estructura real de la página
    const cortes: Array<{
      zona?: string
      fecha?: string
      horaInicio?: string
      horaFin?: string
      motivo?: string
    }> = []

    // Buscar patrones comunes en el HTML
    // Ajustar estos selectores según la estructura real de la página
    const cortesRegex = /corte|programado|mantenimiento/gi
    const hasCortes = cortesRegex.test(html)

    // Si encontramos información, intentar extraerla
    // Nota: Esto es un ejemplo básico, puede necesitar ajustes
    if (hasCortes) {
      // Aquí podrías usar una librería como cheerio para parsear mejor el HTML
      // Por ahora retornamos un indicador de que hay información disponible
      cortes.push({
        zona: 'Información disponible',
        fecha: 'Consulta en el sitio oficial',
        motivo: 'Ver detalles en Naturgy'
      })
    }

    return NextResponse.json({
      success: true,
      cortes: cortes,
      fuente: 'https://oficinavirtual.naturgysj.com.ar/publico/formularios/categorias',
      ultimaActualizacion: new Date().toISOString(),
      nota: 'Esta información se obtiene del sitio oficial de Naturgy San Juan. Para detalles completos, visita el sitio web oficial.'
    })
  } catch (error: any) {
    console.error('Error obteniendo cortes de Naturgy:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al obtener información',
      cortes: [],
      fuente: 'https://oficinavirtual.naturgysj.com.ar/publico/formularios/categorias',
      nota: 'No se pudo obtener la información. Por favor, visita el sitio oficial de Naturgy San Juan.'
    }, { status: 500 })
  }
}

