'use client'

import { useState, useEffect } from 'react'
import styles from './PowerOutagesWidget.module.css'

interface PowerOutage {
  zona?: string
  fecha?: string
  horaInicio?: string
  horaFin?: string
  motivo?: string
}

interface PowerOutagesData {
  success: boolean
  cortes: PowerOutage[]
  fuente: string
  ultimaActualizacion?: string
  nota?: string
  error?: string
}

export default function PowerOutagesWidget() {
  const [data, setData] = useState<PowerOutagesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCortes = async () => {
      try {
        const response = await fetch('/api/naturgy-cortes')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Error obteniendo cortes:', error)
        setData({
          success: false,
          cortes: [],
          fuente: 'https://oficinavirtual.naturgysj.com.ar/publico/formularios/categorias',
          error: 'Error al cargar información'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCortes()
    
    // Actualizar cada hora
    const interval = setInterval(fetchCortes, 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className={styles.outagesWidget}>
        <div className={styles.header}>
          <span className={styles.icon}>⚡</span>
          <h3>Cortes Programados</h3>
        </div>
        <div className={styles.loading}>Cargando información...</div>
      </div>
    )
  }

  if (!data || !data.success) {
    return (
      <div className={styles.outagesWidget}>
        <div className={styles.header}>
          <span className={styles.icon}>⚡</span>
          <h3>Cortes Programados</h3>
        </div>
        <div className={styles.content}>
          <p className={styles.noData}>
            No se pudo obtener la información automáticamente.
          </p>
          <a 
            href={data?.fuente || 'https://oficinavirtual.naturgysj.com.ar/publico/formularios/categorias'}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Consultar en Naturgy San Juan →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.outagesWidget}>
      <div className={styles.header}>
        <span className={styles.icon}>⚡</span>
        <h3>Cortes Programados</h3>
      </div>
      <div className={styles.content}>
        {data.cortes && data.cortes.length > 0 ? (
          <div className={styles.cortesList}>
            {data.cortes.map((corte, index) => (
              <div key={index} className={styles.corteItem}>
                {corte.zona && <div className={styles.zona}>{corte.zona}</div>}
                {corte.fecha && <div className={styles.fecha}>📅 {corte.fecha}</div>}
                {(corte.horaInicio || corte.horaFin) && (
                  <div className={styles.hora}>
                    ⏰ {corte.horaInicio || ''} {corte.horaInicio && corte.horaFin ? '-' : ''} {corte.horaFin || ''}
                  </div>
                )}
                {corte.motivo && <div className={styles.motivo}>{corte.motivo}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noCortes}>
            <p>✅ No hay cortes programados reportados</p>
          </div>
        )}
        
        <a 
          href={data.fuente}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Ver más información en Naturgy →
        </a>
        
        {data.ultimaActualizacion && (
          <div className={styles.updateTime}>
            Actualizado: {new Date(data.ultimaActualizacion).toLocaleString('es-AR')}
          </div>
        )}
      </div>
    </div>
  )
}

