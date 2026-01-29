function Gallery({ entries }) {
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

    const downloadImage = (url, prompt) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `bias-ai-${prompt.slice(0, 20)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(280px, 100%, 350px), 1fr))', gap: '1.5rem' }}>
            {entries.map((entry) => (
                <div key={entry.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--secondary)',
                            fontWeight: 700
                        }}>
                            {entry.model}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {new Date(entry.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', lineHeight: '1.3' }}>"{entry.prompt}"</h3>

                    {entry.image_url && (
                        <div style={{ marginBottom: '1rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid #E5E7EB', aspectRatio: '1/1', position: 'relative' }}>
                            <img src={entry.image_url} alt={entry.prompt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            
                            <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                                <button 
                                    onClick={() => downloadImage(entry.image_url, entry.prompt)}
                                    style={{
                                        background: 'rgba(255,255,255,0.9)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                    title="Scarica immagine"
                                >
                                    📥
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <span className={`tag ${entry.gender_bias.toLowerCase()}`} style={{ fontSize: '0.75rem' }}>
                                {genderMap[entry.gender_bias] || entry.gender_bias}
                            </span>
                            {entry.notes && (
                                <p className="text-muted" style={{ fontStyle: 'italic', background: 'rgba(0,0,0,0.03)', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                    {entry.notes}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Gallery
