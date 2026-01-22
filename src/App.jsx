import { useState, useEffect } from 'react'
import DataEntry from './components/DataEntry'
import Dashboard from './components/Dashboard'
import Gallery from './components/Gallery'
import { supabase } from './lib/supabaseClient'

function App() {
  const [activeTab, setActiveTab] = useState('input')
  const [entries, setEntries] = useState([])

  useEffect(() => {
    // 1. Fetch initial data
    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from('observations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) console.error('Error fetching:', error)
      else setEntries(data || [])
    }

    fetchEntries()

    // 2. Subscribe to Realtime changes
    const channel = supabase
      .channel('realtime_observations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'observations' }, (payload) => {
        setEntries((current) => [payload.new, ...current])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const addEntry = async (entry, imageBlob) => {
    let publicImageUrl = null

    // 1. Upload to Supabase Storage if there's an image
    if (imageBlob) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('observations')
        .upload(fileName, imageBlob)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Errore nel caricamento immagine: ' + uploadError.message)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('observations')
        .getPublicUrl(fileName)

      publicImageUrl = publicUrlData.publicUrl
    }

    // 2. Save to database
    const { error } = await supabase
      .from('observations')
      .insert([
        {
          prompt: entry.prompt,
          model: entry.model,
          gender_bias: entry.genderBias,
          notes: entry.notes,
          image_url: publicImageUrl
        }
      ])

    if (error) {
      alert('Errore nel salvataggio dei dati: ' + error.message)
    }
  }

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1>Esploratore Bias AI</h1>
        <p style={{ color: 'var(--text-muted)' }}>Analisi della Parità di Genere nella GenAI</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginTop: '0.5rem' }}>
          Osservazioni Totali: {entries.length}
        </p>
      </header>

      <nav style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('input')}
          className={activeTab === 'input' ? 'btn-primary' : ''}
          style={{
            background: activeTab === 'input' ? 'var(--primary)' : 'white',
            color: activeTab === 'input' ? 'white' : 'var(--text-main)',
            border: activeTab === 'input' ? 'none' : '1px solid #E5E7EB',
            padding: '0.5rem 1.5rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600
          }}
        >
          Inserisci
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={activeTab === 'dashboard' ? 'btn-primary' : ''}
          style={{
            background: activeTab === 'dashboard' ? 'var(--primary)' : 'white',
            color: activeTab === 'dashboard' ? 'white' : 'var(--text-main)',
            border: activeTab === 'dashboard' ? 'none' : '1px solid #E5E7EB',
            padding: '0.5rem 1.5rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600
          }}
        >
          Statistiche
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={activeTab === 'gallery' ? 'btn-primary' : ''}
          style={{
            background: activeTab === 'gallery' ? 'var(--primary)' : 'white',
            color: activeTab === 'gallery' ? 'white' : 'var(--text-main)',
            border: activeTab === 'gallery' ? 'none' : '1px solid #E5E7EB',
            padding: '0.5rem 1.5rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600
          }}
        >
          Galleria
        </button>
      </nav>

      <main>
        {activeTab === 'input' && (
          <DataEntry onAddEntry={addEntry} />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard entries={entries} />
        )}
        {activeTab === 'gallery' && (
          <Gallery entries={entries} />
        )}
      </main>
    </div>
  )
}

export default App
