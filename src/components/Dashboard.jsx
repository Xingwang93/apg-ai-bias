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

    const exportToCSV = () => {
        const headers = ["Prompt", "Modello", "Genere", "Note", "Data", "Immagine"]
        const rows = entries.map(e => [
            `"${e.prompt.replace(/"/g, '""')}"`,
            e.model,
            genderLabels[e.gender_bias] || e.gender_bias,
            `"${(e.notes || '').replace(/"/g, '""')}"`,
            new Date(e.created_at).toLocaleString('it-IT'),
            e.image_url || ''
        ])

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `bias_ai_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Riepilogo Dati</h2>
                <button onClick={exportToCSV} className="btn-premium" style={{ minHeight: '40px', padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}>
                    📦 Esporta CSV
                </button>
            </div>

            <div className="grid-cols-2">
                {/* Overview Cards */}
                <div className="glass-card">
                    <h3 className="mb-4" style={{ color: 'var(--secondary)' }}>Distribuzione Genere</h3>
                    {['Male', 'Female', 'Balanced', 'Ambiguous'].map(g => (
                        <div key={g} className="mb-4">
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                                <span style={{ fontWeight: 500 }}>{genderLabels[g]}</span>
                                <span className="text-muted">{genderCounts[g] || 0}</span>
                            </div>
                            <div style={{ height: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: getPercent(genderCounts[g]),
                                    background: g === 'Male' ? '#3B82F6' : g === 'Female' ? '#EC4899' : 'var(--primary)',
                                    borderRadius: '5px',
                                    transition: 'width 1s ease-out'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="glass-card">
                    <h3 className="mb-4" style={{ color: 'var(--secondary)' }}>Modelli Testati</h3>
                    <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {Object.keys(modelCounts).map(m => (
                            <div key={m} className="mb-4">
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                                    <span style={{ fontWeight: 500 }}>{m}</span>
                                    <span className="text-muted">{modelCounts[m]}</span>
                                </div>
                                <div style={{ height: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: getPercent(modelCounts[m]),
                                        background: 'var(--secondary)',
                                        borderRadius: '5px',
                                        transition: 'width 1s ease-out'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
