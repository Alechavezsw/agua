'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
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

// Icono personalizado para el marcador arrastrable
const draggableIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#ef4444" stroke="white" stroke-width="3"/>
      <circle cx="20" cy="20" r="8" fill="white"/>
      <path d="M20 12 L20 28 M12 20 L28 20" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
})

interface DraggableMapProps {
  initialPosition: { lat: number; lng: number }
  onLocationChange: (lat: number, lng: number) => void
}

function DraggableMarker({ 
  position, 
  onDragEnd 
}: { 
  position: [number, number]
  onDragEnd: (lat: number, lng: number) => void 
}) {
  return (
    <Marker
      position={position}
      icon={draggableIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target
          const position = marker.getLatLng()
          onDragEnd(position.lat, position.lng)
        },
      }}
    />
  )
}

// Componente para centrar el mapa en la posición inicial
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  
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

export default function DraggableMap({ initialPosition, onLocationChange }: DraggableMapProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([
    initialPosition.lat,
    initialPosition.lng
  ])

  useEffect(() => {
    setMarkerPosition([initialPosition.lat, initialPosition.lng])
  }, [initialPosition])

  const zoom = 16

  return (
    <MapContainer
      center={markerPosition}
      zoom={zoom}
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      scrollWheelZoom={true}
      dragging={true}
      touchZoom={true}
      doubleClickZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapResizeHandler />
      <MapCenter center={markerPosition} />
      
      <DraggableMarker
        position={markerPosition}
        onDragEnd={(lat, lng) => {
          setMarkerPosition([lat, lng])
          onLocationChange(lat, lng)
        }}
      />
    </MapContainer>
  )
}

