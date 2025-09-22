<script>
import citazioniJson from '@/data/quotes.json'

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
    }
  },
  watch: {
    citazioni: {
      handler(nuoveCitazioni) {
        localStorage.setItem('citazioni', JSON.stringify(nuoveCitazioni))
      },
      deep: true,
    },
    preferiti: {
      handler(nuoviPreferiti) {
        localStorage.setItem('preferiti', JSON.stringify(nuoviPreferiti))
      },
      deep: true,
    },
  },
  created() {
    this.caricaCitazioni()
    this.caricaPreferiti()
  },
  mounted() {
    this.selezionaCitazioneCasuale()
  },
  methods: {
    caricaCitazioni() {
      const citazioniSalvate = localStorage.getItem('citazioni')
      if (citazioniSalvate) {
        try {
          this.citazioni = JSON.parse(citazioniSalvate)
        } catch (e) {
          console.error('Errore nel caricamento delle citazioni:', e)
          this.citazioni = citazioniJson.citazioni
        }
      } else {
        this.citazioni = citazioniJson.citazioni
      }
    },
    caricaPreferiti() {
      const preferitiSalvati = localStorage.getItem('preferiti')
      if (preferitiSalvati) {
        try {
          this.preferiti = JSON.parse(preferitiSalvati)
        } catch (e) {
          console.error('Errore nel caricamento dei preferiti:', e)
          localStorage.removeItem('preferiti')
        }
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
    paginaSuccessiva() {
      if (this.paginaCorrente < this.calcolaNumeroPagine()) {
        this.paginaCorrente = this.paginaCorrente + 1
      }
    },
    paginaPrecedente() {
      if (this.paginaCorrente > 1) {
        this.paginaCorrente = this.paginaCorrente - 1
      }
    },
    aggiungiAiPreferiti(citazione) {
      if (!this.isPreferita(citazione)) {
        this.preferiti.push(citazione)
      }
    },
    rimuoviDaiPreferiti(citazione) {
      const index = this.preferiti.findIndex((pref) => pref.testo === citazione.testo)
      if (index !== -1) {
        this.preferiti.splice(index, 1)
      }
    },
    toggleMostraPreferiti() {
      this.mostraSoloPreferiti = !this.mostraSoloPreferiti
      this.paginaCorrente = 1
    },
    citazionePreferita(citazione) {
      if (this.isPreferita(citazione)) {
        this.rimuoviDaiPreferiti(citazione)
      } else {
        this.aggiungiAiPreferiti(citazione)
      }
    },
    cercaCitazioni() {
      this.paginaCorrente = 1
    },
    filtraCitazioni() {
      let risultato = this.mostraSoloPreferiti ? this.preferiti : this.citazioni

      if (this.testoRicerca) {
        const ricerca = this.testoRicerca.toLowerCase().trim()
        if (ricerca) {
          risultato = risultato.filter((citazione) => {
            const testoMatch = citazione.testo.toLowerCase().includes(ricerca)
            const autoreMatch = citazione.autore.toLowerCase().includes(ricerca)

            return testoMatch || autoreMatch
          })
        }
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
      let citazioniFiltrate = this.filtraCitazioni()
      return Math.ceil(citazioniFiltrate.length / this.citazioniPerPagina)
    },
    isPreferita(citazione) {
      return this.preferiti.some((pref) => pref.testo === citazione.testo)
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
    salvaNuovaCitazione() {
      if (this.nuovaCitazione.testo.trim() && this.nuovaCitazione.autore.trim()) {
        this.citazioni.unshift({ ...this.nuovaCitazione })
        this.nuovaCitazione.testo = ''
        this.nuovaCitazione.autore = ''
        this.mostraFormNuovaCitazione = false
        this.selezionaCitazioneCasuale()
      } else {
        alert("Per favore, compila sia il testo che l'autore della citazione.")
      }
    },
    rimuoviCitazione(citazione) {
      const index = this.citazioni.findIndex(c => c.testo === citazione.testo && c.autore === citazione.autore);
      if (index !== -1) {
        this.citazioni.splice(index, 1);
        
        // Rimuovi anche dai preferiti se presente
        const prefIndex = this.preferiti.findIndex(c => c.testo === citazione.testo && c.autore === citazione.autore);
        if (prefIndex !== -1) {
          this.preferiti.splice(prefIndex, 1);
        }

        // Se la citazione rimossa era quella corrente, seleziona una nuova citazione casuale
        if (this.citazioneCorrente && this.citazioneCorrente.testo === citazione.testo && this.citazioneCorrente.autore === citazione.autore) {
          this.selezionaCitazioneCasuale();
        }

        // Aggiorna il localStorage
        localStorage.setItem('citazioni', JSON.stringify(this.citazioni));
        localStorage.setItem('preferiti', JSON.stringify(this.preferiti));
      }
    },
  },
}
</script>

<template>
    <div class="lettore-citazioni">
    <h2 class="titolo-oro">Citazione del Giorno</h2>
    <div v-if="citazioneCorrente" class="citazione-del-giorno">
      <p class="testo-citazione">"{{ citazioneCorrente.testo }}"</p>
      <p class="autore-citazione">- {{ citazioneCorrente.autore }}</p>
    </div>
    <div v-else class="citazione-del-giorno">
      <p>Nessuna citazione disponibile.</p>
    </div>
    <div class="contenitore-bottoni-principali">
      <button @click="selezionaCitazioneCasuale" class="bottone-nuova-citazione">
        Mostra un'altra citazione
      </button>
      <button @click="toggleFormNuovaCitazione" class="bottone-crea-citazione">
        Crea Nuova Citazione
      </button>
    </div>

    <!-- Form per nuova citazione -->
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
        <button @click="salvaNuovaCitazione" class="bottone-salva">Salva</button>
        <button @click="toggleFormNuovaCitazione" class="bottone-annulla">Annulla</button>
      </div>
    </div>

    <h3 class="titolo-oro">Tutte le Citazioni</h3>
    <div class="citazioni-paginate">
      <div class="controlli-superiori">
        <input
          v-model="testoRicerca"
          @input="cercaCitazioni"
          placeholder="Cerca citazioni o autori"
          class="barra-ricerca"
        />
        <button @click="toggleMostraPreferiti" class="bottone-mostra-preferiti">
          <span v-if="mostraSoloPreferiti">Mostra tutte</span>
          <span v-else>Mostra preferiti</span>
        </button>
      </div>

      <ul class="elenco-citazioni">
        <li
          v-for="citazione in calcolaCitazioniPagina()"
          :key="citazione.testo"
          class="citazione-item"
        >
          <div class="contenuto-citazione">
            <p
              class="testo-citazione"
              v-html="'&quot;' + evidenziaTesto(citazione.testo) + '&quot;'"
            ></p>
            <p class="autore-citazione" v-html="'- ' + evidenziaTesto(citazione.autore)"></p>
          </div>
          <button @click="citazionePreferita(citazione)" class="bottone-preferito">
            <span v-if="isPreferita(citazione)">⭐</span>
            <span v-else>☆</span>
          </button>
          <button @click="rimuoviCitazione(citazione)" class="bottone-rimuovi">
            🗑️
          </button>
        </li>
      </ul>

     
  <div class="controlli-paginazione">
    <button
      @click="paginaPrecedente"
      :disabled="paginaCorrente === 1"
      class="bottone-paginazione"
    >
      Precedente
    </button>
    <span class="info-pagina">Pagina {{ paginaCorrente }} di {{ calcolaNumeroPagine() }}</span>
    <button
      @click="paginaSuccessiva"
      :disabled="paginaCorrente === calcolaNumeroPagine() || calcolaNumeroPagine() === 0"
      class="bottone-paginazione"
    >
      Successiva
    </button>
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

.titolo-oro {
  color: #ffd700; /* Colore oro */
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1); /* Ombra leggera */
}

.citazione-del-giorno {
  background-color: #ffffff;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.contenitore-bottoni-principali {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.bottone-nuova-citazione,
.bottone-crea-citazione {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  color: white;
  border: none;
  border-radius: 4px;
}

.bottone-nuova-citazione {
  background-color: #4caf50;
}

.bottone-crea-citazione {
  background-color: #008cba;
}

.form-nuova-citazione {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 5px;
  margin-bottom: 30px;
  border: 1px solid #eee;
}

.input-nuova-citazione {
  width: calc(100% - 24px);
  padding: 10px 12px;
  margin-bottom: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.bottoni-form {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.bottoni-form button {
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  color: white;
}

.bottone-salva {
  background-color: #4caf50;
}

.bottone-annulla {
  background-color: #f44336;
}

.citazioni-paginate {
  margin-top: 30px;
}

.controlli-superiori {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.barra-ricerca {
  flex-grow: 1;
  margin-right: 10px;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.bottone-mostra-preferiti {
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.bottone-mostra-preferiti:hover {
  background-color: #45a049;
}

.elenco-citazioni {
  list-style-type: none;
  padding: 0;
}

.citazione-item {
  background-color: #f9f9f9;
  margin-bottom: 15px;
  padding: 15px;
  border-radius: 5px;
  position: relative;
  transition: box-shadow 0.3s;
}

.citazione-item:hover {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.contenuto-citazione {
  margin-right: 30px;
}

.testo-citazione {
  font-style: italic;
  margin-bottom: 10px;
}

.autore-citazione {
  font-weight: bold;
  text-align: right;
}

.bottone-preferito {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s;
}

.bottone-preferito:hover {
  transform: scale(1.2);
}

.bottone-rimuovi {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}

.bottone-rimuovi:hover {
  transform: scale(1.2);
}

.controlli-paginazione {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.bottone-paginazione {
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  background-color: #008cba;
  color: white;
  border: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.bottone-paginazione:hover:not(:disabled) {
  background-color: #007b9a;
}

.bottone-paginazione:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.info-pagina {
  font-size: 14px;
}

.highlight {
  background-color: yellow;
}

.form-nuova-citazione {
  margin-top: 20px;
  padding: 15px;
  background-color: #f0f0f0;
  border-radius: 5px;
}

.form-group {
  margin-bottom: 10px;
}

.form-input {
  width: 100%;
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.bottone-salva {
  padding: 10px 15px;
  font-size: 14px;
  cursor: pointer;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
}

.bottone-aggiungi {
  margin-top: 20px;
  padding: 10px 15px;
  font-size: 14px;
  cursor: pointer;
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 4px;
}
</style>
