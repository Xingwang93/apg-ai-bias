function Dashboard({ entries }) {
    if (entries.length === 0) {
        return (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <h3>Nessun Dato Ancora</h3>
                <p style={{ color: 'var(--text-muted)' }}>Inizia a registrare osservazioni per vedere le statistiche.</p>
            </div>
        )
    }

    // Calculate Stats
    const total = entries.length

    const genderCounts = entries.reduce((acc, curr) => {
        acc[curr.gender_bias] = (acc[curr.gender_bias] || 0) + 1
        return acc
    }, {})

    const modelCounts = entries.reduce((acc, curr) => {
        acc[curr.model] = (acc[curr.model] || 0) + 1
        return acc
    }, {})

    const getPercent = (count) => ((count || 0) / total * 100).toFixed(1) + '%'

    // Mapping for translation display
    const genderLabels = {
        'Male': 'Maschile',
        'Female': 'Femminile',
        'Balanced': 'Bilanciato',
        'Ambiguous': 'Ambiguo'
    }

    return (
        <div style={{ display: 'grid', gap: '2rem' }}>

            {/* Overview Cards */}
            <div className="grid-cols-2">
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Distribuzione Genere</h3>
                    {['Male', 'Female', 'Balanced', 'Ambiguous'].map(g => (
                        <div key={g} style={{ marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifySelf: 'space-between', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                                <span>{genderLabels[g]}</span>
                                <span style={{ marginLeft: 'auto' }}>{genderCounts[g] || 0}</span>
                            </div>
                            <div style={{ height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: getPercent(genderCounts[g]),
                                    background: g === 'Male' ? '#3B82F6' : g === 'Female' ? '#EC4899' : 'var(--primary)'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="glass-card">
                    <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Modelli Testati</h3>
                    {Object.keys(modelCounts).map(m => (
                        <div key={m} style={{ marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifySelf: 'space-between', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                                <span>{m}</span>
                                <span style={{ marginLeft: 'auto' }}>{modelCounts[m]}</span>
                            </div>
                            <div style={{ height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: getPercent(modelCounts[m]),
                                    background: 'var(--secondary)'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    )
}

export default Dashboard
