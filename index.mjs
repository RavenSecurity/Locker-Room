import pg from 'pg'
import bcrypt from 'bcrypt'
import express from 'express'
const PORT = 3000
const app = express()
const {Client, Pool} = pg


app.use(express.json())
app.get('/', (req, res) => res.send({ info: `Hello World!` }))

const pool = new Pool({
    host:"localhost",
    user: "coach",
    port: 5432,
    password: "hopper3",
    database: "locker_room"
});

await pool.connect();

app.get('/lobby', (req, res) => {
    console.log('route users appelée')
    
    pool.query(`Select * from lobby`, (err, resquery)=>{
        if(!err){
            res.send( resquery.rows )
        } else {
            console.log(err.message);
        }
        client.end
    })
})

app.get('/messages', (req, res) => {
    console.log('route users appelée')
    
    pool.query(`Select * from messages`, (err, resquery)=>{
        if(!err){
            res.send( resquery.rows )
        } else {
            console.log(err.message);
        }
        client.end
    })
})

app.get('/users', (req, res) => {
    console.log('route users appelée')
    
    pool.query(`Select * from users`, (err, resquery)=>{
        if(!err){
            res.send( resquery.rows )
        } else {
            console.log(err.message);
        }
        client.end
    })
})

app.get('/usersinlobby', (req, res) => {
    console.log('route users appelée')
    
    pool.query(`Select * from users_in_lobby`, (err, resquery)=>{
        if(!err){
            res.send( resquery.rows )
        } else {
            console.log(err.message);
        }
        client.end
    })
})

app.post("/register",async(req,res)=>{
    try{
        const {email,nickname,password} = req.body;
        const hashedpassword = await bcrypt.hash(password,10);
        const values= [email, nickname, hashedpassword]
        const users = await pool.query('INSERT INTO users(email,nickname,password) VALUES($1,$2,$3) RETURNING *',values)
       res.json(users.rows[0])
    }
    catch(err){
        console.error(err.message)
    }
})

app.listen(PORT, () => console.log(`Server started: http://localhost:${PORT}/`))




