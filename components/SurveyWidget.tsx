'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './SurveyWidget.module.css'

interface SurveyWidgetProps {
  question: string
  questionKey: string
}

export default function SurveyWidget({ question, questionKey }: SurveyWidgetProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (answer: string) => {
    if (submitted) return

    setLoading(true)
    setError('')

    try {
      const { error: supabaseError } = await supabase
        .from('surveys')
        .insert([
          {
            question: questionKey,
            answer: answer,
          },
        ])

      if (supabaseError) throw supabaseError

      setSelectedAnswer(answer)
      setSubmitted(true)
    } catch (err: any) {
      console.error('Error guardando encuesta:', err)
      setError('Error al guardar tu respuesta. Por favor, intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className={styles.surveyContainer}>
        <h3 className={styles.surveyTitle}>{question}</h3>
        <div className={styles.thankYou}>
          <p>✅ Gracias por tu respuesta!</p>
          <p className={styles.selectedAnswer}>Tu respuesta: <strong>{selectedAnswer}</strong></p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.surveyContainer}>
      <h3 className={styles.surveyTitle}>{question}</h3>
      <div className={styles.answers}>
        <button
          className={`${styles.answerButton} ${selectedAnswer === 'Buena' ? styles.selected : ''}`}
          onClick={() => handleSubmit('Buena')}
          disabled={loading}
        >
          ✅ Buena
        </button>
        <button
          className={`${styles.answerButton} ${selectedAnswer === 'Regular' ? styles.selected : ''}`}
          onClick={() => handleSubmit('Regular')}
          disabled={loading}
        >
          ⚠️ Regular
        </button>
        <button
          className={`${styles.answerButton} ${selectedAnswer === 'Mala' ? styles.selected : ''}`}
          onClick={() => handleSubmit('Mala')}
          disabled={loading}
        >
          ❌ Mala
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loading}>Guardando...</div>}
    </div>
  )
}

