<script>
const API_BASE_URL = 'http://localhost:3000'; // Considera di spostare questo in un file di configurazione

export default {
  data() {
    return {
      citazioni: [],
      citazioneCorrente: null,
      citazioniPerPagina: 5,
      paginaCorrente: 1,
      preferiti: [],
      mostraSoloPreferiti: false,
      testoRicerca: '',
      mostraFormNuovaCitazione: false,
      nuovaCitazione: {
        testo: '',
        autore: '',
      },
      isLoading: true,
    }
  },
  async created() {
    await this.inizializza()
  },
  methods: {
    async inizializza() {
      this.isLoading = true
      await Promise.all([this.caricaCitazioni(), this.caricaPreferiti()])
      this.selezionaCitazioneCasuale()
      this.isLoading = false
    },
    async caricaCitazioni() {
      try {
        const response = await fetch(`${API_BASE_URL}/citazioni`)
        if (!response.ok) throw new Error("Errore nel caricamento delle citazioni")
        const data = await response.json()
        this.citazioni = data.map(quote => ({
          id: quote.id,
          testo: quote.text,
          autore: quote.Author
        }))
      } catch (error) {
        console.error("Errore nel caricamento delle citazioni:", error)
      }
    },
    async caricaPreferiti() {
      try {
        const response = await fetch(`${API_BASE_URL}/preferiti`)
        if (!response.ok) throw new Error("Errore nel caricamento dei preferiti")
        this.preferiti = await response.json()
      } catch (error) {
        console.error("Errore nel caricamento dei preferiti:", error)
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
          const response = await fetch(`${API_BASE_URL}/citazioni`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: this.nuovaCitazione.testo,
              Author: this.nuovaCitazione.autore
            }),
          })
          if (!response.ok) throw new Error("Errore nel salvataggio della citazione")
          await this.caricaCitazioni()
          this.nuovaCitazione = { testo: '', autore: '' }
          this.mostraFormNuovaCitazione = false
          this.selezionaCitazioneCasuale()
        } catch (error) {
          console.error("Errore nel salvataggio della nuova citazione:", error)
        }
      } else {
        alert("Per favore, compila sia il testo che l'autore della citazione.")
      }
    },
    async rimuoviCitazione(citazione) {
      try {
        const response = await fetch(`${API_BASE_URL}/citazioni/${citazione.id}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error("Errore nella rimozione della citazione")
        await this.caricaCitazioni()
        if (this.citazioneCorrente && this.citazioneCorrente.id === citazione.id) {
          this.selezionaCitazioneCasuale()
        }
        await this.rimuoviDaiPreferiti(citazione)
      } catch (error) {
        console.error("Errore nella rimozione della citazione:", error)
      }
    },
    async aggiungiAiPreferiti(citazione) {
      if (!this.isPreferita(citazione)) {
        try {
          const response = await fetch(`${API_BASE_URL}/preferiti`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ citazione_id: citazione.id }),
          })
          if (!response.ok) throw new Error("Errore nell'aggiunta ai preferiti")
          await this.caricaPreferiti()
        } catch (error) {
          console.error("Errore nell'aggiunta ai preferiti:", error)
        }
      }
    },
    async rimuoviDaiPreferiti(citazione) {
      try {
        const response = await fetch(`${API_BASE_URL}/preferiti/${citazione.id}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error("Errore nella rimozione dai preferiti")
        await this.caricaPreferiti()
      } catch (error) {
        console.error("Errore nella rimozione dai preferiti:", error)
      }
    },
    toggleMostraPreferiti() {
      this.mostraSoloPreferiti = !this.mostraSoloPreferiti
      this.paginaCorrente = 1
    },
    async citazionePreferita(citazione) {
      if (this.isPreferita(citazione)) {
        await this.rimuoviDaiPreferiti(citazione)
      } else {
        await this.aggiungiAiPreferiti(citazione)
      }
    },
    filtraCitazioni() {
      let risultato = this.mostraSoloPreferiti 
        ? this.citazioni.filter(c => this.preferiti.some(p => p.citazione_id === c.id))
        : this.citazioni

      if (this.testoRicerca) {
        const ricerca = this.testoRicerca.toLowerCase().trim()
        risultato = risultato.filter((citazione) => {
          return citazione.testo.toLowerCase().includes(ricerca) ||
                 citazione.autore.toLowerCase().includes(ricerca)
        })
      }

      return risultato
    },
    calcolaCitazioniPagina() {
      let citazioniFiltrate = this.filtraCitazioni()
      let inizio = (this.paginaCorrente - 1) * this.citazioniPerPagina
      let fine = inizio + this.citazioniPerPagina
      return citazioniFiltrate.slice(inizio, fine)
    },
    calcolaNumeroPagine() {
      return Math.ceil(this.filtraCitazioni().length / this.citazioniPerPagina)
    },
    isPreferita(citazione) {
      return this.preferiti.some((pref) => pref.citazione_id === citazione.id)
    },
    evidenziaTesto(testo) {
      if (!this.testoRicerca || !this.testoRicerca.trim()) {
        return testo
      }
      const ricerca = this.testoRicerca.trim()
      const regex = new RegExp(`(${ricerca})`, 'gi')
      return testo.replace(regex, '<mark class="highlight">$1</mark>')
    },
    toggleFormNuovaCitazione() {
      this.mostraFormNuovaCitazione = !this.mostraFormNuovaCitazione
    },
    paginaSuccessiva() {
      if (this.paginaCorrente < this.calcolaNumeroPagine()) {
        this.paginaCorrente++
      }
    },
    paginaPrecedente() {
      if (this.paginaCorrente > 1) {
        this.paginaCorrente--
      }
    },
  },
}
</script>

<template>
  <div class="lettore-citazioni">
    <div v-if="isLoading" class="loading">Caricamento in corso...</div>
    <div v-else class="contenuto-principale">
      <h2 class="titolo-oro">Citazione del Giorno</h2>
      <div v-if="citazioneCorrente" class="citazione-del-giorno">
        <p class="testo-citazione">"{{ citazioneCorrente.testo }}"</p>
        <p class="autore-citazione">- {{ citazioneCorrente.autore }}</p>
      </div>
      <div v-else class="citazione-del-giorno">
        <p>Nessuna citazione disponibile.</p>
      </div>
      <div class="contenitore-bottoni-principali">
        <button @click="selezionaCitazioneCasuale" class="bottone-principale">
          Mostra un'altra citazione
        </button>
        <button @click="toggleFormNuovaCitazione" class="bottone-principale">
          Crea Nuova Citazione
        </button>
      </div>

      <div v-if="mostraFormNuovaCitazione" class="form-nuova-citazione">
        <h3 class="titolo-oro">Aggiungi una nuova citazione</h3>
        <input
          v-model="nuovaCitazione.testo"
          placeholder="Testo della citazione"
          class="input-nuova-citazione"
        />
        <input
          v-model="nuovaCitazione.autore"
          placeholder="Autore della citazione"
          class="input-nuova-citazione"
        />
        <div class="bottoni-form">
          <button @click="salvaNuovaCitazione" class="bottone-principale">Salva</button>
          <button @click="toggleFormNuovaCitazione" class="bottone-secondario">Annulla</button>
        </div>
      </div>

      <h3 class="titolo-oro">Tutte le Citazioni</h3>
      <div class="citazioni-paginate">
        <div class="controlli-superiori">
          <input
            v-model="testoRicerca"
            @input="paginaCorrente = 1"
            placeholder="Cerca citazioni o autori"
            class="barra-ricerca"
          />
          <button @click="toggleMostraPreferiti" class="bottone-principale">
            {{ mostraSoloPreferiti ? 'Mostra tutte' : 'Mostra preferiti' }}
          </button>
        </div>

        <ul class="elenco-citazioni">
          <li
            v-for="citazione in calcolaCitazioniPagina()"
            :key="citazione.id"
            class="citazione-item"
          >
            <div class="contenuto-citazione">
              <p
                class="testo-citazione"
                v-html="'&quot;' + evidenziaTesto(citazione.testo) + '&quot;'"
              ></p>
              <p class="autore-citazione" v-html="'- ' + evidenziaTesto(citazione.autore)"></p>
            </div>
            <div class="azioni-citazione">
              <button @click="citazionePreferita(citazione)" class="bottone-preferito">
                {{ isPreferita(citazione) ? '⭐' : '☆' }}
              </button>
              <button @click="rimuoviCitazione(citazione)" class="bottone-rimuovi">
                Rimuovi
              </button>
            </div>
          </li>
        </ul>

        <div class="contenitore-paginazione">
          <button @click="paginaPrecedente" :disabled="paginaCorrente === 1" class="bottone-pagina">
            Pagina Precedente
          </button>
          <span class="info-pagina">
            Pagina {{ paginaCorrente }} di {{ calcolaNumeroPagine() }}
          </span>
          <button @click="paginaSuccessiva" :disabled="paginaCorrente === calcolaNumeroPagine()" class="bottone-pagina">
            Pagina Successiva
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lettore-citazioni {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.loading {
  text-align: center;
  font-size: 1.2em;
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
  font-size: 1.2em;
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

.bottone-principale, .bottone-secondario, .bottone-pagina {
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
}

.bottone-principale {
  background-color: #4CAF50;
  color: white;
  white-space: nowrap;
}

.bottone-secondario {
  background-color: #f44336;
  color: white;
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

.controlli-superiori {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.barra-ricerca {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
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

.azioni-citazione {
  display: flex;
  gap: 10px;
}

.bottone-preferito, .bottone-rimuovi {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
}

.contenitore-paginazione {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.info-pagina {
  font-size: 0.9em;
}

.highlight {
  background-color: yellow;
}
</style>