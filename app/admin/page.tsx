'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { WaterReport, REPORT_TYPES } from '@/types'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import styles from './admin.module.css'

// Extender el tipo de jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export default function AdminPanel() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [reports, setReports] = useState<WaterReport[]>([])
  const [allReports, setAllReports] = useState<WaterReport[]>([])
  const [surveys, setSurveys] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')
  const [reportTypeFilter, setReportTypeFilter] = useState<string>('all')
  const [showStats, setShowStats] = useState(true)

  useEffect(() => {
    // Verificar si ya está autenticado
    const authStatus = sessionStorage.getItem('admin_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
      loadReports()
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
    
    if (password === adminPassword) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_authenticated', 'true')
      setError('')
      loadReports()
    } else {
      setError('Contraseña incorrecta')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_authenticated')
    setPassword('')
  }

  const loadReports = async () => {
    try {
      // Cargar todos los reportes para estadísticas
      const { data: allData, error: allError } = await supabase
        .from('water_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (allError) throw allError
      setAllReports(allData || [])

      // Cargar encuestas
      const { data: surveysData, error: surveysError } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false })

      if (surveysError) throw surveysError
      setSurveys(surveysData || [])

      // Cargar reportes filtrados para la tabla
      let query = supabase
        .from('water_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter === 'active') {
        query = query.eq('status', 'active')
      } else if (filter === 'resolved') {
        query = query.eq('status', 'resolved')
      }

      const { data, error: supabaseError } = await query

      if (supabaseError) throw supabaseError

      let filteredData = data || []
      
      if (reportTypeFilter !== 'all') {
        filteredData = filteredData.filter(r => r.report_type === reportTypeFilter)
      }

      setReports(filteredData)
    } catch (err: any) {
      console.error('Error cargando reportes:', err)
      setError('Error al cargar los reportes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadReports()
    }
  }, [filter, reportTypeFilter, isAuthenticated])

  const markAsResolved = async (id: string) => {
    try {
      const { error } = await supabase
        .from('water_reports')
        .update({ status: 'resolved' })
        .eq('id', id)

      if (error) throw error
      loadReports()
    } catch (err: any) {
      console.error('Error actualizando reporte:', err)
      alert('Error al marcar como resuelto')
    }
  }

  const markAsActive = async (id: string) => {
    try {
      const { error } = await supabase
        .from('water_reports')
        .update({ status: 'active' })
        .eq('id', id)

      if (error) throw error
      loadReports()
    } catch (err: any) {
      console.error('Error actualizando reporte:', err)
      alert('Error al reactivar el reporte')
    }
  }

  const deleteReport = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este reclamo?')) return

    try {
      const { error } = await supabase
        .from('water_reports')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadReports()
    } catch (err: any) {
      console.error('Error eliminando reporte:', err)
      alert('Error al eliminar el reporte')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginBox}>
          <h1>🔐 Panel de Administración</h1>
          <p>Sarmiento Reclamos</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña de administrador"
                required
                autoFocus
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.loginButton}>
              Ingresar
            </button>
          </form>
          <button
            onClick={() => router.push('/')}
            className={styles.backButton}
          >
            ← Volver al mapa
          </button>
        </div>
      </div>
    )
  }

  // Estadísticas generales
  const activeCount = allReports.filter(r => r.status === 'active').length
  const resolvedCount = allReports.filter(r => r.status === 'resolved').length
  const totalCount = allReports.length

  // Estadísticas por tipo
  const statsByType = REPORT_TYPES.map(type => ({
    type: type.label,
    icon: type.icon,
    color: type.color,
    total: allReports.filter(r => r.report_type === type.value).length,
    active: allReports.filter(r => r.report_type === type.value && r.status === 'active').length,
    resolved: allReports.filter(r => r.report_type === type.value && r.status === 'resolved').length,
  }))

  // Estadísticas temporales
  const today = new Date()
  const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const last90Days = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
  
  const todayReports = allReports.filter(r => {
    const reportDate = new Date(r.created_at || '')
    return reportDate.toDateString() === today.toDateString()
  }).length

  const last7DaysReports = allReports.filter(r => {
    const reportDate = new Date(r.created_at || '')
    return reportDate >= last7Days
  }).length

  const last30DaysReports = allReports.filter(r => {
    const reportDate = new Date(r.created_at || '')
    return reportDate >= last30Days
  }).length

  const last90DaysReports = allReports.filter(r => {
    const reportDate = new Date(r.created_at || '')
    return reportDate >= last90Days
  }).length

  // Estadísticas de fotos
  const reportsWithPhotos = allReports.filter(r => r.photos && r.photos.length > 0).length
  const totalPhotos = allReports.reduce((sum, r) => sum + (r.photos?.length || 0), 0)

  // Tiempo promedio de resolución (en días)
  const resolvedReports = allReports.filter(r => r.status === 'resolved' && r.created_at)
  const avgResolutionTime = resolvedReports.length > 0
    ? resolvedReports.reduce((sum, r) => {
        // Asumimos que se resolvió hoy si no hay fecha de resolución
        const created = new Date(r.created_at || '')
        const resolved = new Date() // En un sistema real, tendrías una fecha de resolución
        const days = Math.floor((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        return sum + Math.max(0, days)
      }, 0) / resolvedReports.length
    : 0

  // Tasa de resolución
  const resolutionRate = totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0

  // Tendencias (comparar últimos 7 días vs 7 días anteriores)
  const previous7Days = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
  const previous7DaysReports = allReports.filter(r => {
    const reportDate = new Date(r.created_at || '')
    return reportDate >= previous7Days && reportDate < last7Days
  }).length
  const trend7Days = previous7DaysReports > 0 
    ? ((last7DaysReports - previous7DaysReports) / previous7DaysReports) * 100 
    : 0

  // Reclamos por mes (últimos 6 meses)
  const monthlyStats = Array.from({ length: 6 }, (_, i) => {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1)
    const monthReports = allReports.filter(r => {
      const reportDate = new Date(r.created_at || '')
      return reportDate >= monthDate && reportDate < nextMonth
    })
    return {
      month: monthDate.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
      count: monthReports.length,
      active: monthReports.filter(r => r.status === 'active').length,
      resolved: monthReports.filter(r => r.status === 'resolved').length,
    }
  }).reverse()

  // Zonas más afectadas (agrupando por dirección similar)
  const getZoneFromAddress = (address: string) => {
    if (!address) return 'Sin dirección'
    // Extraer la parte principal de la dirección (antes de la coma o número)
    const parts = address.split(',')
    if (parts.length > 0) {
      const mainPart = parts[0].trim()
      // Remover números de casa
      return mainPart.replace(/\d+/g, '').trim() || 'Sin dirección'
    }
    return address
  }

  const zoneStats = allReports.reduce((acc, report) => {
    const zone = getZoneFromAddress(report.address || '')
    if (!acc[zone]) {
      acc[zone] = { 
        name: zone, 
        count: 0, 
        active: 0, 
        resolved: 0,
        types: {} as Record<string, number>,
        lastReport: null as Date | null,
        withPhotos: 0,
      }
    }
    acc[zone].count++
    if (report.status === 'active') acc[zone].active++
    if (report.status === 'resolved') acc[zone].resolved++
    const type = report.report_type || 'agua'
    acc[zone].types[type] = (acc[zone].types[type] || 0) + 1
    if (report.photos && report.photos.length > 0) acc[zone].withPhotos++
    if (report.created_at) {
      const reportDate = new Date(report.created_at)
      if (!acc[zone].lastReport || reportDate > acc[zone].lastReport) {
        acc[zone].lastReport = reportDate
      }
    }
    return acc
  }, {} as Record<string, { 
    name: string
    count: number
    active: number
    resolved: number
    types: Record<string, number>
    lastReport: Date | null
    withPhotos: number
  }>)

  const topZones = Object.values(zoneStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map(zone => ({
      ...zone,
      resolutionRate: zone.count > 0 ? (zone.resolved / zone.count) * 100 : 0,
      photosRate: zone.count > 0 ? (zone.withPhotos / zone.count) * 100 : 0,
    }))

  // Estadísticas por día de la semana
  const dayStats = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, index) => {
    const dayReports = allReports.filter(r => {
      const reportDate = new Date(r.created_at || '')
      return reportDate.getDay() === index
    })
    return {
      day,
      count: dayReports.length,
      active: dayReports.filter(r => r.status === 'active').length,
    }
  })

  // Estadísticas por hora del día
  const hourStats = Array.from({ length: 24 }, (_, hour) => {
    const hourReports = allReports.filter(r => {
      const reportDate = new Date(r.created_at || '')
      return reportDate.getHours() === hour
    })
    return {
      hour,
      count: hourReports.length,
    }
  })

  const peakHour = hourStats.reduce((max, stat) => stat.count > max.count ? stat : max, hourStats[0])

  // Colores para gráficos
  const CHART_COLORS = ['#3b82f6', '#fbbf24', '#8b5cf6', '#10b981', '#ef4444', '#ec4899', '#06b6d4']

  // Función para generar reporte PDF mejorado
  const generatePDFReport = () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 20
    const margin = 14
    const maxWidth = pageWidth - (margin * 2)
    
    // Función helper para agregar nueva página si es necesario
    const checkPageBreak = (requiredSpace: number = 20) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage()
        yPosition = 20
        return true
      }
      return false
    }
    
    // Título principal
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text('Reporte de Reclamos', margin, yPosition)
    yPosition += 8
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.text('Sarmiento Reclamos - Panel de Administración', margin, yPosition)
    yPosition += 6
    
    // Fecha del reporte
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, margin, yPosition)
    doc.setTextColor(0, 0, 0)
    yPosition += 10
    
    // Estadísticas generales
    checkPageBreak(30)
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Estadísticas Generales', margin, yPosition)
    yPosition += 8
    
    const generalStats = [
      ['Total Reclamos', totalCount.toString()],
      ['Activos', activeCount.toString()],
      ['Resueltos', resolvedCount.toString()],
      ['Tasa de Resolución', `${resolutionRate.toFixed(1)}%`],
      ['Hoy', todayReports.toString()],
      ['Últimos 7 días', last7DaysReports.toString()],
      ['Últimos 30 días', last30DaysReports.toString()],
      ['Últimos 90 días', last90DaysReports.toString()],
      ['Tiempo Promedio Resolución', `${avgResolutionTime.toFixed(1)} días`],
      ['Con Fotos', reportsWithPhotos.toString()],
      ['Total Fotos', totalPhotos.toString()],
      ['Tendencia 7 días', `${trend7Days >= 0 ? '+' : ''}${trend7Days.toFixed(1)}%`],
    ]
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: generalStats,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60 } },
      margin: { left: margin, right: margin },
    })
    
    yPosition = (doc as any).lastAutoTable.finalY + 12
    
    // Estadísticas por tipo
    checkPageBreak(30)
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Estadísticas por Tipo de Reclamo', margin, yPosition)
    yPosition += 8
    
    const typeStatsData = statsByType
      .filter(stat => stat.total > 0)
      .map(stat => [
        stat.type,
        stat.total.toString(),
        stat.active.toString(),
        stat.resolved.toString(),
        stat.total > 0 ? `${((stat.resolved / stat.total) * 100).toFixed(1)}%` : '0%',
      ])
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Tipo', 'Total', 'Activos', 'Resueltos', 'Tasa Resolución']],
      body: typeStatsData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 40 },
      },
      margin: { left: margin, right: margin },
    })
    
    yPosition = (doc as any).lastAutoTable.finalY + 12
    
    // Top zonas
    checkPageBreak(40)
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Top 15 Zonas Más Afectadas', margin, yPosition)
    yPosition += 8
    
    const zonesData = topZones.slice(0, 15).map((zone, index) => [
      `#${index + 1}`,
      zone.name.length > 30 ? zone.name.substring(0, 27) + '...' : zone.name,
      zone.count.toString(),
      zone.active.toString(),
      zone.resolved.toString(),
      `${zone.resolutionRate.toFixed(1)}%`,
    ])
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Rank', 'Zona', 'Total', 'Activos', 'Resueltos', 'Tasa Res.']],
      body: zonesData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 70 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
      },
      margin: { left: margin, right: margin },
    })
    
    yPosition = (doc as any).lastAutoTable.finalY + 12
    
    // Estadísticas mensuales
    checkPageBreak(30)
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Tendencias Mensuales (Últimos 6 Meses)', margin, yPosition)
    yPosition += 8
    
    const monthlyData = monthlyStats.map(month => [
      month.month,
      month.count.toString(),
      month.active.toString(),
      month.resolved.toString(),
    ])
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Mes', 'Total', 'Activos', 'Resueltos']],
      body: monthlyData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      margin: { left: margin, right: margin },
    })
    
    // Pie de página en cada página
    const pageCount = doc.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(
        `Página ${i} de ${pageCount} - Sarmiento Reclamos`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
      doc.setTextColor(0, 0, 0)
    }
    
    // Guardar PDF
    doc.save(`reporte-sarmiento-reclamos-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Función para generar reporte CSV
  const generateCSVReport = () => {
    const headers = ['ID', 'Tipo', 'Dirección', 'Descripción', 'Reportado por', 'Estado', 'Fecha', 'Fotos']
    const rows = allReports.map(report => {
      const typeInfo = REPORT_TYPES.find(t => t.value === (report.report_type || 'agua')) || REPORT_TYPES[0]
      return [
        report.id || '',
        typeInfo.label,
        report.address || 'Sin dirección',
        report.description || '',
        report.reported_by || 'Anónimo',
        report.status === 'active' ? 'Activo' : 'Resuelto',
        report.created_at ? new Date(report.created_at).toLocaleString('es-AR') : '',
        (report.photos?.length || 0).toString(),
      ]
    })
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte-sarmiento-reclamos-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={styles.adminContainer}>
      <header className={styles.adminHeader}>
        <div>
          <h1>📊 Panel de Administración</h1>
          <p>Sarmiento Reclamos</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={generatePDFReport} className={styles.reportButton}>
            📄 PDF
          </button>
          <button onClick={generateCSVReport} className={styles.reportButton}>
            📊 CSV
          </button>
          <button onClick={() => router.push('/')} className={styles.mapButton}>
            🗺️ Ver Mapa
          </button>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className={styles.statsSection}>
        <div className={styles.sectionHeader}>
          <h2>📊 Estadísticas Generales</h2>
          <button 
            onClick={() => setShowStats(!showStats)}
            className={styles.toggleButton}
          >
            {showStats ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {showStats && (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Total Reclamos</h3>
                <p className={styles.statNumber} style={{ color: 'white' }}>{totalCount}</p>
              </div>
              <div className={styles.statCard} style={{ borderLeft: '4px solid #ef4444' }}>
                <h3>Activos</h3>
                <p className={styles.statNumber} style={{ color: '#ef4444' }}>{activeCount}</p>
                <p className={styles.statSubtext}>{totalCount > 0 ? `${((activeCount / totalCount) * 100).toFixed(1)}% del total` : '0%'}</p>
              </div>
              <div className={styles.statCard} style={{ borderLeft: '4px solid #10b981' }}>
                <h3>Resueltos</h3>
                <p className={styles.statNumber} style={{ color: '#10b981' }}>{resolvedCount}</p>
                <p className={styles.statSubtext}>{resolutionRate.toFixed(1)}% tasa de resolución</p>
              </div>
              <div className={styles.statCard} style={{ borderLeft: '4px solid #3b82f6' }}>
                <h3>Hoy</h3>
                <p className={styles.statNumber} style={{ color: '#3b82f6' }}>{todayReports}</p>
                <p className={styles.statSubtext}>Reclamos nuevos</p>
              </div>
              <div className={styles.statCard} style={{ borderLeft: '4px solid #8b5cf6' }}>
                <h3>Últimos 7 días</h3>
                <p className={styles.statNumber} style={{ color: '#8b5cf6' }}>{last7DaysReports}</p>
                <p className={styles.statSubtext}>
                  {trend7Days >= 0 ? '↗' : '↘'} {Math.abs(trend7Days).toFixed(1)}% vs período anterior
                </p>
              </div>
              <div className={styles.statCard} style={{ borderLeft: '4px solid #f59e0b' }}>
                <h3>Últimos 30 días</h3>
                <p className={styles.statNumber} style={{ color: '#f59e0b' }}>{last30DaysReports}</p>
                <p className={styles.statSubtext}>Promedio: {(last30DaysReports / 30).toFixed(1)}/día</p>
              </div>
              <div className={styles.statCard} style={{ borderLeft: '4px solid #10b981' }}>
                <h3>Con Fotos</h3>
                <p className={styles.statNumber} style={{ color: '#10b981' }}>{reportsWithPhotos}</p>
                <p className={styles.statSubtext}>{totalPhotos} fotos totales</p>
              </div>
              <div className={styles.statCard} style={{ borderLeft: '4px solid #ec4899' }}>
                <h3>Hora Pico</h3>
                <p className={styles.statNumber} style={{ color: '#ec4899' }}>{peakHour.hour}:00</p>
                <p className={styles.statSubtext}>{peakHour.count} reclamos</p>
              </div>
              <div className={styles.statCard} style={{ borderLeft: '4px solid #06b6d4' }}>
                <h3>Tiempo Promedio</h3>
                <p className={styles.statNumber} style={{ color: '#06b6d4' }}>{avgResolutionTime.toFixed(1)}</p>
                <p className={styles.statSubtext}>días para resolver</p>
              </div>
              <div className={styles.statCard} style={{ borderLeft: '4px solid #14b8a6' }}>
                <h3>Últimos 90 días</h3>
                <p className={styles.statNumber} style={{ color: '#14b8a6' }}>{last90DaysReports}</p>
                <p className={styles.statSubtext}>Tendencia trimestral</p>
              </div>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statsBox}>
                <h3>📋 Por Tipo de Reclamo</h3>
                <div className={styles.chartsGrid}>
                  <div className={styles.chartContainer}>
                    <h4>Distribución por Tipo</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statsByType.filter(s => s.total > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="total"
                        >
                          {statsByType.filter(s => s.total > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={styles.chartContainer}>
                    <h4>Comparación Total vs Activos</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statsByType.filter(s => s.total > 0)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#3b82f6" name="Total" />
                        <Bar dataKey="active" fill="#ef4444" name="Activos" />
                        <Bar dataKey="resolved" fill="#10b981" name="Resueltos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className={styles.typeStatsGrid}>
                  {statsByType.map(stat => (
                    <div key={stat.type} className={styles.typeStatCard} style={{ borderLeftColor: stat.color }}>
                      <div className={styles.typeStatHeader}>
                        <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
                        <span style={{ fontWeight: '600', color: stat.color }}>{stat.type}</span>
                      </div>
                      <div className={styles.typeStatNumbers}>
                        <div>
                          <span className={styles.typeStatLabel}>Total:</span>
                          <span className={styles.typeStatValue}>{stat.total}</span>
                        </div>
                        <div>
                          <span className={styles.typeStatLabel}>Activos:</span>
                          <span className={styles.typeStatValue} style={{ color: '#ef4444' }}>{stat.active}</span>
                        </div>
                        <div>
                          <span className={styles.typeStatLabel}>Resueltos:</span>
                          <span className={styles.typeStatValue} style={{ color: '#10b981' }}>{stat.resolved}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statsBox}>
                <h3>📍 Zonas Más Afectadas</h3>
                <div className={styles.zonesGrid}>
                  {topZones.map((zone, index) => (
                    <div key={index} className={styles.zoneCard}>
                      <div className={styles.zoneRank}>#{index + 1}</div>
                      <div className={styles.zoneInfo}>
                        <div className={styles.zoneName}>{zone.name}</div>
                        <div className={styles.zoneStats}>
                          <span className={styles.zoneStat}>
                            <strong>{zone.count}</strong> total
                          </span>
                          <span className={styles.zoneStat} style={{ color: '#ef4444' }}>
                            <strong>{zone.active}</strong> activos
                          </span>
                          <span className={styles.zoneStat} style={{ color: '#10b981' }}>
                            <strong>{zone.resolved}</strong> resueltos
                          </span>
                        </div>
                        <div className={styles.zoneProgress}>
                          <div className={styles.zoneProgressBar}>
                            <div 
                              className={styles.zoneProgressFill} 
                              style={{ 
                                width: `${zone.resolutionRate}%`,
                                background: zone.resolutionRate >= 70 ? '#10b981' : zone.resolutionRate >= 40 ? '#fbbf24' : '#ef4444'
                              }}
                            />
                          </div>
                          <span className={styles.zoneProgressText}>
                            {zone.resolutionRate.toFixed(1)}% resueltos
                          </span>
                        </div>
                        <div className={styles.zoneTypes}>
                          {Object.entries(zone.types).map(([type, count]) => {
                            const typeInfo = REPORT_TYPES.find(t => t.value === type)
                            return (
                              <span key={type} className={styles.zoneTypeTag} style={{ background: `${typeInfo?.color || '#666'}20`, color: typeInfo?.color || '#666' }}>
                                {typeInfo?.icon} {count}
                              </span>
                            )
                          })}
                        </div>
                        {zone.lastReport && (
                          <div className={styles.zoneLastReport}>
                            Último: {zone.lastReport.toLocaleDateString('es-AR')}
                          </div>
                        )}
                        {zone.withPhotos > 0 && (
                          <div className={styles.zonePhotos}>
                            📸 {zone.withPhotos} con fotos ({zone.photosRate.toFixed(0)}%)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statsBox}>
                <h3>📈 Tendencias Mensuales</h3>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#667eea" name="Total" />
                      <Bar dataKey="active" fill="#ef4444" name="Activos" />
                      <Bar dataKey="resolved" fill="#10b981" name="Resueltos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statsBox}>
                <h3>📅 Reclamos por Día de la Semana</h3>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dayStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#667eea" name="Total" />
                      <Bar dataKey="active" fill="#ef4444" name="Activos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.dayStatsGrid}>
                  {dayStats.map(day => (
                    <div key={day.day} className={styles.dayStatCard}>
                      <div className={styles.dayName}>{day.day}</div>
                      <div className={styles.dayBar}>
                        <div 
                          className={styles.dayBarFill}
                          style={{ 
                            width: `${totalCount > 0 ? (day.count / totalCount) * 100 : 0}%`,
                            background: `linear-gradient(90deg, #667eea 0%, #764ba2 100%)`
                          }}
                        />
                      </div>
                      <div className={styles.dayNumbers}>
                        <span className={styles.dayTotal}>{day.count}</span>
                        <span className={styles.dayActive} style={{ color: '#ef4444' }}>{day.active} activos</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statsBox}>
                <h3>⏰ Reclamos por Hora del Día</h3>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={hourStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" label={{ value: 'Hora', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Cantidad', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#667eea" strokeWidth={2} name="Reclamos" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statsBox}>
                <h3>📊 Resultados de Encuestas</h3>
                <div className={styles.surveysGrid}>
                  {['castro', 'orrego', 'milei'].map((questionKey) => {
                    const questionData = surveys.filter(s => s.question === questionKey)
                    const total = questionData.length
                    const buena = questionData.filter(s => s.answer === 'Buena').length
                    const regular = questionData.filter(s => s.answer === 'Regular').length
                    const mala = questionData.filter(s => s.answer === 'Mala').length

                    const questionNames: Record<string, string> = {
                      castro: 'Gestión de Castro',
                      orrego: 'Gestión de Orrego',
                      milei: 'Gestión de Milei',
                    }

                    const chartData = [
                      { name: 'Buena', value: buena, color: '#10b981' },
                      { name: 'Regular', value: regular, color: '#fbbf24' },
                      { name: 'Mala', value: mala, color: '#ef4444' },
                    ].filter(item => item.value > 0)

                    return (
                      <div key={questionKey} className={styles.surveyResultCard}>
                        <h4>{questionNames[questionKey]}</h4>
                        <div className={styles.surveyStats}>
                          <div className={styles.surveyStat}>
                            <span className={styles.surveyStatLabel}>Total:</span>
                            <span className={styles.surveyStatValue}>{total}</span>
                          </div>
                          <div className={styles.surveyStat}>
                            <span className={styles.surveyStatLabel} style={{ color: '#10b981' }}>Buena:</span>
                            <span className={styles.surveyStatValue} style={{ color: '#10b981' }}>{buena} ({total > 0 ? ((buena / total) * 100).toFixed(1) : 0}%)</span>
                          </div>
                          <div className={styles.surveyStat}>
                            <span className={styles.surveyStatLabel} style={{ color: '#fbbf24' }}>Regular:</span>
                            <span className={styles.surveyStatValue} style={{ color: '#fbbf24' }}>{regular} ({total > 0 ? ((regular / total) * 100).toFixed(1) : 0}%)</span>
                          </div>
                          <div className={styles.surveyStat}>
                            <span className={styles.surveyStatLabel} style={{ color: '#ef4444' }}>Mala:</span>
                            <span className={styles.surveyStatValue} style={{ color: '#ef4444' }}>{mala} ({total > 0 ? ((mala / total) * 100).toFixed(1) : 0}%)</span>
                          </div>
                        </div>
                        {total > 0 && (
                          <div className={styles.surveyChart}>
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie
                                  data={chartData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                  outerRadius={60}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                        {total === 0 && (
                          <div className={styles.noData}>No hay respuestas aún</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Estado:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="resolved">Resueltos</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Tipo:</label>
          <select value={reportTypeFilter} onChange={(e) => setReportTypeFilter(e.target.value)}>
            <option value="all">Todos</option>
            {REPORT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>
        <button onClick={loadReports} className={styles.refreshButton}>
          🔄 Actualizar
        </button>
      </div>

      <div className={styles.reportsTable}>
        {loading ? (
          <div className={styles.loading}>Cargando...</div>
        ) : reports.length === 0 ? (
          <div className={styles.emptyState}>No hay reclamos para mostrar</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Dirección</th>
                <th>Descripción</th>
                <th>Reportado por</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Fotos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const reportType = report.report_type || 'agua'
                const typeInfo = REPORT_TYPES.find(t => t.value === reportType) || REPORT_TYPES[0]
                return (
                  <tr key={report.id}>
                    <td>
                      <span className={styles.typeBadge} style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                    </td>
                    <td>{report.address || 'Sin dirección'}</td>
                    <td className={styles.descriptionCell}>
                      {report.description || '-'}
                    </td>
                    <td>{report.reported_by || 'Anónimo'}</td>
                    <td>
                      {report.created_at
                        ? new Date(report.created_at).toLocaleString('es-AR')
                        : '-'}
                    </td>
                    <td>
                      <span className={report.status === 'active' ? styles.statusActive : styles.statusResolved}>
                        {report.status === 'active' ? 'Activo' : 'Resuelto'}
                      </span>
                    </td>
                    <td>
                      {report.photos && report.photos.length > 0 ? (
                        <span className={styles.photoCount}>
                          📸 {report.photos.length}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {report.status === 'active' ? (
                          <button
                            onClick={() => markAsResolved(report.id!)}
                            className={styles.resolveButton}
                            title="Marcar como resuelto"
                          >
                            ✓
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsActive(report.id!)}
                            className={styles.activateButton}
                            title="Reactivar"
                          >
                            ↻
                          </button>
                        )}
                        <button
                          onClick={() => deleteReport(report.id!)}
                          className={styles.deleteButton}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

