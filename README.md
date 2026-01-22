# Esploratore Bias AI (APG)

Un'applicazione per monitorare e analizzare i bias di genere nelle immagini generate dalle Intelligenze Artificiali.

## 🚀 Caratteristiche
- **Generazione Immagini**: Integrazione con Hugging Face (Modello FLUX.1).
- **Database Realtime**: Salvataggio osservazioni su Supabase con aggiornamenti istantanei.
- **Storage Cloud**: Archiviazione persistente delle immagini su Supabase Storage.
- **Dashboard Statistica**: Analisi automatizzata della distribuzione dei generi percepiti.

## 🛠️ Tech Stack
- **Frontend**: React + Vite
- **Database/Backend**: Supabase
- **Styling**: CSS Custom (APG Brand Guidelines)
- **Deployment**: Vercel

## 📦 Installazione Locale

1. Clona la repo:
   ```bash
   git clone <your-repo-url>
   ```
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Configura le variabili d'ambiente:
   Crea un file `.env` con:
   ```env
   VITE_SUPABASE_URL=tua_url
   VITE_SUPABASE_ANON_KEY=tua_chiave
   ```
4. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

## 🏗️ Deployment su Vercel

1. Collega la repo GitHub a Vercel.
2. Aggiungi le variabili d'ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nelle impostazioni del progetto su Vercel.
3. Vercel rileverà automaticamente Vite e configurerà il build command (`npm run build`).
