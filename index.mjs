import pg from 'pg'
import express from 'express'
import bcrypt from 'bcrypt'
import JWT from 'jsonwebtoken'
import dotenv from 'dotenv'
import { promisify } from 'util'

const { Pool } = pg

// Loading variables from the .env file
dotenv.config()

const pool = new Pool()
await pool.connect()

// Launching express
const server = express()

// Promisify the JWT helpers
// => transform callback into Promise based function (async)
const sign = promisify(JWT.sign)
const verify = promisify(JWT.verify)

// Use the json middleware to parse the request body
server.use(express.json())

server.post('/api/register', async (req, res) => {
  const { email, nickname, password } = req.body

  if (!email || !password || !nickname)
    return res.status(400).send({ error: 'Invalid request' })

  try {
    const encryptedPassword = await bcrypt.hash(password, 10)

    await pool.query(
      'INSERT INTO users (email, password, nickname) VALUES ($1, $2, $3)',
      [email, encryptedPassword, nickname]
    )

    return res.send({ info: 'User succesfully created' })
  } catch (err) {
    console.log(err)

    return res.status(500).send({ error: 'Internal server error' })
  }
})

server.post('/api/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password)
    return res.status(400).send({ error: 'Invalid request' })

  const q = await pool.query(
    'SELECT password, id, nickname from users WHERE email=$1',
    [email]
  )

  if (q.rowCount === 0) {
    return res.status(404).send({ error: 'This user does not exist' })
  }

  const result = q.rows[0]
  const match = await bcrypt.compare(password, result.password)

  if (!match) {
    return res.status(403).send({ error: 'Wrong password' })
  }

  try {
    const token = await sign(
      { id: result.id, nickname: result.nickname, email },
      process.env.JWT_SECRET,
      {
        algorithm: 'HS512',
        expiresIn: '1h',
      }
    )

    return res.send({ token })
  } catch (err) {
    console.log(err)
    return res.status(500).send({ error: 'Cannot generate token' })
  }
})

// This middleware will ensure that all subsequent routes include a valid token in the authorization header
// The 'user' variable will be added to the request object, to be used in the following request listeners
server.use(async (req, res, next) => {
  if (!req.headers.authorization) return res.status(401).send('Unauthorized')

  try {
    const decoded = await verify(
      req.headers.authorization.split(' ')[1],
      process.env.JWT_SECRET
    )

    if (decoded !== undefined) {
      req.user = decoded
      return next()
    }
  } catch (err) {
    console.log(err)
  }

  return res.status(403).send('Invalid token')
})

server.get('/api/hello', (req, res) => {
  res.send({ info: 'Hello ' + req.user.nickname })
})

server.get('/api/users', async (req, res) => {
  const q = await pool.query('SELECT nickname from users')
  return res.send(q.rows)
})

server.listen(3000, () => console.log('http://localhost:3000'))