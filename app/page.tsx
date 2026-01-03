'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { WaterReport, REPORT_TYPES } from '@/types'
import ReportForm from '@/components/ReportForm'
import WeatherWidget from '@/components/WeatherWidget'
import SurveyWidget from '@/components/SurveyWidget'
import PowerOutagesWidget from '@/components/PowerOutagesWidget'
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
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    
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
  }, [isMounted])

  const loadReports = async () => {
    try {
      // Calcular la fecha de hace 7 días
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoISO = sevenDaysAgo.toISOString()

      const { data, error } = await supabase
        .from('water_reports')
        .select('*')
        .eq('status', 'active')
        .gte('created_at', sevenDaysAgoISO) // Solo reportes de los últimos 7 días
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
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>📢 Sarmiento Reclamos</h1>
            <p className={styles.subtitle}>
              Mapa interactivo para reportar problemas en el Departamento Sarmiento
            </p>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.mapContainer}>
          {!loading && isMounted && (
            <MapComponent
              reports={reports}
              onMapClick={handleMapClick}
            />
          )}
          {loading && (
            <div className={styles.loading}>Cargando mapa...</div>
          )}
        </div>

        <div className={styles.sidebar}>
          <WeatherWidget />
          <PowerOutagesWidget />
          
          <div className={styles.stats}>
            <h2>Reclamos Activos</h2>
            <p className={styles.count}>{reports.length}</p>
          </div>

          <div className={styles.surveysSection}>
            <h3 className={styles.surveysTitle}>📊 Encuestas</h3>
            <SurveyWidget 
              question="¿Cómo considera la gestión de Castro?"
              questionKey="castro"
            />
            <SurveyWidget 
              question="¿Cómo considera la gestión de Orrego?"
              questionKey="orrego"
            />
            <SurveyWidget 
              question="¿Cómo considera la gestión de Milei?"
              questionKey="milei"
            />
          </div>

          <button
            className={styles.reportButton}
            onClick={() => setShowForm(true)}
          >
            + Nuevo Reclamo
          </button>

          <details className={styles.instructions}>
            <summary>Instrucciones</summary>
            <ol>
              <li>Haz clic en el mapa o en el botón para crear un reclamo</li>
              <li>Selecciona el tipo de reclamo (agua, luz, calles, residuos, etc.)</li>
              <li>Arrastra el marcador rojo para ajustar la ubicación exacta</li>
              <li>Completa el formulario con los detalles</li>
              <li>Tu reclamo aparecerá en el mapa</li>
            </ol>
          </details>

          {reports.length > 0 && (
            <div className={styles.reportsList}>
              <h3>Últimos Reclamos</h3>
              <ul>
                {reports.slice(0, 5).map((report) => {
                  const reportType = report.report_type || 'agua'
                  const typeInfo = REPORT_TYPES.find(t => t.value === reportType) || REPORT_TYPES[0]
                  return (
                    <li key={report.id} className={styles.reportItem} style={{ borderLeftColor: typeInfo.color }}>
                      <div className={styles.reportItemType} style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}>
                        {typeInfo.icon} {typeInfo.label}
                      </div>
                      <div className={styles.reportAddress}>
                        {report.address || 'Sin dirección'}
                      </div>
                      <div className={styles.reportDate}>
                        {report.created_at
                          ? new Date(report.created_at).toLocaleDateString('es-AR')
                          : ''}
                      </div>
                    </li>
                  )
                })}
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

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>
            Desarrollado por{' '}
            <a 
              href="https://www.cosechacreativa.com.ar" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              www.cosechacreativa.com.ar
            </a>
          </p>
          <a 
            href="https://www.swdiario.com.ar" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.swButton}
          >
            🌐 SW Diario
          </a>
        </div>
      </footer>
    </main>
  )
}

