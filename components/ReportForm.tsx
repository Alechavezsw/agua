'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { ReportType, REPORT_TYPES } from '@/types'
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

// Ubicación por defecto: Media Agua, cabecera del Departamento Sarmiento, San Juan
const DEFAULT_LOCATION = { lat: -31.9742, lng: -68.4231 }

export default function ReportForm({ location, onClose, onSubmitted }: ReportFormProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number }>(
    location || DEFAULT_LOCATION
  )
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [reportedBy, setReportedBy] = useState('')
  const [reportType, setReportType] = useState<ReportType>('agua')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limitar a 5 fotos máximo
    const remainingSlots = 5 - photos.length
    const filesToAdd = files.slice(0, remainingSlots)
    
    setPhotos([...photos, ...filesToAdd])

    // Crear previews
    filesToAdd.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index))
  }

  const uploadPhotos = async (reportId: string): Promise<string[]> => {
    if (photos.length === 0) return []

    setUploadingPhotos(true)
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${reportId}-${Date.now()}-${i}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError, data } = await supabase.storage
          .from('reclamos-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('reclamos-photos')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      return uploadedUrls
    } catch (err: any) {
      console.error('Error subiendo fotos:', err)
      throw err
    } finally {
      setUploadingPhotos(false)
    }
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
      // Primero crear el reporte
      const { data: reportData, error: supabaseError } = await supabase
        .from('water_reports')
        .insert([
          {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            address: address.trim(),
            description: description.trim() || null,
            reported_by: reportType === 'reclamo' ? 'Anónimo' : (reportedBy.trim() || 'Anónimo'),
            status: 'active',
            report_type: reportType,
            photos: [], // Se actualizará después de subir las fotos
          },
        ])
        .select()

      if (supabaseError) throw supabaseError

      const reportId = reportData?.[0]?.id
      if (!reportId) throw new Error('No se pudo crear el reporte')

      // Subir fotos si hay
      let photoUrls: string[] = []
      if (photos.length > 0) {
        try {
          photoUrls = await uploadPhotos(reportId)
          
          // Actualizar el reporte con las URLs de las fotos
          const { error: updateError } = await supabase
            .from('water_reports')
            .update({ photos: photoUrls })
            .eq('id', reportId)

          if (updateError) throw updateError
        } catch (photoError: any) {
          console.error('Error subiendo fotos:', photoError)
          // Continuar aunque falle la subida de fotos
          setError('El reclamo se guardó pero hubo un error al subir las fotos. Puedes intentar agregarlas más tarde.')
        }
      }

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
          <h2>Nuevo Reclamo</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="reportType">Tipo de Reclamo *</label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className={styles.select}
              required
            >
              {REPORT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

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

          {reportType !== 'reclamo' && (
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
          )}
          {reportType === 'reclamo' && (
            <div className={styles.infoBox}>
              <p>ℹ️ Este reclamo será anónimo. Tu nombre no se mostrará.</p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="photos">Fotos (opcional, máximo 5)</label>
            <input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              disabled={photos.length >= 5 || loading}
              className={styles.fileInput}
            />
            {photos.length > 0 && (
              <div className={styles.photosPreview}>
                {photoPreviews.map((preview, index) => (
                  <div key={index} className={styles.photoPreview}>
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className={styles.removePhotoButton}
                      disabled={loading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photos.length >= 5 && (
              <p className={styles.photoLimit}>Máximo 5 fotos</p>
            )}
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
              disabled={loading || uploadingPhotos}
            >
              {uploadingPhotos ? 'Subiendo fotos...' : loading ? 'Guardando...' : 'Guardar Reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

