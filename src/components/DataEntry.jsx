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
                <div className="mb-4">
                    <label className="text-muted mb-2" style={{ display: 'block' }}>Prompt Utilizzato</label>
                    <div className="input-group" style={{ display: 'flex', gap: '0.8rem' }}>
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
                                minWidth: '150px',
                                opacity: generationEnabled ? 1 : 0.5
                            }}
                        >
                            {isGenerating ? (
                                <span className="loader-dots">
                                    <span>.</span><span>.</span><span>.</span>
                                </span>
                            ) : (
                                <>
                                    <span>✨</span>
                                    {generationEnabled ? 'Genera' : 'API OFF'}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div style={{
                    minHeight: '280px',
                    background: '#F3F4F6',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #D1D5DB',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {isGenerating && <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Generazione in corso...</span>}
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
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                    )}
                </div>

                <div className="grid-cols-2" style={{ marginBottom: '1.5rem' }}>
                    <div>
                        <label className="text-muted mb-2" style={{ display: 'block' }}>Provider / Modello</label>
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
                        <label className="text-muted mb-2" style={{ display: 'block' }}>Genere Percepito</label>
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
                    <label className="text-muted mb-2" style={{ display: 'block' }}>Note / Altri Bias</label>
                    <textarea
                        className="input-field"
                        rows="3"
                        placeholder="Note opzionali..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        style={{ height: 'auto' }}
                    />
                </div>

                <button type="submit" className="btn-premium" style={{ width: '100%', background: 'var(--secondary)' }} disabled={!imageBlob || isGenerating}>
                    Salva Osservazione
                </button>
            </form>
        </div>
    )
}

export default DataEntry
