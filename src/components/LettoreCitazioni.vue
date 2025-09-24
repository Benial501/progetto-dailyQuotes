<script>
import { supabase } from '../data/supabase'

export default {
  data() {
    return {
      citazioni: [],
      citazioneCorrente: null,
      citazioniPerPagina: 5,
      paginaCorrente: 1,
      testoRicerca: '',
      mostraFormNuovaCitazione: false,
      mostraSoloPreferiti: false,
      nuovaCitazione: {
        testo: '',
        autore: '',
      },
      isLoading: true,
      messaggioErrore: null,
      notifica: null // 🔔 per messaggi realtime
    }
  },

  async created() {
    await this.inizializza()

    // === SUBSCRIBE REALTIME SUPABASE ===
    supabase
      .channel('citazioni-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes' },
        payload => {
          let msg = ''
          if (payload.eventType === 'INSERT') msg = 'Nuova citazione aggiunta!'
          if (payload.eventType === 'UPDATE') msg = 'Citazione aggiornata!'
          if (payload.eventType === 'DELETE') msg = 'Citazione rimossa!'

          if (msg) this.mostraNotifica(msg)
          this.caricaCitazioni() // aggiorna lista senza refresh
        }
      )
      .subscribe()
  },

  methods: {
    // === INIZIALIZZAZIONE ===
    async inizializza() {
      this.isLoading = true
      this.messaggioErrore = null
      await this.caricaCitazioni()
      this.selezionaCitazioneCasuale()
      this.isLoading = false
    },

    // === CARICA CITAZIONI CON ORDINE STABILE ===
    async caricaCitazioni() {
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select('*')
          .order('id', { ascending: true }) // 👈 ordine fisso
        if (error) throw error

        if (!data || data.length === 0) {
          this.citazioni = []
          this.messaggioErrore = 'Nessuna citazione trovata.'
          return
        }

        this.citazioni = data.map(c => ({
          id: c.id,
          testo: c.text,
          autore: c.author,
          preferita: c.is_favorite || false,
        }))
      } catch (error) {
        console.error('Errore caricamento citazioni:', error)
        this.messaggioErrore = 'Errore nel caricamento delle citazioni.'
        this.citazioni = []
      }
    },

    selezionaCitazioneCasuale() {
      if (!this.citazioni.length) {
        this.citazioneCorrente = null
        return
      }
      const rand = Math.floor(Math.random() * this.citazioni.length)
      this.citazioneCorrente = this.citazioni[rand]
    },

    async salvaNuovaCitazione() {
      if (!this.nuovaCitazione.testo.trim() || !this.nuovaCitazione.autore.trim()) {
        alert("Compila sia il testo che l'autore!")
        return
      }

      try {
        const { error } = await supabase.from('quotes').insert([{
          text: this.nuovaCitazione.testo.trim(),
          author: this.nuovaCitazione.autore.trim(),
          is_favorite: false
        }])

        if (error) throw error

        await this.caricaCitazioni()
        this.nuovaCitazione = { testo: '', autore: '' }
        this.mostraFormNuovaCitazione = false
        this.selezionaCitazioneCasuale()
      } catch (error) {
        console.error('Errore salvataggio:', error)
        this.messaggioErrore = 'Errore nel salvataggio della citazione.'
      }
    },

    async rimuoviCitazione(citazione) {
      try {
        const { error } = await supabase.from('quotes').delete().eq('id', citazione.id)
        if (error) throw error

        await this.caricaCitazioni()
        if (this.citazioneCorrente?.id === citazione.id) {
          this.selezionaCitazioneCasuale()
        }
      } catch (error) {
        console.error('Errore rimozione:', error)
        this.messaggioErrore = 'Errore nella rimozione della citazione.'
      }
    },

    // === TOGGLE PREFERITI SENZA RIORDINARE ===
    async togglePreferita(citazione) {
      try {
        const nuovoValore = !citazione.preferita
        const { error } = await supabase
          .from('quotes')
          .update({ is_favorite: nuovoValore })
          .eq('id', citazione.id)

        if (error) throw error
        citazione.preferita = nuovoValore

        // Mostra notifica realtime
        const msg = nuovoValore ? 'Citazione aggiunta ai preferiti!' : 'Citazione rimossa dai preferiti!'
        this.mostraNotifica(msg)
      } catch (error) {
        console.error('Errore toggle preferiti:', error)
        this.messaggioErrore = 'Impossibile aggiornare i preferiti.'
      }
    },

    toggleFormNuovaCitazione() {
      this.mostraFormNuovaCitazione = !this.mostraFormNuovaCitazione
    },

    toggleMostraPreferiti() {
      this.mostraSoloPreferiti = !this.mostraSoloPreferiti
      this.paginaCorrente = 1
    },

    // === FILTRI & PAGINAZIONE ===
    citazioniFiltrate() {
      let lista = [...this.citazioni]

      if (this.mostraSoloPreferiti) {
        lista = lista.filter(c => c.preferita)
      }

      if (this.testoRicerca.trim()) {
        const ricerca = this.testoRicerca.toLowerCase().trim()
        lista = lista.filter(c =>
          c.testo.toLowerCase().includes(ricerca) ||
          c.autore.toLowerCase().includes(ricerca)
        )
      }

      return lista
    },

    calcolaCitazioniPagina() {
      const lista = this.citazioniFiltrate()
      const start = (this.paginaCorrente - 1) * this.citazioniPerPagina
      return lista.slice(start, start + this.citazioniPerPagina)
    },

    calcolaNumeroPagine() {
      return Math.max(1, Math.ceil(this.citazioniFiltrate().length / this.citazioniPerPagina))
    },

    paginaSuccessiva() {
      if (this.paginaCorrente < this.calcolaNumeroPagine()) this.paginaCorrente++
    },

    paginaPrecedente() {
      if (this.paginaCorrente > 1) this.paginaCorrente--
    },

    evidenziaTesto(testo) {
      if (!this.testoRicerca.trim()) return testo
      const regex = new RegExp(`(${this.testoRicerca.trim()})`, 'gi')
      return testo.replace(regex, '<mark class="highlight">$1</mark>')
    },

    // 🔔 MOSTRA NOTIFICA
    mostraNotifica(msg) {
      this.notifica = msg
      setTimeout(() => { this.notifica = null }, 3000)
    }
  }
}
</script>


<template>
  <div class="app-container">
    <h1 class="titolo">Lettore di Citazioni</h1>

    <!-- NOTIFICA REALTIME -->
    <div v-if="notifica" class="notifica-realtime">{{ notifica }}</div>

    <!-- Messaggi di errore -->
    <div v-if="messaggioErrore" class="messaggio-errore">{{ messaggioErrore }}</div>

    <!-- Citazione casuale -->
    <div v-if="citazioneCorrente" class="citazione-del-giorno">
      <p v-html="evidenziaTesto(citazioneCorrente.testo)" class="testo-citazione"></p>
      <p class="autore-citazione">{{ citazioneCorrente.autore }}</p>
    </div>

    <!-- Bottoni principali -->
    <div class="bottoni">
      <button @click="selezionaCitazioneCasuale">Citazione Casuale</button>
      <button @click="toggleFormNuovaCitazione">
        {{ mostraFormNuovaCitazione ? 'Nascondi Form' : 'Aggiungi Citazione' }}
      </button>
      <button @click="toggleMostraPreferiti">
        {{ mostraSoloPreferiti ? 'Mostra Tutte' : 'Mostra Preferiti' }}
      </button>
    </div>

    <!-- Form nuova citazione -->
    <form v-if="mostraFormNuovaCitazione" @submit.prevent class="form-nuova-citazione">
      <input v-model="nuovaCitazione.testo" placeholder="Testo della citazione" class="input-form" />
      <input v-model="nuovaCitazione.autore" placeholder="Autore" class="input-form" />
      <button type="button" class="btn-salva" @click="salvaNuovaCitazione">💾 Salva Citazione</button>
    </form>

    <!-- Ricerca -->
    <input v-model="testoRicerca" placeholder="Cerca autore o citazione..." class="input-ricerca" />

    <!-- Lista citazioni -->
    <div v-if="isLoading" class="loading">Caricamento citazioni...</div>
    <ul v-else class="elenco-citazioni">
      <li v-for="citazione in calcolaCitazioniPagina()" :key="citazione.id" class="citazione-item">
        <div>
          <p v-html="evidenziaTesto(citazione.testo)"></p>
          <p class="autore-citazione">- {{ citazione.autore }}</p>
        </div>
        <div class="azioni">
          <button @click="rimuoviCitazione(citazione)">🗑️</button>
          <button @click="togglePreferita(citazione)">
            <span v-if="citazione.preferita">❤️</span>
            <span v-else>🤍</span>
          </button>
        </div>
      </li>
    </ul>

    <!-- Paginazione -->
    <div v-if="calcolaNumeroPagine() > 1" class="paginazione">
      <button @click="paginaPrecedente" :disabled="paginaCorrente === 1">⬅️</button>
      <span>Pagina {{ paginaCorrente }} di {{ calcolaNumeroPagine() }}</span>
      <button @click="paginaSuccessiva" :disabled="paginaCorrente === calcolaNumeroPagine()">➡️</button>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  font-family: 'Playfair Display', serif;
}

.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  height: 100vh;
  width: 80vw;
  box-sizing: border-box;
  text-align: center;
  overflow: hidden;
}

.titolo {
  color: #FFD700;
  font-size: clamp(2rem, 5vw, 4rem);
  margin-bottom: 1.5rem;
}

/* 🔔 NOTIFICA REALTIME */
.notifica-realtime {

  color: rgb(255, 6, 6);
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  animation: fadeInOut 3s forwards;
}
@keyframes fadeInOut {
  0% {opacity: 0; transform: translateY(-10px);}
  10% {opacity: 1; transform: translateY(0);}
  90% {opacity: 1;}
  100% {opacity: 0; transform: translateY(-10px);}
}

.citazione-del-giorno {
  background-color: #f0f0f0;
  padding: clamp(1.5rem, 3vw, 3rem);
  border-radius: 1rem;
  width: 80vw;
  max-height: 25vh;
  overflow: hidden;
  box-shadow: 0 0.5rem 1.5rem rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.testo-citazione {
  font-style: italic;
  font-size: clamp(1.4rem, 2.5vw, 2rem);
  color: #000;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.autore-citazione {
  font-weight: bold;
  font-size: clamp(0.9rem, 2vw, 1.2rem);
  color: #367fa9;
  margin-top: 0.5rem;
}

.bottoni {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  width: 90vw;
}

.bottoni button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  background-color: #4CAF50;
  color: white;
  font-size: 0.95rem;
  cursor: pointer;
  transition: 0.2s all;
}

.bottoni button:hover {
  background-color: #35923a;
  transform: scale(1.05);
}

.input-ricerca {
  width: 100%;
  max-width: 600px;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
  margin-bottom: 1rem;
  font-size: 1rem;
  box-sizing: border-box;
}

.elenco-citazioni {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 80vw;
  max-height: 50vh;
  overflow-y: auto;
}

.citazione-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #ddd;
  padding: 0.7rem;
  border-radius: 0.5rem;
  background-color: #fff;
  box-shadow: 0 0.130rem 0.5rem rgba(0,0,0,0.05);
  font-size: 0.90rem;
  
}

.azioni button {
  margin-left: 0.5rem;
  border: none;
  background: none;
  font-size: 1.25rem;
  cursor: pointer;
  transition: transform 0.1s;
  padding-right: 50px;
}

.azioni button:hover {
  transform: scale(1.4);
  
}

.paginazione {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  width: 90vw;
  margin-top: 1rem;
  
}

.paginazione button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: 0.2s all;
}

.paginazione button:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.form-nuova-citazione {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fefefe;
  padding: 18px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  margin-bottom: 15px;
  transition: transform 0.2s ease;
}

.form-nuova-citazione:hover { transform: translateY(-2px); }

.input-form {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1em;
  width: 100%;
  transition: border-color 0.2s;
}

.input-form:focus {
  border-color: #4CAF50;
  outline: none;
}

.btn-salva {
  padding: 12px;
  border-radius: 8px;
  border: none;
  background-color: #4CAF50;
  color: white;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
}

.btn-salva:hover {
  background-color: #45a049;
  transform: translateY(-2px);
}

.highlight { background-color: yellow; font-weight: bold; }

@media(max-width: 1024px){
  .citazione-del-giorno { width: 90vw; max-height: 25vh; }
  .elenco-citazioni { width: 90vw; max-height: 45vh; }
}

@media(max-width: 768px){
  .bottoni {
    flex-direction: column;
    gap: 0.5rem;
    width: 70%;
  }
  .bottoni button {
    padding: 0.45rem 0.9rem;
    font-size: 0.9rem;
    width: 100%;
    box-sizing: border-box;
  }
}
</style>
