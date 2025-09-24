import { supabase } from './data/supabase.js'

// Carica citazioni con ricerca + paginazione
export async function getCitazioni({ testoRicerca, pagina, perPagina }) {
  let query = supabase.from('quotes').select('*', { count: 'exact' })

  // Filtro ricerca
  if (testoRicerca && testoRicerca.trim() !== '') {
    query = query.or(
      `text.ilike.%${testoRicerca}%,author.ilike.%${testoRicerca}%`
    )
  }

  // Paginazione
  const inizio = (pagina - 1) * perPagina
  const fine = inizio + perPagina - 1
  query = query.range(inizio, fine)

  const { data, error, count } = await query
  if (error) throw error

  return { citazioni: data, totale: count }
}

// Inserisci nuova citazione
export async function aggiungiCitazione({ testo, autore }) {
  const { error } = await supabase.from('quotes').insert([
    { text: testo.trim(), author: autore.trim(), is_favorite: false }
  ])
  if (error) throw error
}

// Rimuovi citazione
export async function rimuoviCitazione(id) {
  const { error } = await supabase.from('quotes').delete().eq('id', id)
  if (error) throw error
}

// Toggle preferito
export async function togglePreferito(id, stato) {
  const { error } = await supabase
    .from('quotes')
    .update({ is_favorite: stato })
    .eq('id', id)
  if (error) throw error
}

// Subscrizione realtime
export function ascoltaRealtime(callback) {
  return supabase
    .channel('citazioni')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'quotes' },
      payload => callback(payload)
    )
    .subscribe()
}
