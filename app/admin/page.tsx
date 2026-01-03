'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { WaterReport, REPORT_TYPES } from '@/types'
import styles from './admin.module.css'

export default function AdminPanel() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [reports, setReports] = useState<WaterReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')
  const [reportTypeFilter, setReportTypeFilter] = useState<string>('all')

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

  const activeCount = reports.filter(r => r.status === 'active').length
  const resolvedCount = reports.filter(r => r.status === 'resolved').length

  return (
    <div className={styles.adminContainer}>
      <header className={styles.adminHeader}>
        <div>
          <h1>📊 Panel de Administración</h1>
          <p>Sarmiento Reclamos</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={() => router.push('/')} className={styles.mapButton}>
            🗺️ Ver Mapa
          </button>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Reclamos</h3>
          <p className={styles.statNumber}>{reports.length}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Activos</h3>
          <p className={styles.statNumber} style={{ color: '#ef4444' }}>{activeCount}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Resueltos</h3>
          <p className={styles.statNumber} style={{ color: '#10b981' }}>{resolvedCount}</p>
        </div>
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

