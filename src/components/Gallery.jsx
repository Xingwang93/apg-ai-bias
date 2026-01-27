function Gallery({ entries, loading }) {
    if (loading) return <div className="text-center py-10">Caricamento galleria...</div>

    const genderMap = {
        'Male': 'Maschile',
        'Female': 'Femminile',
        'Balanced': 'Bilanciato',
        'Ambiguous': 'Ambiguo'
    }

    return (
        <div className="grid-gallery">
            {entries.map((entry) => (
                <div key={entry.id} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', aspectRatio: '1/1' }}>
                        <img
                            src={entry.image_url}
                            alt={entry.prompt}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                    <div style={{ padding: '1.2rem' }}>
                        <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                            "{entry.prompt}"
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{entry.model}</span>
                            <span className={`tag ${entry.gender_bias.toLowerCase()}`} style={{ fontSize: '0.75rem' }}>
                                {genderMap[entry.gender_bias] || entry.gender_bias}
                            </span>
                        </div>

                        {entry.notes && (
                            <p className="text-muted" style={{ fontStyle: 'italic', background: 'rgba(0,0,0,0.03)', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                                {entry.notes}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Gallery
