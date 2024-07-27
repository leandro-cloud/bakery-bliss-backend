import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { connectionDB } from './database/connection.js'
import { userRouter } from './routes/users.js'
import cookieParser from 'cookie-parser'
import { recipesRouter } from './routes/recipes.js'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { favoritesRouter } from './routes/favorites.js'
import { rateRouter } from './routes/rates.js'
import { categoriesRouter } from './routes/categories.js'

const app = express()
app.use(express.json())
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}))
app.use(cookieParser())
dotenv.config()

connectionDB()

app.use('/api/user', userRouter)
app.use('/api/recipes', recipesRouter)
app.use('/api/favorites', favoritesRouter)
app.use('/api/rate', rateRouter)
app.use('/api/categories', categoriesRouter)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuración para servir archivos estáticos (imágenes de avatar)
app.use('/uploads/profilePictures', express.static(path.join(__dirname, 'uploads', 'profilePictures')))

// Configuración para servir archivos estáticos (imágenes de publicaciones)
app.use('/uploads/recipePictures', express.static(path.join(__dirname, 'uploads', 'recipePictures')))

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server listenig on http://localhost:${PORT}`)
})
