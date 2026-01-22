import { useState, useEffect } from 'react'

function DataEntry({ onAddEntry, userRole }) {
    const [formData, setFormData] = useState({
        prompt: '',
        model: 'FLUX.1 (Hugging Face)',
        provider: 'hf',
        gender_bias: 'Male',
        notes: ''
    })

    const [tokens, setTokens] = useState({
        hf: '',
        openai: '',
        replicate: ''
    })
    const [showTokenInput, setShowTokenInput] = useState(false)
    const [generatedImage, setGeneratedImage] = useState(null)
    const [imageBlob, setImageBlob] = useState(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState('')
    const [generationEnabled, setGenerationEnabled] = useState(true)

    useEffect(() => {
        const saved = {
            hf: localStorage.getItem('hf_token') || '',
            openai: localStorage.getItem('openai_token') || '',
            replicate: localStorage.getItem('replicate_token') || ''
        }

        // Fetch keys and settings from Supabase
        const fetchRemoteConfig = async () => {
            const { data } = await supabase
                .from('app_config')
                .select('config_key, config_value')

            if (data) {
                const configMap = {}
                data.forEach(item => {
                    configMap[item.config_key] = item.config_value
                })

                // Update generation status
                if (configMap['GENERATION_ENABLED'] !== undefined) {
                    setGenerationEnabled(configMap['GENERATION_ENABLED'] === 'true')
                }

                // Inject keys from DB if matching our expected names
                setTokens({
                    hf: saved.hf || configMap['HF_TOKEN'] || '',
                    openai: saved.openai || configMap['OPENAI_API_KEY'] || '',
                    replicate: saved.replicate || configMap['REPLICATE_API_TOKEN'] || ''
                })
            } else {
                setTokens(saved)
            }
        }

        fetchRemoteConfig()
    }, [])

    const handleTokenChange = (provider, value) => {
        setTokens(prev => ({ ...prev, [provider]: value }))
        localStorage.setItem(`${provider}_token`, value)
    }

    const handleGenerate = async () => {
        if (!formData.prompt) {
            alert('Inserisci prima un prompt!')
            return
        }

        setIsGenerating(true)
        setGeneratedImage(null)
        setError('')

        try {
            // Client-side logic for providers if keys are present
            if (formData.provider === 'hf' && tokens.hf) {
                const { HfInference } = await import('@huggingface/inference')
                const hf = new HfInference(tokens.hf)
                const response = await hf.textToImage({
                    model: 'black-forest-labs/FLUX.1-dev',
                    inputs: formData.prompt,
                    parameters: { height: 1024, width: 1024 }
                })
                const imageUrl = URL.createObjectURL(response)
                setGeneratedImage(imageUrl)
                setImageBlob(response)
            } else if (formData.provider === 'openai' && tokens.openai) {
                const response = await fetch('https://api.openai.com/v1/images/generations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${tokens.openai}`
                    },
                    body: JSON.stringify({
                        model: 'dall-e-3',
                        prompt: formData.prompt,
                        n: 1,
                        size: '1024x1024'
                    })
                })
                const data = await response.json()
                if (data.error) throw new Error(data.error.message)
                const imageUrl = data.data[0].url

                const imgRes = await fetch(imageUrl)
                const blob = await imgRes.blob()
                setGeneratedImage(imageUrl)
                setImageBlob(blob)
            } else {
                // Fallback to Vercel Proxy
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

                const imgRes = await fetch(data.imageUrl)
                const blob = await imgRes.blob()

                setGeneratedImage(data.imageUrl)
                setImageBlob(blob)
            }
        } catch (err) {
            console.error(err)
            setError('Errore: ' + err.message)
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
    }

    return (
        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Nuova Osservazione</h2>
                {userRole === 'admin' && (
                    <button
                        onClick={() => setShowTokenInput(!showTokenInput)}
                        style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'underline' }}
                    >
                        {showTokenInput ? 'Chiudi Impostazioni' : 'Gestisci Chiavi API'}
                    </button>
                )}
            </div>

            {showTokenInput && (
                <div style={{ background: '#F3F4F6', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid #E5E7EB' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.8rem' }}>OpenAI API Key (DALL-E 3)</label>
                        <input
                            type="password"
                            className="input-field"
                            value={tokens.openai}
                            onChange={(e) => handleTokenChange('openai', e.target.value)}
                            placeholder="sk-..."
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.8rem' }}>Replicate API Token (Flux)</label>
                        <input
                            type="password"
                            className="input-field"
                            value={tokens.replicate}
                            onChange={(e) => handleTokenChange('replicate', e.target.value)}
                            placeholder="r8_..."
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.8rem' }}>Hugging Face Token</label>
                        <input
                            type="password"
                            className="input-field"
                            value={tokens.hf}
                            onChange={(e) => handleTokenChange('hf', e.target.value)}
                            placeholder="hf_..."
                        />
                    </div>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                        Le chiavi sono salvate solo localmente nel tuo browser.
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
                            disabled={isGenerating || !generationEnabled}
                            style={{ minWidth: '130px', opacity: generationEnabled ? 1 : 0.5 }}
                        >
                            {isGenerating ? '...' : (generationEnabled ? 'Genera Img' : 'API DISATTIVATE')}
                        </button>
                    </div>
                    {!generationEnabled && (
                        <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            La generazione è stata temporaneamente disattivata dall'amministratore.
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
