import express from 'express'
import dotenv from 'dotenv'
dotenv.config()
import postRoutes from './Routes/router.js'
import mongoDBConnect from './Config/database.js'

const app=express()
const PORT=process.env.PORT;



// middleware
app.use(express.json())

// routes
app.use('/',postRoutes)


mongoDBConnect()

// app.get('/',(req,res)=>{
//     res.send('<h1>This is home</h1>')
// })

// app.post('/users',(req,res)=>{
//     const {email, pass}=req.body
//     console.log(email)
//     console.log(pass)

//     res.send('data created successfully')
// })

app.listen(PORT,()=>{
    console.log(`server running on ${PORT}`)
})
