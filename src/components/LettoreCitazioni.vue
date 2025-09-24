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
    }
  },

  async created() {
    await this.inizializza()
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

    async caricaCitazioni() {
      try {
        const { data, error } = await supabase.from('quotes').select('*')
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

    async togglePreferita(citazione) {
      try {
        const nuovoValore = !citazione.preferita
        const { error } = await supabase
          .from('quotes')
          .update({ is_favorite: nuovoValore })
          .eq('id', citazione.id)

        if (error) throw error
        citazione.preferita = nuovoValore
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
    }
  }
}
</script>
<template>
  <div class="app-container">
    <h1 class="titolo">Lettore di Citazioni</h1>

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
      <input v-model="nuovaCitazione.testo" placeholder="Testo" />
      <input v-model="nuovaCitazione.autore" placeholder="Autore" />
      <button type="button" @click="salvaNuovaCitazione">Salva</button>
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

.app-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Playfair Display', serif;
}

.titolo {
  text-align: center;
  color: #FFD700;
  font-size: 2em;
  margin-bottom: 20px;
}

.messaggio-errore {
  color: red;
  text-align: center;
  margin-bottom: 15px;
  font-weight: bold;
}

.citazione-del-giorno {
  background-color: #f0f0f0;
  padding: 25px;
  border-radius: 10px;
  margin-bottom: 25px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.testo-citazione {
  font-style: italic;
  font-size: 1.2em;
  color: #000;
  margin-bottom: 10px;
}

.autore-citazione {
  text-align: right;
  font-weight: bold;
  color: #367fa9;
}

.bottoni {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.bottoni button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  font-size: 1em;
  transition: background-color 0.2s;
}

.bottoni button:hover {
  background-color: #35923a;
}

.form-nuova-citazione {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.form-nuova-citazione input {
  width: 100%;
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1em;
  box-sizing: border-box;
}

.form-nuova-citazione button {
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background-color: #008CBA;
  color: white;
  font-size: 1em;
}

.input-ricerca {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  margin-bottom: 20px;
  font-size: 1em;
  box-sizing: border-box;
}

.elenco-citazioni {
  list-style: none;
  padding: 0;
  margin: 0;
}

.citazione-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 12px;
  background-color: #ffffff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.azioni button {
  margin-left: 8px;
  cursor: pointer;
  border: none;
  background: none;
  font-size: 1.2em;
  transition: transform 0.1s;
}

.azioni button:hover {
  transform: scale(1.2);
}

.paginazione {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 25px;
}

.paginazione button {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s;
}

.paginazione button:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.paginazione span {
  font-weight: bold;
  font-size: 1em;
  color: #ddd;
}

.highlight {
  background-color: yellow;
  font-weight: bold;
}


</style>