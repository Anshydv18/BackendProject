import expres from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = expres()


app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(expres.json({limit:"16kb"}))
app.use(expres.urlencoded({extended:true,limit:"16kb"}))
app.use(expres.static("public"))
app.use(cookieParser())

export { app }