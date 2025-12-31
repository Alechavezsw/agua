export interface WaterReport {
  id?: string
  latitude: number
  longitude: number
  address?: string
  description?: string
  reported_by?: string
  created_at?: string
  status?: 'active' | 'resolved'
}

