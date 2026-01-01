'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { WaterReport } from '@/types'
import 'leaflet/dist/leaflet.css'

// Fix para los iconos de Leaflet en Next.js
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png'
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

// Icono personalizado para reportes de agua
const waterIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#3b82f6" stroke="white" stroke-width="2"/>
      <path d="M16 8 C16 8, 12 12, 12 16 C12 20, 16 24, 16 24 C16 24, 20 20, 20 16 C20 12, 16 8, 16 8 Z" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

interface MapComponentProps {
  reports: WaterReport[]
  onMapClick: (lat: number, lng: number) => void
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      onMapClick(lat, lng)
    },
  })
  return null
}

// Componente para invalidar el tamaño del mapa (necesario en móvil)
function MapResizeHandler() {
  const map = useMap()
  
  useEffect(() => {
    // Invalidar el tamaño del mapa cuando se monta
    setTimeout(() => {
      map.invalidateSize()
    }, 100)
    
    // También invalidar cuando cambia el tamaño de la ventana
    const handleResize = () => {
      map.invalidateSize()
    }
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [map])
  
  return null
}

export default function MapComponent({ reports, onMapClick }: MapComponentProps) {
  // Coordenadas de Media Agua, cabecera del Departamento Sarmiento, San Juan, Argentina
  const center: [number, number] = [-31.9742, -68.4231]
  const zoom = 13

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapResizeHandler />
      <MapClickHandler onMapClick={onMapClick} />

      {reports.map((report) => (
        <Marker
          key={report.id}
          position={[report.latitude, report.longitude]}
          icon={waterIcon}
        >
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
                💧 Falta de Agua
              </h3>
              {report.address && (
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                  <strong>Dirección:</strong> {report.address}
                </p>
              )}
              {report.description && (
                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                  {report.description}
                </p>
              )}
              {report.reported_by && (
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#999' }}>
                  Reportado por: {report.reported_by}
                </p>
              )}
              {report.created_at && (
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#999' }}>
                  {new Date(report.created_at).toLocaleString('es-AR')}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

