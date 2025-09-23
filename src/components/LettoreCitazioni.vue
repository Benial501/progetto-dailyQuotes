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
    // === BLOCCO INIZIALIZZAZIONE ===
    async inizializza() {
      this.isLoading = true
      this.messaggioErrore = null
      await this.caricaCitazioni()
      this.selezionaCitazioneCasuale()
      this.isLoading = false
    },

    // === BLOCCO RECUPERO DATI E CONVERSIONE DATABASE ===
    async caricaCitazioni() {
      try {
        const risultatoQuery = await supabase.from('quotes').select('*')
        const datiRicevuti = risultatoQuery.data
        const erroreQuery = risultatoQuery.error
        
        if (erroreQuery) {
          this.messaggioErrore = 'Errore nel caricamento delle citazioni.'
          throw erroreQuery
        }

        if (!datiRicevuti || datiRicevuti.length === 0) {
          this.messaggioErrore = 'Nessuna citazione trovata.'
          this.citazioni = []
          return
        }

        this.citazioni = this.convertiDatiDatabase(datiRicevuti)
      } catch (errore) {
        this.citazioni = []
      }
    },

    convertiDatiDatabase(datiDatabase) {
      const citazioniConvertite = []
      
      for (let i = 0; i < datiDatabase.length; i++) {
        const citazioneDatabase = datiDatabase[i]
        const citazioneConvertita = {
          id: citazioneDatabase.id,
          testo: citazioneDatabase.text,
          autore: citazioneDatabase.author,
          preferita: citazioneDatabase.is_favorite || false,
        }
        citazioniConvertite.push(citazioneConvertita)
      }
      
      return citazioniConvertite
    },

    // === BLOCCO GESTIONE CITAZIONI ===
    selezionaCitazioneCasuale() {
      if (this.citazioni.length === 0) {
        this.citazioneCorrente = null
        return
      }
      
      const numeroCasuale = Math.floor(Math.random() * this.citazioni.length)
      this.citazioneCorrente = this.citazioni[numeroCasuale]
    },

    controllaSeAggiornaCitazioneCorrente(citazioneRimossa) {
      if (this.citazioneCorrente && this.citazioneCorrente.id === citazioneRimossa.id) {
        this.selezionaCitazioneCasuale()
      }
    },

    // === BLOCCO OPERAZIONI DATABASE ===
    async salvaNuovaCitazione() {
      const validazioneOk = this.validaNuovaCitazione()
      if (!validazioneOk) {
        return
      }
      
      try {
        const datiPerDatabase = {
          text: this.nuovaCitazione.testo.trim(),
          author: this.nuovaCitazione.autore.trim(),
          is_favorite: false
        }
        
        const risultatoInserimento = await supabase.from('quotes').insert([datiPerDatabase])
        const erroreInserimento = risultatoInserimento.error

        if (erroreInserimento) {
          this.messaggioErrore = 'Errore nel salvataggio della citazione.'
          throw erroreInserimento
        }

        await this.caricaCitazioni()
        this.resettaFormNuovaCitazione()
        this.selezionaCitazioneCasuale()
      } catch (errore) {
        // Error already handled above
      }
    },

    async rimuoviCitazione(citazioneDaRimuovere) {
      try {
        const risultatoEliminazione = await supabase
          .from('quotes')
          .delete()
          .eq('id', citazioneDaRimuovere.id)
        
        const erroreEliminazione = risultatoEliminazione.error
        
        if (erroreEliminazione) {
          this.messaggioErrore = 'Errore nella rimozione della citazione.'
          throw erroreEliminazione
        }

        await this.caricaCitazioni()
        this.controllaSeAggiornaCitazioneCorrente(citazioneDaRimuovere)
      } catch (errore) {
        // Error already handled above
      }
    },

    async togglePreferita(citazione) {
      try {
        const nuovoStatoPreferito = !citazione.preferita
        
        const risultatoAggiornamento = await supabase
          .from('quotes')
          .update({ is_favorite: nuovoStatoPreferito })
          .eq('id', citazione.id)

        const erroreAggiornamento = risultatoAggiornamento.error

        if (erroreAggiornamento) {
          this.messaggioErrore = 'Impossibile aggiornare i preferiti.'
          throw erroreAggiornamento
        }

        citazione.preferita = nuovoStatoPreferito
      } catch (errore) {
        // Error already handled above
      }
    },

    // === BLOCCO VALIDAZIONE E FORM ===
    validaNuovaCitazione() {
      const testoVuoto = !this.nuovaCitazione.testo || this.nuovaCitazione.testo.trim() === ''
      const autoreVuoto = !this.nuovaCitazione.autore || this.nuovaCitazione.autore.trim() === ''
      
      if (testoVuoto || autoreVuoto) {
        alert('Per favore, compila sia il testo che l\'autore della citazione.')
        return false
      }
      
      return true
    },

    resettaFormNuovaCitazione() {
      this.nuovaCitazione.testo = ''
      this.nuovaCitazione.autore = ''
      this.mostraFormNuovaCitazione = false
    },

    // === BLOCCO FILTRI E RICERCA ===
    filtraCitazioni() {
      let citazioniFiltrate = []
      
      for (let i = 0; i < this.citazioni.length; i++) {
        citazioniFiltrate.push(this.citazioni[i])
      }
      
      if (this.testoRicerca && this.testoRicerca.trim() !== '') {
        citazioniFiltrate = this.applicaFiltroRicerca(citazioniFiltrate)
      }
      
      if (this.mostraSoloPreferiti) {
        citazioniFiltrate = this.applicaFiltroPreferiti(citazioniFiltrate)
      }
      
      return citazioniFiltrate
    },

    applicaFiltroRicerca(citazioni) {
      const testoRicercaMinuscolo = this.testoRicerca.toLowerCase().trim()
      const citazioniFiltrate = []
      
      for (let i = 0; i < citazioni.length; i++) {
        const citazione = citazioni[i]
        const testoMinuscolo = citazione.testo.toLowerCase()
        const autoreMinuscolo = citazione.autore.toLowerCase()
        
        const trovatoNelTesto = testoMinuscolo.includes(testoRicercaMinuscolo)
        const trovatoNellAutore = autoreMinuscolo.includes(testoRicercaMinuscolo)
        
        if (trovatoNelTesto || trovatoNellAutore) {
          citazioniFiltrate.push(citazione)
        }
      }
      
      return citazioniFiltrate
    },

    applicaFiltroPreferiti(citazioni) {
      const citazioniPreferite = []
      
      for (let i = 0; i < citazioni.length; i++) {
        const citazione = citazioni[i]
        if (citazione.preferita === true) {
          citazioniPreferite.push(citazione)
        }
      }
      
      return citazioniPreferite
    },

    evidenziaTesto(testoOriginale) {
      if (!this.testoRicerca || this.testoRicerca.trim() === '') {
        return testoOriginale
      }
      
      const testoRicercaPulito = this.testoRicerca.trim()
      const espressioneRegolare = new RegExp('(' + testoRicercaPulito + ')', 'gi')
      const testoEvidenziato = testoOriginale.replace(espressioneRegolare, '<mark class="highlight">$1</mark>')
      
      return testoEvidenziato
    },

    // === BLOCCO PAGINAZIONE ===
    calcolaCitazioniPagina() {
      const citazioniFiltrate = this.filtraCitazioni()
      const indicePrimoElemento = (this.paginaCorrente - 1) * this.citazioniPerPagina
      const indiceUltimoElemento = indicePrimoElemento + this.citazioniPerPagina
      
      const citazioniPaginaCorrente = []
      for (let i = indicePrimoElemento; i < indiceUltimoElemento && i < citazioniFiltrate.length; i++) {
        citazioniPaginaCorrente.push(citazioniFiltrate[i])
      }
      
      return citazioniPaginaCorrente
    },

    calcolaNumeroPagine() {
      const citazioniFiltrate = this.filtraCitazioni()
      const numeroTotaleCitazioni = citazioniFiltrate.length
      const numeroPagine = Math.ceil(numeroTotaleCitazioni / this.citazioniPerPagina)
      
      return numeroPagine
    },

    paginaSuccessiva() {
      const numeroPagineTotali = this.calcolaNumeroPagine()
      if (this.paginaCorrente < numeroPagineTotali) {
        this.paginaCorrente = this.paginaCorrente + 1
      }
    },

    paginaPrecedente() {
      if (this.paginaCorrente > 1) {
        this.paginaCorrente = this.paginaCorrente - 1
      }
    },

    // === BLOCCO INTERFACCIA UTENTE ===
    toggleFormNuovaCitazione() {
      this.mostraFormNuovaCitazione = !this.mostraFormNuovaCitazione
    },

    toggleMostraPreferiti() {
      this.mostraSoloPreferiti = !this.mostraSoloPreferiti
      this.paginaCorrente = 1
    }
  }
}
</script>

<template>
  <div v-if="messaggioErrore" class="messaggio-errore">
    {{ messaggioErrore }}
  </div>

  <div class="lettore-citazioni">
    <h1 class="titolo-oro">Lettore di Citazioni</h1>

    <div v-if="isLoading" class="loading">
      Caricamento citazioni...
    </div>

    <div v-else>
      <div class="citazione-del-giorno">
        <p class="testo-citazione" v-html="citazioneCorrente ? evidenziaTesto(citazioneCorrente.testo) : ''"></p>
        <p class="autore-citazione">{{ citazioneCorrente ? citazioneCorrente.autore : '' }}</p>
      </div>

      <div class="contenitore-bottoni-principali">
        <button class="bottone-principale" @click="selezionaCitazioneCasuale">Citazione Casuale</button>
        <button class="bottone-principale" @click="toggleFormNuovaCitazione">
          {{ mostraFormNuovaCitazione ? 'Nascondi Form' : 'Aggiungi Citazione' }}
        </button>
        <button class="bottone-principale" @click="toggleMostraPreferiti">
          {{ mostraSoloPreferiti ? 'Mostra Tutte' : 'Mostra Preferiti' }}
        </button>
      </div>

      <div v-if="mostraFormNuovaCitazione" class="form-nuova-citazione">
        <h3>Aggiungi una Nuova Citazione</h3>
        <input v-model="nuovaCitazione.testo" class="input-nuova-citazione" placeholder="Testo della citazione">
        <input v-model="nuovaCitazione.autore" class="input-nuova-citazione" placeholder="Autore della citazione">
        <button class="bottone-principale" @click="salvaNuovaCitazione">Salva Citazione</button>
      </div>

      <div>
        <input v-model="testoRicerca" placeholder="Cerca citazioni..." class="input-nuova-citazione">
      </div>

      <ul class="elenco-citazioni">
        <li v-for="citazione in calcolaCitazioniPagina()" :key="citazione.id" class="citazione-item">
          <div class="citazione-content">
            <p class="playfair-display" v-html="evidenziaTesto(citazione.testo)"></p>
            <p class="citazione-autore"> - {{ citazione.autore }}</p>
          </div>
          <button class="bottone-secondario" @click="rimuoviCitazione(citazione)">
            rimuovi
          </button>
          <button class="bottone-principale" @click="togglePreferita(citazione)">
            <span v-if="citazione.preferita">❤️</span>
            <span v-else>🤍</span>
          </button>
        </li>
      </ul>

      <div class="paginazione" v-if="calcolaNumeroPagine() > 1">
        <button class="bottone-pagina" @click="paginaPrecedente" :disabled="paginaCorrente === 1">Precedente</button>
        <span>Pagina {{ paginaCorrente }} di {{ calcolaNumeroPagine() }}</span>
        <button class="bottone-pagina" @click="paginaSuccessiva" :disabled="paginaCorrente === calcolaNumeroPagine()">Successiva</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');

.lettore-citazioni {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
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

.citazione-del-giorno {
  background-color: #f0f0f0;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.testo-citazione {
  font-style: italic;
  font-size: 1.4em;
}

.playfair-display {
  font-family: "Playfair Display", serif;
  font-optical-sizing: auto;
  font-weight: 1.3em;
  font-style: normal;
}

.autore-citazione {
  text-align: right;
  font-weight: bold;
}

.contenitore-bottoni-principali {
  display: flex;
  justify-content: space-between;
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
}

.citazione-item {
  background-color: #fff;
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
</style>
