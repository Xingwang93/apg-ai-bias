import { useState, useEffect } from 'react'
// Triggering deployment for Imagen 3 support
import DataEntry from './components/DataEntry'
import Dashboard from './components/Dashboard'
import Gallery from './components/Gallery'
import WelcomeScreen from './components/WelcomeScreen'
import AdminPanel from './components/AdminPanel'
import { supabase } from './lib/supabaseClient'

function App() {
  const [activeTab, setActiveTab] = useState('input')
  const [entries, setEntries] = useState([])
  const [userRole, setUserRole] = useState(null) // null, 'participant', 'admin'
  const [adminPasscode, setAdminPasscode] = useState(null)

  // Safety check for missing Supabase configuration
  if (!supabase) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <h2>Errore di Configurazione</h2>
        <p>Le chiavi API di Supabase non sono state trovate.</p>
        <p>Assicuratevi che le variabili d'ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY siano impostate nel pannello di controllo Vercel.</p>
      </div>
    )
  }

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
          gender_bias: entry.gender_bias,
          notes: entry.notes,
          image_url: publicImageUrl
        }
      ])

    if (error) {
      alert('Errore nel salvataggio dei dati: ' + error.message)
    }
  }

  // If role is not selected, show welcome screen
  if (!userRole) {
    return (
      <WelcomeScreen
        onRoleSelect={(role, code) => {
          setUserRole(role)
          if (code) setAdminPasscode(code)
        }}
      />
    )
  }

  return (
    <div className="container">
      <header className="app-header">
        <img src="/logo-apg.png" alt="APG Logo" className="logo" />

        <div className="title-section">
          <h1>AI Gender Guard</h1>
          <p className="subtitle">Analisi della Parità di Genere nella GenAI.</p>
          <div className="stats-pill">
            Osservazioni Totali: <strong>{entries.length}</strong>
          </div>
        </div>
      </header>

      {userRole === 'admin' ? (
        <AdminPanel
          onExit={() => setUserRole('participant')}
          adminPasscode={adminPasscode}
        />
      ) : (
        <>
          <nav className="nav-tabs">
            <button
              onClick={() => setActiveTab('input')}
              className={`btn tab-btn ${activeTab === 'input' ? 'active' : ''}`}
            >
              Nuova Analisi
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`btn tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              Statistiche
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`btn tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
            >
              Galleria Live
            </button>
          </nav>

          <main className="app-main">
            {activeTab === 'input' && (
              <DataEntry onAddEntry={addEntry} userRole={userRole} />
            )}
            {activeTab === 'dashboard' && (
              <Dashboard entries={entries} />
            )}
            {activeTab === 'gallery' && (
              <Gallery entries={entries} />
            )}
          </main>
        </>
      )}

      <style>{`
        .app-header {
          text-align: center;
          margin-bottom: var(--space-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          position: relative;
        }
        .logo {
          height: 80px;
          width: auto;
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.1));
        }
        .title-section h1 {
          margin-bottom: 0.2rem;
        }
        .subtitle {
          color: var(--text-muted);
          font-weight: 500;
          letter-spacing: 0.05em;
        }
        .stats-pill {
          display: inline-block;
          margin-top: 1rem;
          background: var(--secondary);
          color: white;
          padding: 0.3rem 1.2rem;
          border-radius: 999px;
          font-size: 0.9rem;
          box-shadow: 0 4px 12px rgba(0, 51, 153, 0.2);
        }
        @media (max-width: 768px) {
          .app-header { gap: 1rem; }
        }
      `}</style>
    </div>
  )
}

export default App
