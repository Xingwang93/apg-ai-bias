import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import WelcomeScreen from './WelcomeScreen'
import DataEntry from './DataEntry'
import Gallery from './Gallery'

function Dashboard({ onLogout, adminPasscode }) {
    const [entries, setEntries] = useState([])
    const [view, setView] = useState('welcome') // 'welcome', 'entry', 'gallery'
    const [loading, setLoading] = useState(true)

    const fetchEntries = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('observations')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) console.error('Error fetching:', error)
        else setEntries(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchEntries()
    }, [])

    const handleAddEntry = async (formData, imageBlob) => {
        try {
            // 1. Upload Image to Storage
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('images')
                .upload(fileName, imageBlob)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName)

            // 2. Save Data to Database
            const { error: dbError } = await supabase
                .from('observations')
                .insert([{
                    prompt: formData.prompt,
                    model: formData.model,
                    provider: formData.provider,
                    image_url: publicUrl,
                    gender_bias: formData.gender_bias,
                    notes: formData.notes
                }])

            if (dbError) throw dbError

            // 3. Refresh and switch view
            await fetchEntries()
            setView('gallery')

        } catch (error) {
            alert('Errore nel salvataggio: ' + error.message)
        }
    }

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem 0',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <img src="/apg-logo.png" alt="APG Logo" style={{ height: '40px' }} />
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
                        AI BIAS EXPLORER
                    </h1>
                </div>
                <button onClick={onLogout} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    Esci
                </button>
            </header>

            <nav className="glass-card" style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.5rem',
                marginBottom: '2rem',
                borderRadius: '16px'
            }}>
                <button
                    className={`btn-nav ${view === 'welcome' ? 'active' : ''}`}
                    onClick={() => setView('welcome')}
                    style={{ flex: 1 }}
                >
                    Guida
                </button>
                <button
                    className={`btn-nav ${view === 'entry' ? 'active' : ''}`}
                    onClick={() => setView('entry')}
                    style={{ flex: 1 }}
                >
                    Nuova Osservazione
                </button>
                <button
                    className={`btn-nav ${view === 'gallery' ? 'active' : ''}`}
                    onClick={() => setView('gallery')}
                    style={{ flex: 1 }}
                >
                    Galleria ({entries.length})
                </button>
            </nav>

            <main>
                {view === 'welcome' && <WelcomeScreen onStart={() => setView('entry')} />}
                {view === 'entry' && <DataEntry onAddEntry={handleAddEntry} userRole="participant" />}
                {view === 'gallery' && <Gallery entries={entries} loading={loading} />}
            </main>
        </div>
    )
}

export default Dashboard
