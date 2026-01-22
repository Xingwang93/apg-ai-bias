import { useState, useEffect } from 'react'
import { HfInference } from '@huggingface/inference'

function DataEntry({ onAddEntry }) {
    const [formData, setFormData] = useState({
        prompt: '',
        model: 'FLUX.1 (Hugging Face)',
        provider: 'hf', // 'hf', 'openai', 'google', 'replicate'
        gender_bias: 'Male',
        notes: ''
    })

    const [hfToken, setHfToken] = useState('')
    const [showTokenInput, setShowTokenInput] = useState(false)
    const [generatedImage, setGeneratedImage] = useState(null)
    const [imageBlob, setImageBlob] = useState(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const savedToken = localStorage.getItem('hf_token')
        if (savedToken) setHfToken(savedToken)
        else setShowTokenInput(true)
    }, [])

    const saveToken = (token) => {
        setHfToken(token)
        localStorage.setItem('hf_token', token)
        setShowTokenInput(false)
    }

    const handleGenerate = async () => {
        if (!formData.prompt) {
            alert('Inserisci prima un prompt!')
            return
        }
        if (!hfToken) {
            alert('Devi impostare il tuo Token Hugging Face prima!')
            setShowTokenInput(true)
            return
        }

        setIsGenerating(true)
        setGeneratedImage(null)
        setError('')

        try {
            // New logic: Use the Vercel API proxy if not using local HF token
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: formData.prompt,
                    provider: formData.provider,
                    model: formData.model
                })
            })

            const data = await response.json()
            if (data.error) throw new Error(data.error)

            // Since our proxy returns a URL, we need to fetch it to get a blob for Supabase
            const imgRes = await fetch(data.imageUrl)
            const blob = await imgRes.blob()

            setGeneratedImage(data.imageUrl)
            setImageBlob(blob)
        } catch (err) {
            console.error(err)
            setError('Errore: ' + err.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.prompt) return

        onAddEntry({
            ...formData
        }, imageBlob)

        // Reset form
        setFormData({
            prompt: '',
            model: 'Hugging Face (FLUX.1)',
            genderBias: 'Male',
            notes: ''
        })
        setGeneratedImage(null)
        setImageBlob(null)
    }

    return (
        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>

            {/* Token Usage Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Nuova Osservazione</h2>
                <button
                    onClick={() => setShowTokenInput(!showTokenInput)}
                    style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'underline' }}
                >
                    {hfToken ? 'Modifica Token' : 'Imposta Token'}
                </button>
            </div>

            {showTokenInput && (
                <div style={{ background: '#F3F4F6', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid #E5E7EB' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Token Hugging Face (Scrittura)</label>
                    <input
                        type="password"
                        className="input-field"
                        value={hfToken}
                        onChange={(e) => saveToken(e.target.value)}
                        placeholder="hf_..."
                    />
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>
                        Ottienilo gratis su <a href="https://huggingface.co/settings/tokens" target="_blank" style={{ color: 'var(--secondary)' }}>huggingface.co/settings/tokens</a>
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Prompt Utilizzato</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="es. Un dottore in ospedale"
                            value={formData.prompt}
                            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                        />
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            style={{ minWidth: '130px' }}
                        >
                            {isGenerating ? '...' : 'Genera Img'}
                        </button>
                    </div>
                </div>

                {/* Image Preview Area */}
                <div style={{
                    minHeight: '300px',
                    background: '#F9FAFB',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #E5E7EB',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {isGenerating && <span style={{ color: 'var(--secondary)' }}>Generazione in corso (FLUX.1)...</span>}
                    {error && <span style={{ color: '#ef4444', padding: '1rem', textAlign: 'center' }}>{error}</span>}

                    {!isGenerating && !generatedImage && !error && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            L'immagine apparirà qui
                        </span>
                    )}

                    {generatedImage && (
                        <img
                            src={generatedImage}
                            alt="Risultato Generato"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    )}
                </div>

                <div className="grid-cols-2" style={{ marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Provider / Modello</label>
                        <select
                            className="input-field"
                            value={`${formData.provider}:${formData.model}`}
                            onChange={(e) => {
                                const [provider, model] = e.target.value.split(':')
                                setFormData({ ...formData, provider, model })
                            }}
                        >
                            <option value="hf:FLUX.1 (Hugging Face)">Hugging Face (FLUX.1)</option>
                            <option value="openai:DALL-E 3">OpenAI (DALL-E 3)</option>
                            <option value="replicate:Flux Dev">Replicate (Flux Dev)</option>
                            <option value="google:Imagen 3">Google (Imagen 3)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Genere Percepito</label>
                        <select
                            className="input-field"
                            value={formData.gender_bias}
                            onChange={(e) => setFormData({ ...formData, gender_bias: e.target.value })}
                        >
                            <option value="Male">Prevalentemente Maschile</option>
                            <option value="Female">Prevalentemente Femminile</option>
                            <option value="Balanced">Bilanciato/Neutro</option>
                            <option value="Ambiguous">Ambiguo/Non-binary</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Note / Altri Bias</label>
                    <textarea
                        className="input-field"
                        rows="3"
                        placeholder="es. Notata anche mancanza di diversità etnica..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                    Salva Osservazione
                </button>
            </form>
        </div>
    )
}

export default DataEntry
