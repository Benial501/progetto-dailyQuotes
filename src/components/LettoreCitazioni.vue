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

    <div class="lettore-citazioni">
    <h1 class="titolo-oro">Lettore di Citazioni</h1>

    <div v-if="messaggioErrore" class="messaggio-errore">{{ messaggioErrore }}</div>

    <!-- Citazione casuale -->
    <div class="citazione-del-giorno" v-if="citazioneCorrente">
      <p class="testo-citazione" v-html="evidenziaTesto(citazioneCorrente.testo)"></p>
      <p class="autore-citazione">{{ citazioneCorrente.autore }}</p>
    </div>

    <!-- Bottoni principali -->
    <div class="contenitore-bottoni-principali">
      <button class="bottone-principale" @click="selezionaCitazioneCasuale">Citazione Casuale</button>
      <button class="bottone-principale" @click="toggleFormNuovaCitazione">
        {{ mostraFormNuovaCitazione ? 'Nascondi Form' : 'Aggiungi Citazione' }}
      </button>
      <button class="bottone-principale" @click="toggleMostraPreferiti">
        {{ mostraSoloPreferiti ? 'Mostra Tutte' : 'Mostra Preferiti' }}
      </button>
    </div>

    <!-- Form nuova citazione -->
    <form v-if="mostraFormNuovaCitazione" @submit.prevent class="form-nuova-citazione">
      <input v-model="nuovaCitazione.testo" placeholder="Testo" class="input-nuova-citazione" />
      <input v-model="nuovaCitazione.autore" placeholder="Autore" class="input-nuova-citazione" />
      <button type="button" class="bottone-principale" @click="salvaNuovaCitazione">Salva</button>
    </form>

    <!-- Ricerca -->
    <form @submit.prevent>
      <input v-model="testoRicerca" placeholder="Cerca autore o citazione..." class="input-nuova-citazione" />
    </form>
    
    <div v-if="isLoading" class="loading">Caricamento citazioni...</div>
    <div v-else>
      <!-- Elenco citazioni -->
      <ul class="elenco-citazioni">
        <li v-for="citazione in calcolaCitazioniPagina()" :key="citazione.id" class="citazione-item">
          <div class="citazione-content">
            <p v-html="evidenziaTesto(citazione.testo)" class="playfair-display"></p>
            <p class="citazione-autore">- {{ citazione.autore }}</p>
          </div>
          <button type="button" class="bottone-secondario" @click="rimuoviCitazione(citazione)">🗑️</button>
          <button type="button" class="bottone-principale" @click="togglePreferita(citazione)">
            <span v-if="citazione.preferita">❤️</span>
            <span v-else>🤍</span>
          </button>
        </li>
      </ul>

      <!-- Paginazione -->
      <div v-if="calcolaNumeroPagine() > 1" class="paginazione">
        <button type="button" class="bottone-pagina" @click="paginaPrecedente" :disabled="paginaCorrente === 1">⬅️</button>
        <span>Pagina {{ paginaCorrente }} di {{ calcolaNumeroPagine() }}</span>
        <button type="button" class="bottone-pagina" @click="paginaSuccessiva" :disabled="paginaCorrente === calcolaNumeroPagine()">➡️</button>
      </div>
    </div>
  </div>




  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');

.lettore-citazioni {
  display: flex;
  flex-direction: column;
  align-items: center;        /* centra tutto orizzontalmente */
  justify-content: flex-start; /* verticale in alto, cambia in center se vuoi centrare anche verticalmente */
  width: 95%;
  max-width: 1200px;
  min-width: 320px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  box-sizing: border-box;
}

.loading {
  text-align: center;
  font-size: 1.4em;
  margin-top: 20px;
}

.titolo-oro {
  color: #FFD700;
  text-align: center;
}

.citazione-del-giorno,
.form-nuova-citazione,
.elenco-citazioni,
.contenitore-bottoni-principali {
  width: 100%;
  max-width: 800px;  /* contenuto centrato e non troppo largo */
}

.citazione-del-giorno {
  background-color: #f0f0f0;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.testo-citazione {
  font-style: italic;
  font-size: clamp(1.2em, 2vw, 1.6em); /* dimensione fluida */
}

.playfair-display {
  font-family: "Playfair Display", serif;
  font-optical-sizing: auto;
  font-weight: 400;
  font-style: normal;
  font-size: clamp(1em, 1.5vw, 1.3em); /* dimensione fluida */
}

.autore-citazione {
  text-align: right;
  font-weight: bold;
}

.contenitore-bottoni-principali {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;    /* centra bottoni */
  gap: 10px;
  margin-bottom: 20px;
}

.bottone-principale,
.bottone-secondario,
.bottone-pagina {
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
}

.bottone-principale {
  background-color: #4CAF50;
  color: white;
}

.bottone-principale:hover {
  background-color: #467f49;
}

.bottone-secondario {
  background-color: #f44336;
  color: white;
  margin-left: 20px;
  margin-right: 10px;
}

.bottone-secondario:hover {
  background-color: #c25353;
}

.form-nuova-citazione {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.input-nuova-citazione {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.elenco-citazioni {
  list-style-type: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;       /* centra citazioni */
  gap: 10px;
}

.citazione-item {
  background-color: #fff;
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 700px;
}

.citazione-content {
  flex-grow: 1;
  text-align: left;
}

.citazione-testo {
  font-size: 1.2em;
  margin-bottom: 0.5em;
  font-style: italic;
}

.citazione-autore {
  font-size: 1.1em;
  font-weight: bold;
  text-align: right;
  color: #555;
}

.highlight {
  background-color: yellow;
}

.messaggio-errore {
  color: red;
  margin-bottom: 10px;
  text-align: center;
}

.bottone-rimuovi {
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 0.2em 0.5em;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.bottone-rimuovi:hover {
  background-color: #ffebee;
}



  .appcontainer {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding: 20px;
    box-sizing: border-box;
    position: relative; /* Added to maintain position in fullscreen */
    left: 50%; /* Centering */
    transform: translateX(-50%); /* Centering */
  }

</style>

