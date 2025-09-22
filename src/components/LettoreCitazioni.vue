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
    async inizializza() {
      this.isLoading = true
      this.messaggioErrore = null
      await Promise.all([this.caricaCitazioni()])
      this.selezionaCitazioneCasuale()
      this.isLoading = false
    },

    async caricaCitazioni() {
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select('*')

        if (error) {
          console.error('Errore Supabase:', error)
          this.messaggioErrore = 'Errore nel caricamento delle citazioni.'
          throw error
        }

        if (!data) {
          this.messaggioErrore = 'Nessuna citazione trovata.'
          return
        }

        // Mappa i dati con nomi in italiano
        this.citazioni = data.map(c => ({
          id: c.id,
          testo: c.text,
          autore: c.author,
          preferita: c.is_favorite || false,
        }))
      } catch (error) {
        console.error('Errore nel caricamento delle citazioni:', error)
      }
    },

    selezionaCitazioneCasuale() {
      if (this.citazioni.length > 0) {
        const numeroCasuale = Math.floor(Math.random() * this.citazioni.length)
        this.citazioneCorrente = this.citazioni[numeroCasuale]
      } else {
        this.citazioneCorrente = null
      }
    },

    async salvaNuovaCitazione() {
      if (this.nuovaCitazione.testo.trim() && this.nuovaCitazione.autore.trim()) {
        try {
          const { error } = await supabase.from('quotes').insert([{
            text: this.nuovaCitazione.testo,
            author: this.nuovaCitazione.autore,
            is_favorite: false
          }])

          if (error) {
            this.messaggioErrore = 'Errore nel salvataggio della citazione.'
            throw error
          }

          await this.caricaCitazioni()
          this.nuovaCitazione = { testo: '', autore: '' }
          this.mostraFormNuovaCitazione = false
          this.selezionaCitazioneCasuale()
        } catch (error) {
          console.error('Errore nel salvataggio della citazione:', error)
        }
      } else {
        alert('Per favore, compila sia il testo che l\'autore della citazione.')
      }
    },

    async rimuoviCitazione(citazione) {
      try {
        const { error } = await supabase.from('quotes').delete().eq('id', citazione.id)
        if (error) {
          this.messaggioErrore = 'Errore nella rimozione della citazione.'
          throw error
        }

        await this.caricaCitazioni()
        if (this.citazioneCorrente && this.citazioneCorrente.id === citazione.id) {
          this.selezionaCitazioneCasuale()
        }
      } catch (error) {
        console.error('Errore nella rimozione della citazione:', error)
      }
    },

    async togglePreferita(citazione) {
      try {
        const { error } = await supabase
          .from('quotes')
          .update({ is_favorite: !citazione.preferita })
          .eq('id', citazione.id)

        if (error) throw error

        citazione.preferita = !citazione.preferita
      } catch (error) {
        console.error('Errore nel toggle dei preferiti:', error)
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

    filtraCitazioni() {
      let risultato = this.citazioni

      if (this.testoRicerca) {
        const ricerca = this.testoRicerca.toLowerCase().trim()
        risultato = risultato.filter(c => c.testo.toLowerCase().includes(ricerca) ||
                                          c.autore.toLowerCase().includes(ricerca))
      }

      if (this.mostraSoloPreferiti) {
        risultato = risultato.filter(c => c.preferita)
      }

      return risultato
    },

    calcolaCitazioniPagina() {
      const citazioniFiltrate = this.filtraCitazioni()
      const inizio = (this.paginaCorrente - 1) * this.citazioniPerPagina
      const fine = inizio + this.citazioniPerPagina
      return citazioniFiltrate.slice(inizio, fine)
    },

    calcolaNumeroPagine() {
      return Math.ceil(this.filtraCitazioni().length / this.citazioniPerPagina)
    },

    evidenziaTesto(testo) {
      if (!this.testoRicerca || !this.testoRicerca.trim()) return testo
      const regex = new RegExp(`(${this.testoRicerca.trim()})`, 'gi')
      return testo.replace(regex, '<mark class="highlight">$1</mark>')
    },

    paginaSuccessiva() {
      if (this.paginaCorrente < this.calcolaNumeroPagine()) this.paginaCorrente++
    },

    paginaPrecedente() {
      if (this.paginaCorrente > 1) this.paginaCorrente--
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

    <!-- Loading -->
    <div v-if="isLoading" class="loading">
      Caricamento citazioni...
    </div>

    <div v-else>
      <!-- Citazione del giorno -->
      <div class="citazione-del-giorno">
        <p class="testo-citazione" v-html="citazioneCorrente ? evidenziaTesto(citazioneCorrente.testo) : ''"></p>
        <p class="autore-citazione">{{ citazioneCorrente ? citazioneCorrente.autore : '' }}</p>
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
      <div v-if="mostraFormNuovaCitazione" class="form-nuova-citazione">
        <h3>Aggiungi una Nuova Citazione</h3>
        <input v-model="nuovaCitazione.testo" class="input-nuova-citazione" placeholder="Testo della citazione">
        <input v-model="nuovaCitazione.autore" class="input-nuova-citazione" placeholder="Autore della citazione">
        <button class="bottone-principale" @click="salvaNuovaCitazione">Salva Citazione</button>
      </div>

      <!-- Ricerca -->
      <div>
        <input v-model="testoRicerca" placeholder="Cerca citazioni..." class="input-nuova-citazione">
      </div>

      <!-- Lista citazioni -->
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

      <!-- Paginazione -->
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
