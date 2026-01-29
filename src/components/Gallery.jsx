function Gallery({ entries, onDelete, userRole, loading }) {
    if (loading) return <div className="text-center py-10">Caricamento galleria...</div>

    if (entries.length === 0) {
        return (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <h3>Galleria Vuota</h3>
                <p style={{ color: 'var(--text-muted)' }}>Registra le prime osservazioni.</p>
            </div>
        )
    }

    const genderMap = {
        'Male': 'Maschile',
        'Female': 'Femminile',
        'Balanced': 'Bilanciato',
        'Ambiguous': 'Ambiguo'
    }

    const handleDownload = async (imageUrl, prompt) => {
        try {
            const response = await fetch(imageUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `ai-bias-${prompt.slice(0, 20)}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Download error:', error)
            alert('Errore nel download dell\'immagine.')
        }
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.2rem'
        }}>
            {entries.map((entry) => (
                <div key={entry.id} className="glass-card" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1rem',
                    fontSize: '0.9rem'
                }}>
                    {/* Image at the top, smaller */}
                    {entry.image_url && (
                        <div style={{
                            marginBottom: '1rem',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            border: '1px solid #E5E7EB',
                            aspectRatio: '1/1',
                            background: '#f9fafb'
                        }}>
                            <img
                                src={entry.image_url}
                                alt={entry.prompt}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                        </div>
                    )}

                    {/* Metadata below image */}
                    <div style={{ marginBottom: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span style={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: 'var(--secondary)',
                                fontWeight: 700
                            }}>
                                {entry.model}
                            </span>
                            <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                                {new Date(entry.created_at).toLocaleDateString('it-IT')}
                            </span>
                        </div>

                        <p style={{
                            margin: 0,
                            fontSize: '0.85rem',
                            lineHeight: '1.4',
                            color: 'var(--text-main)',
                            fontWeight: 500
                        }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Prompt:</span> "{entry.prompt}"
                        </p>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span className={`tag ${entry.gender_bias.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
                                {genderMap[entry.gender_bias] || entry.gender_bias}
                            </span>
                        </div>

                        {entry.notes && (
                            <p className="text-muted" style={{
                                fontStyle: 'italic',
                                background: 'rgba(0,0,0,0.02)',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                marginBottom: '1rem'
                            }}>
                                {entry.notes}
                            </p>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => handleDownload(entry.image_url, entry.prompt)}
                                className="btn-secondary"
                                style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}
                                title="Salva immagine in HD"
                            >
                                💾 HD
                            </button>
                            <button
                                onClick={() => onDelete(entry.id, entry.image_url)}
                                className="btn-danger"
                                style={{
                                    padding: '0.4rem',
                                    fontSize: '0.75rem',
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    border: '1px solid #fecaca',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer'
                                }}
                                title="Elimina osservazione"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Gallery
