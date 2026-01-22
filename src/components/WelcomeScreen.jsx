import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function WelcomeScreen({ onRoleSelect }) {
    const [showAdminEntry, setShowAdminEntry] = useState(false)
    const [passcode, setPasscode] = useState('')
    const [error, setError] = useState('')

    const handleAdminVerify = async (e) => {
        e.preventDefault()
        setError('')

        try {
            const response = await fetch('/api/verify-passcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                onRoleSelect('admin', passcode)
            } else {
                setError('Parola d\'ordine errata.')
                setPasscode('')
            }
        } catch (err) {
            console.error(err)
            setError('Errore di connessione al server.')
        }
    }

    if (showAdminEntry) {
        return (
            <div className="glass-card" style={{ maxWidth: '400px', margin: 'clamp(2rem, 10vh, 6rem) auto', textAlign: 'center' }}>
                <h2 className="mb-2">Accesso Admin</h2>
                <p className="text-muted mb-4">Inserisci la parola d'ordine</p>

                <form onSubmit={handleAdminVerify}>
                    <input
                        type="password"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="Parola d'ordine"
                        className="input-field mb-4"
                        autoFocus
                    />
                    {error && <p style={{ color: 'var(--error)', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={() => setShowAdminEntry(false)} className="btn-secondary" style={{ flex: 1 }}>
                            Indietro
                        </button>
                        <button type="submit" className="btn-premium" style={{ flex: 1 }}>
                            Entra
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', textAlign: 'center' }}>
            <img src="/logo-apg.png" alt="APG Logo" style={{ height: 'clamp(80px, 15vw, 120px)', width: 'auto', marginBottom: '2rem' }} />
            <h1 className="mb-4">Benvenuto al Workshop Bias AI</h1>
            <p className="text-muted" style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', maxWidth: '600px', marginBottom: '3rem' }}>
                Unisciti a noi nell'esplorazione e analisi della parità di genere nei modelli di intelligenza artificiale generativa.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '800px' }}>
                <button
                    onClick={() => onRoleSelect('participant')}
                    className="glass-card"
                    style={{
                        padding: '2.5rem 1.5rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: '2px solid transparent'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
                    <h3 className="mb-2">Partecipante</h3>
                    <p className="text-muted">Contribuisci all'indagine registrando nuove osservazioni</p>
                </button>

                <button
                    onClick={() => setShowAdminEntry(true)}
                    className="glass-card"
                    style={{
                        padding: '2.5rem 1.5rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: '2px solid transparent'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--secondary)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
                    <h3 className="mb-2">Admin</h3>
                    <p className="text-muted">Gestione sistema, chiavi API e monitoraggio globale</p>
                </button>
            </div>
        </div>
    )
}

export default WelcomeScreen
