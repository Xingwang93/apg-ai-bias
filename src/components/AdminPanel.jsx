import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

function AdminPanel({ onExit, adminPasscode }) {
    const [configs, setConfigs] = useState([])
    const [newKey, setNewKey] = useState('')
    const [newValue, setNewValue] = useState('')
    const [loading, setLoading] = useState(true)

    const fetchConfigs = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/config', {
                headers: { 'x-admin-passcode': adminPasscode }
            })
            if (response.ok) {
                const data = await response.json()
                setConfigs(data || [])
            } else {
                console.error('Failed to fetch configs')
            }
        } catch (error) {
            console.error('Error fetching configs:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchConfigs()
    }, [])

    const handleSaveConfig = async (e) => {
        e.preventDefault()
        if (!newKey || !newValue) return

        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-passcode': adminPasscode
                },
                body: JSON.stringify({ config_key: newKey, config_value: newValue })
            })

            if (!response.ok) {
                const err = await response.json()
                alert('Errore nel salvataggio: ' + (err.error || 'Unknown error'))
            } else {
                setNewKey('')
                setNewValue('')
                fetchConfigs()
            }
        } catch (error) {
            alert('Errore di rete: ' + error.message)
        }
    }

    const handleDelete = async (key) => {
        if (!confirm(`Sei sicuro di voler eliminare la configurazione "${key}"?`)) return

        try {
            const response = await fetch('/api/config', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-passcode': adminPasscode
                },
                body: JSON.stringify({ config_key: key })
            })

            if (!response.ok) {
                const err = await response.json()
                alert('Errore nell\'eliminazione: ' + (err.error || 'Unknown error'))
            } else {
                fetchConfigs()
            }
        } catch (error) {
            alert('Errore di rete: ' + error.message)
        }
    }

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Pannello Amministrazione</h2>
                <button onClick={onExit} className="btn-secondary">Esci</button>
            </div>

            <section style={{ marginBottom: '3rem', padding: '1.5rem', background: '#FFF7ED', borderRadius: 'var(--radius-sm)', border: '1px solid #FFEDD5' }}>
                <h3 style={{ marginTop: 0 }}>Controllo Globale Workshop</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <p style={{ margin: 0, flex: 1 }}><strong>Disattiva Generazione:</strong> Usa questo per impedire ai partecipanti di generare immagini (es. se le API sono finite o per pausa).</p>
                    <button
                        onClick={async () => {
                            const currentStatus = configs.find(c => c.config_key === 'GENERATION_ENABLED')?.config_value === 'true'
                            const newValue = (!currentStatus).toString()

                            try {
                                await fetch('/api/config', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'x-admin-passcode': adminPasscode
                                    },
                                    body: JSON.stringify({ config_key: 'GENERATION_ENABLED', config_value: newValue })
                                })
                                fetchConfigs()
                            } catch (error) {
                                alert('Errore aggiornamento stato: ' + error.message)
                            }
                        }}
                        className={configs.find(c => c.config_key === 'GENERATION_ENABLED')?.config_value === 'true' ? 'btn-primary' : 'btn-secondary'}
                        style={{
                            backgroundColor: configs.find(c => c.config_key === 'GENERATION_ENABLED')?.config_value === 'true' ? '#22C55E' : '#EF4444',
                            color: 'white',
                            border: 'none'
                        }}
                    >
                        {configs.find(c => c.config_key === 'GENERATION_ENABLED')?.config_value === 'true' ? 'API ATTIVE' : 'API SPENTE'}
                    </button>
                </div>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h3>Aggiungi / Aggiorna Configurazione</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem', background: '#F0F9FF', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid #BAE6FD' }}>
                    💡 <strong>Nomi Chiavi Standard:</strong> Per far funzionare i modelli, usa questi nomi precisi:<br />
                    - <code>OPENAI_API_KEY</code> (per DALL-E 3)<br />
                    - <code>HF_TOKEN</code> (per Hugging Face/Flux)<br />
                    - <code>REPLICATE_API_TOKEN</code> (per Replicate)<br />
                    - <code>GOOGLE_API_KEY</code> (per Imagen 3)
                </p>
                <form onSubmit={handleSaveConfig} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: 600 }}>Nome Chiave</label>
                        <input
                            type="text"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            placeholder="es. OPENAI_API_KEY"
                            style={{ width: '100%', padding: '0.6rem', border: '1px solid #E5E7EB', borderRadius: 'var(--radius-sm)' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: 600 }}>Valore</label>
                        <input
                            type="text"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            placeholder="Inserisci valore"
                            style={{ width: '100%', padding: '0.6rem', border: '1px solid #E5E7EB', borderRadius: 'var(--radius-sm)' }}
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '0.6rem 2rem' }}>Salva</button>
                </form>
            </section>

            <section>
                <h3>Configurazioni Attuali</h3>
                {loading ? (
                    <p>Caricamento...</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
                                    <th style={{ padding: '1rem 0.5rem' }}>Chiave</th>
                                    <th style={{ padding: '1rem 0.5rem' }}>Valore</th>
                                    <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {configs.map((config) => (
                                    <tr key={config.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                        <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>{config.config_key}</td>
                                        <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                            {config.config_key.includes('KEY') || config.config_key.includes('TOKEN') || config.config_key === 'ADMIN_PASSCODE' ? '••••••••••••' : config.config_value}
                                        </td>
                                        <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDelete(config.config_key)}
                                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                                Elimina
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {configs.length === 0 && (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            Nessuna configurazione trovata.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}

export default AdminPanel
