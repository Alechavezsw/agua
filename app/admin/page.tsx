'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { WaterReport, REPORT_TYPES } from '@/types'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import styles from './admin.module.css'

export default function AdminPanel() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [reports, setReports] = useState<WaterReport[]>([])
  const [allReports, setAllReports] = useState<WaterReport[]>([])
  const [loading, setLoading] = useState(true)
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

  // Estadísticas de fotos
  const reportsWithPhotos = allReports.filter(r => r.photos && r.photos.length > 0).length
  const totalPhotos = allReports.reduce((sum, r) => sum + (r.photos?.length || 0), 0)

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
      acc[zone] = { name: zone, count: 0, active: 0, types: {} as Record<string, number> }
    }
    acc[zone].count++
    if (report.status === 'active') acc[zone].active++
    const type = report.report_type || 'agua'
    acc[zone].types[type] = (acc[zone].types[type] || 0) + 1
    return acc
  }, {} as Record<string, { name: string; count: number; active: number; types: Record<string, number> }>)

  const topZones = Object.values(zoneStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

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

  // Función para generar reporte PDF
  const generatePDFReport = () => {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(20)
    doc.text('Reporte de Reclamos - Sarmiento Reclamos', 14, 20)
    
    // Fecha del reporte
    doc.setFontSize(10)
    doc.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, 14, 30)
    
    // Estadísticas generales
    doc.setFontSize(14)
    doc.text('Estadísticas Generales', 14, 40)
    doc.setFontSize(10)
    
    const generalStats = [
      ['Total Reclamos', totalCount.toString()],
      ['Activos', activeCount.toString()],
      ['Resueltos', resolvedCount.toString()],
      ['Hoy', todayReports.toString()],
      ['Últimos 7 días', last7DaysReports.toString()],
      ['Últimos 30 días', last30DaysReports.toString()],
      ['Con Fotos', reportsWithPhotos.toString()],
      ['Total Fotos', totalPhotos.toString()],
    ]
    
    doc.autoTable({
      startY: 45,
      head: [['Métrica', 'Valor']],
      body: generalStats,
      theme: 'striped',
    })
    
    // Estadísticas por tipo
    let finalY = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(14)
    doc.text('Estadísticas por Tipo de Reclamo', 14, finalY)
    
    const typeStatsData = statsByType.map(stat => [
      `${stat.icon} ${stat.type}`,
      stat.total.toString(),
      stat.active.toString(),
      stat.resolved.toString(),
    ])
    
    doc.autoTable({
      startY: finalY + 5,
      head: [['Tipo', 'Total', 'Activos', 'Resueltos']],
      body: typeStatsData,
      theme: 'striped',
    })
    
    // Top zonas
    finalY = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(14)
    doc.text('Top 10 Zonas Más Afectadas', 14, finalY)
    
    const zonesData = topZones.map((zone, index) => [
      `#${index + 1}`,
      zone.name,
      zone.count.toString(),
      zone.active.toString(),
    ])
    
    doc.autoTable({
      startY: finalY + 5,
      head: [['Rank', 'Zona', 'Total', 'Activos']],
      body: zonesData,
      theme: 'striped',
    })
    
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
              <div className={styles.statCard}>
                <h3>Total Reclamos</h3>
                <p className={styles.statNumber}>{totalCount}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Activos</h3>
                <p className={styles.statNumber} style={{ color: '#ef4444' }}>{activeCount}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Resueltos</h3>
                <p className={styles.statNumber} style={{ color: '#10b981' }}>{resolvedCount}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Hoy</h3>
                <p className={styles.statNumber} style={{ color: '#3b82f6' }}>{todayReports}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Últimos 7 días</h3>
                <p className={styles.statNumber} style={{ color: '#8b5cf6' }}>{last7DaysReports}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Últimos 30 días</h3>
                <p className={styles.statNumber} style={{ color: '#f59e0b' }}>{last30DaysReports}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Con Fotos</h3>
                <p className={styles.statNumber} style={{ color: '#10b981' }}>{reportsWithPhotos}</p>
                <p className={styles.statSubtext}>{totalPhotos} fotos totales</p>
              </div>
              <div className={styles.statCard}>
                <h3>Hora Pico</h3>
                <p className={styles.statNumber} style={{ color: '#ec4899' }}>{peakHour.hour}:00</p>
                <p className={styles.statSubtext}>{peakHour.count} reclamos</p>
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
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                <div className={styles.zonesList}>
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
                      </div>
                    </div>
                  ))}
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

