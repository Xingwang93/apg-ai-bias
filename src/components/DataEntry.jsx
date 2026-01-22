import { useState, useEffect } from 'react'

function DataEntry({ onAddEntry, userRole }) {
    const [formData, setFormData] = useState({
        prompt: '',
        model: 'FLUX.1 (Hugging Face)',
        provider: 'hf',
        gender_bias: 'Male',
        notes: ''
    })

    // Removed tokens state and key fetching useEffect as they are now securely managed on the backend

    const [generatedImage, setGeneratedImage] = useState(null)
    const [imageBlob, setImageBlob] = useState(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState('')

    // We assume generation is enabled by default for UI, backend will enforce check. 
    // If backend returns "Generation Disabled" (403), we show it then.
    const [generationEnabled, setGenerationEnabled] = useState(true)

    const handleGenerate = async () => {
        if (!formData.prompt) {
            alert('Inserisci prima un prompt!')
            return
        }

        setIsGenerating(true)
        setGeneratedImage(null)
        setError('')
        setGenerationEnabled(true) // Reset enabling on new attempt

        try {
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

            if (!response.ok) {
                if (response.status === 403) {
                    setGenerationEnabled(false) // Disable UI feedback
                    throw new Error('La generazione è stata disattivata dall\'amministratore.')
                }
                throw new Error(data.error || 'Errore nella generazione.')
            }

            // Convert URL to Blob for storage uploading later (since our workflow saves blobs)
            // Note: The backend returns a public URL or Base64. 
            // If URL, we fetch it here to turn into Blob.
            const imgRes = await fetch(data.imageUrl)
            const blob = await imgRes.blob()

            setGeneratedImage(data.imageUrl)
            setImageBlob(blob)

        } catch (err) {
            console.error(err)
            setError(err.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        // Frontend Validation
        if (!formData.prompt || !imageBlob) {
            alert('Genera prima un immagine!')
            return
        }

        if (formData.prompt.length > 500) {
            alert('Prompt troppo lungo (max 500 caratteri)')
            return
        }

        // Sanitization: Remove potential HTML tags to prevent edge-case XSS
        const sanitizedData = {
            ...formData,
            prompt: formData.prompt.replace(/<[^>]*>?/gm, ''),
            notes: formData.notes.replace(/<[^>]*>?/gm, '')
        }

        onAddEntry(sanitizedData, imageBlob)

        setFormData(prev => ({ ...prev, prompt: '', notes: '' }))
        setGeneratedImage(null)
        setImageBlob(null)
        setError('')
    }

    return (
        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Nuova Osservazione</h2>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Prompt Utilizzato</label>
                    <div className="prompt-container" style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="es. Un dottore in ospedale"
                            value={formData.prompt}
                            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                        />
                        <button
                            type="button"
                            className="btn-premium"
                            onClick={handleGenerate}
                            disabled={isGenerating || !generationEnabled}
                            style={{
                                minWidth: '140px',
                                opacity: generationEnabled ? 1 : 0.5,
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {isGenerating ? (
                                <span className="loader-dots">
                                    <span>.</span><span>.</span><span>.</span>
                                </span>
                            ) : (
                                <>
                                    <span style={{ marginRight: '8px' }}>✨</span>
                                    {generationEnabled ? 'Genera Img' : 'DISATTIVATO'}
                                </>
                            )}
                        </button>
                    </div>
                    <style>{`
                        @media (max-width: 600px) {
                            .prompt-container {
                                flex-direction: column;
                            }
                            .btn-premium {
                                width: 100%;
                            }
                        }
                        .btn-premium {
                            background: linear-gradient(135deg, #FF6600 0%, #FF9966 100%);
                            color: white;
                            border: none;
                            padding: 0.8rem 1.5rem;
                            border-radius: var(--radius-sm);
                            font-weight: 700;
                            font-family: 'Outfit', sans-serif;
                            cursor: pointer;
                            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
                            box-shadow: 0 4px 15px rgba(255, 102, 0, 0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            font-size: 0.85rem;
                        }

                        .btn-premium:hover:not(:disabled) {
                            transform: translateY(-2px) scale(1.02);
                            box-shadow: 0 6px 20px rgba(255, 102, 0, 0.4);
                            background: linear-gradient(135deg, #FF7722 0%, #FFAA77 100%);
                        }

                        .btn-premium:active:not(:disabled) {
                            transform: translateY(0) scale(0.98);
                        }

                        .btn-premium:disabled {
                            background: #9CA3AF;
                            box-shadow: none;
                            cursor: not-allowed;
                        }

                        .loader-dots span {
                            animation: blink 1.4s infinite both;
                            font-size: 1.5rem;
                            line-height: 0;
                        }

                        .loader-dots span:nth-child(2) { animation-delay: 0.2s; }
                        .loader-dots span:nth-child(3) { animation-delay: 0.4s; }

                        @keyframes blink {
                            0% { opacity: 0.2; }
                            20% { opacity: 1; }
                            100% { opacity: 0.2; }
                        }
                    `}</style>
                    {error && (
                        <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            {error}
                        </p>
                    )}
                </div>

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
                    {isGenerating && <span style={{ color: 'var(--secondary)' }}>Generazione in corso...</span>}
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
                        placeholder="Note opzionali..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={!imageBlob || isGenerating}>
                    Salva Osservazione
                </button>
            </form>
        </div>
    )
}

export default DataEntry
