import express from 'express'
import cors from 'cors'
import sql from './db.js'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// --- API --- //

// Leggere tutte le citazioni
app.get('/citazioni', async (req, res) => {
  try {
    const citazioni = await sql`SELECT * FROM quotes;`
    res.json(citazioni)
  } catch (err) {
    console.error(err)
    res.status(500).send('Errore server')
  }
})

// Aggiungere una nuova citazione
app.post('/citazioni', async (req, res) => {
  const { text, Author } = req.body
  try {
    const [nuovaCitazione] = await sql`
      INSERT INTO quotes (text, Author)
      VALUES (${text}, ${Author})
      RETURNING *;
    `
    res.json(nuovaCitazione)
  } catch (err) {
    console.error(err)
    res.status(500).send('Errore server')
  }
})

// Eliminare una citazione
app.delete('/citazioni/:id', async (req, res) => {
  const { id } = req.params
  try {
    await sql`DELETE FROM quotes WHERE id = ${id};`
    res.sendStatus(204)
  } catch (err) {
    console.error(err)
    res.status(500).send('Errore server')
  }
})

app.listen(process.env.PORT || 3000, () =>
  console.log(`Server avviato su http://localhost:${process.env.PORT || 3000}`)
)
