'use client'

import { useState, useEffect } from 'react'
import styles from './WeatherWidget.module.css'

interface WeatherData {
  temperature: number
  description: string
  loading: boolean
  error: string | null
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 0,
    description: '',
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Usar open-meteo (API gratuita sin key, muy confiable)
        // Coordenadas de Sarmiento, San Juan: -31.9742, -68.4231
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=-31.9742&longitude=-68.4231&current=temperature_2m,weather_code&timezone=America%2FArgentina%2FSan_Juan'
        )
        
        if (!response.ok) {
          throw new Error('Error al obtener el clima')
        }
        
        const data = await response.json()
        const temp = Math.round(data.current.temperature_2m)
        
        // Mapear códigos de clima a descripciones
        const weatherCodes: { [key: number]: string } = {
          0: 'Despejado',
          1: 'Mayormente despejado',
          2: 'Parcialmente nublado',
          3: 'Nublado',
          45: 'Niebla',
          48: 'Niebla con escarcha',
          51: 'Llovizna ligera',
          53: 'Llovizna moderada',
          55: 'Llovizna densa',
          61: 'Lluvia ligera',
          63: 'Lluvia moderada',
          65: 'Lluvia fuerte',
          71: 'Nieve ligera',
          73: 'Nieve moderada',
          75: 'Nieve fuerte',
          80: 'Chubascos ligeros',
          81: 'Chubascos moderados',
          82: 'Chubascos fuertes',
          95: 'Tormenta',
          96: 'Tormenta con granizo',
          99: 'Tormenta fuerte con granizo'
        }
        
        const description = weatherCodes[data.current.weather_code] || 'Despejado'
        
        setWeather({
          temperature: temp,
          description: description,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error fetching weather:', error)
        setWeather({
          temperature: 0,
          description: '',
          loading: false,
          error: 'No disponible'
        })
      }
    }

    fetchWeather()
    
    // Actualizar cada 30 minutos
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  if (weather.loading) {
    return (
      <div className={styles.weatherWidget}>
        <div className={styles.weatherIcon}>🌡️</div>
        <div className={styles.weatherInfo}>
          <div className={styles.temperature}>...</div>
          <div className={styles.description}>Cargando...</div>
        </div>
      </div>
    )
  }

  if (weather.error) {
    return (
      <div className={styles.weatherWidget}>
        <div className={styles.weatherIcon}>🌡️</div>
        <div className={styles.weatherInfo}>
          <div className={styles.temperature}>--</div>
          <div className={styles.description}>Clima no disponible</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.weatherWidget}>
      <div className={styles.weatherIcon}>🌡️</div>
      <div className={styles.weatherInfo}>
        <div className={styles.temperature}>{weather.temperature}°C</div>
        <div className={styles.description}>Sarmiento, SJ</div>
      </div>
    </div>
  )
}

