export type ReportType = 'agua' | 'luz' | 'calles' | 'residuos' | 'reclamo'

export interface WaterReport {
  id?: string
  latitude: number
  longitude: number
  address?: string
  description?: string
  reported_by?: string
  created_at?: string
  status?: 'active' | 'resolved'
  report_type?: ReportType
  photos?: string[]
}

export const REPORT_TYPES: { value: ReportType; label: string; icon: string; color: string }[] = [
  { value: 'agua', label: 'Falta de Agua', icon: '💧', color: '#3b82f6' },
  { value: 'luz', label: 'Corte de Luz', icon: '⚡', color: '#fbbf24' },
  { value: 'calles', label: 'Problema en Calles', icon: '🛣️', color: '#8b5cf6' },
  { value: 'residuos', label: 'Recolección de Residuos', icon: '🗑️', color: '#10b981' },
  { value: 'reclamo', label: 'Reclamo Anónimo', icon: '📢', color: '#ef4444' },
]



