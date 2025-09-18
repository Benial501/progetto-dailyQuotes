<script>
import citazioniJson from '@/data/quotes.json'

export default {
  data() {
    return {
      citazioni: citazioniJson.citazioni,
      citazioneCorrente: null,
      citazioniPerPagina: 5,
      paginaCorrente: 1,
      preferiti: [],
      mostraSoloPreferiti: false,
      testoRicerca: '',
    }
  },
  mounted() {
    this.selezionaCitazioneCasuale()
  },
  methods: {
    selezionaCitazioneCasuale() {
      let numeroCasuale = Math.floor(Math.random() * this.citazioni.length)
      this.citazioneCorrente = this.citazioni[numeroCasuale]
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
    <button @click="selezionaCitazioneCasuale" class="bottone-nuova-citazione">
      mostra un altra citazione
    </button>

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

.bottone-nuova-citazione {
  margin-bottom: 20px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
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
</style>
