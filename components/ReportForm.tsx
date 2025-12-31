'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import styles from './ReportForm.module.css'

// Dynamic import para el mapa con marcador arrastrable
const DraggableMap = dynamic(() => import('@/components/DraggableMap'), {
  ssr: false,
})

interface ReportFormProps {
  location: { lat: number; lng: number } | null
  onClose: () => void
  onSubmitted: () => void
}

// Ubicación por defecto: Departamento Sarmiento, San Juan
const DEFAULT_LOCATION = { lat: -31.5333, lng: -68.5333 }

export default function ReportForm({ location, onClose, onSubmitted }: ReportFormProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number }>(
    location || DEFAULT_LOCATION
  )
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [reportedBy, setReportedBy] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resolvedAddress, setResolvedAddress] = useState('')

  useEffect(() => {
    const initialLocation = location || DEFAULT_LOCATION
    setCurrentLocation(initialLocation)
    // Intentar obtener la dirección usando geocodificación inversa
    fetchAddress(initialLocation.lat, initialLocation.lng)
  }, [location])

  useEffect(() => {
    if (currentLocation) {
      // Actualizar dirección cuando se mueve el marcador
      fetchAddress(currentLocation.lat, currentLocation.lng)
    }
  }, [currentLocation])

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()
      if (data.display_name) {
        setResolvedAddress(data.display_name)
        setAddress(data.display_name)
      }
    } catch (err) {
      console.error('Error obteniendo dirección:', err)
    }
  }

  const handleLocationChange = (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentLocation) {
      setError('Por favor, selecciona una ubicación en el mapa')
      return
    }

    if (!address.trim()) {
      setError('Por favor, ingresa una dirección')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: supabaseError } = await supabase
        .from('water_reports')
        .insert([
          {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            address: address.trim(),
            description: description.trim() || null,
            reported_by: reportedBy.trim() || 'Anónimo',
            status: 'active',
          },
        ])
        .select()

      if (supabaseError) throw supabaseError

      onSubmitted()
    } catch (err: any) {
      console.error('Error guardando reporte:', err)
      setError(err.message || 'Error al guardar el reporte. Por favor, intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Reportar Falta de Agua</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.mapSection}>
            <label className={styles.mapLabel}>
              <strong>📍 Ajusta la ubicación arrastrando el marcador rojo:</strong>
            </label>
            <div className={styles.miniMap}>
              <DraggableMap
                initialPosition={currentLocation}
                onLocationChange={handleLocationChange}
              />
            </div>
            <div className={styles.locationInfo}>
              <strong>Coordenadas:</strong>
              <p>
                Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="address">Dirección *</label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Calle San Martín 123"
              required
            />
            {resolvedAddress && resolvedAddress !== address && (
              <button
                type="button"
                className={styles.useAddressButton}
                onClick={() => setAddress(resolvedAddress)}
              >
                Usar dirección detectada
              </button>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Descripción (opcional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Sin agua desde hace 3 días, afecta a 5 familias..."
              rows={4}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="reportedBy">Tu nombre (opcional)</label>
            <input
              id="reportedBy"
              type="text"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="Ej: Juan Pérez"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

