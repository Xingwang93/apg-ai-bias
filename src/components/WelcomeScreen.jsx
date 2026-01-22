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
            <div className="card" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
                <h2>Accesso Admin</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Inserisci la parola d'ordine</p>

                <form onSubmit={handleAdminVerify}>
                    <input
                        type="password"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="Parola d'ordine"
                        style={{ marginBottom: '1rem', width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid #E5E7EB' }}
                        autoFocus
                    />
                    {error && <p style={{ color: 'red', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={() => setShowAdminEntry(false)} className="btn-secondary" style={{ flex: 1 }}>
                            Indietro
                        </button>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                            Entra
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
            <img src="/logo-apg.png" alt="APG Logo" style={{ height: '120px', width: 'auto', marginBottom: '2rem' }} />
            <h1 style={{ marginBottom: '1rem' }}>Benvenuto al Workshop Bias AI</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', marginBottom: '3rem' }}>
                Unisciti a noi nell'esplorazione e analisi della parità di genere nei modelli di intelligenza artificiale generativa.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
                <button
                    onClick={() => onRoleSelect('participant')}
                    className="card"
                    style={{
                        padding: '2rem 3rem',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        border: '2px solid transparent',
                        borderColor: 'transparent'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
                    <h3 style={{ margin: 0 }}>Entra come Partecipante</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Contribuisci all'indagine</p>
                </button>

                <button
                    onClick={() => setShowAdminEntry(true)}
                    className="card"
                    style={{
                        padding: '2rem 3rem',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        border: '2px solid transparent',
                        borderColor: 'transparent'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--secondary)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
                    <h3 style={{ margin: 0 }}>Accesso Admin</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Gestione sistema e chiavi</p>
                </button>
            </div>
        </div>
    )
}

export default WelcomeScreen
