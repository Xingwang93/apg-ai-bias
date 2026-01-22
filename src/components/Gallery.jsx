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

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {entries.map((entry) => (
                <div key={entry.id} className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: 'var(--secondary)',
                            fontWeight: 600
                        }}>
                            {entry.model}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(entry.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', wordBreak: 'break-word' }}>"{entry.prompt}"</h3>

                    {entry.image_url && (
                        <div style={{ marginBottom: '1rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                            <img src={entry.image_url} alt={entry.prompt} style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <span className={`tag ${entry.gender_bias.toLowerCase()}`}>
                            {genderMap[entry.gender_bias] || entry.gender_bias}
                        </span>
                    </div>

                    {entry.notes && (
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', background: '#F9FAFB', padding: '0.5rem', borderRadius: '4px' }}>
                            {entry.notes}
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}

export default Gallery
