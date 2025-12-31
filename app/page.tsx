'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { WaterReport } from '@/types'
import ReportForm from '@/components/ReportForm'
import styles from './page.module.css'

// Dynamic import para evitar problemas de SSR con Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className={styles.loading}>Cargando mapa...</div>
})

export default function Home() {
  const [reports, setReports] = useState<WaterReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    loadReports()
    
    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('water-reports')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'water_reports' },
        () => {
          loadReports()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('water_reports')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Error cargando reportes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })
    setShowForm(true)
  }

  const handleReportSubmitted = () => {
    setShowForm(false)
    setSelectedLocation(null)
    loadReports()
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>💧 Agua Sarmiento</h1>
        <p className={styles.subtitle}>
          Mapa interactivo para reportar falta de agua en el Departamento Sarmiento
        </p>
      </header>

      <div className={styles.container}>
        <div className={styles.mapContainer}>
          {!loading && (
            <MapComponent
              reports={reports}
              onMapClick={handleMapClick}
            />
          )}
        </div>

        <div className={styles.sidebar}>
          <div className={styles.stats}>
            <h2>Reportes Activos</h2>
            <p className={styles.count}>{reports.length}</p>
          </div>

          <button
            className={styles.reportButton}
            onClick={() => setShowForm(true)}
          >
            + Reportar Falta de Agua
          </button>

          <details className={styles.instructions}>
            <summary>Instrucciones</summary>
            <ol>
              <li>Haz clic en el mapa o en el botón para reportar</li>
              <li>Arrastra el marcador rojo para ajustar la ubicación exacta</li>
              <li>Completa el formulario con los detalles</li>
              <li>Tu reporte aparecerá en el mapa</li>
            </ol>
          </details>

          {reports.length > 0 && (
            <div className={styles.reportsList}>
              <h3>Últimos Reportes</h3>
              <ul>
                {reports.slice(0, 5).map((report) => (
                  <li key={report.id} className={styles.reportItem}>
                    <div className={styles.reportAddress}>
                      {report.address || 'Sin dirección'}
                    </div>
                    <div className={styles.reportDate}>
                      {report.created_at
                        ? new Date(report.created_at).toLocaleDateString('es-AR')
                        : ''}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <ReportForm
          location={selectedLocation}
          onClose={() => {
            setShowForm(false)
            setSelectedLocation(null)
          }}
          onSubmitted={handleReportSubmitted}
        />
      )}
    </main>
  )
}

