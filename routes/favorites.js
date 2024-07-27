import { Router } from 'express'
import { validateAuth } from '../middlewares/validateAuth.js'
import { deleteFavorite, registerFavorite, userFavorites } from '../controllers/favorites.js'

export const favoritesRouter = Router()

favoritesRouter.post('/register-favorite', validateAuth, registerFavorite)
favoritesRouter.delete('/delete-favorite', validateAuth, deleteFavorite)
favoritesRouter.get('/user-favorites/:page?', validateAuth, userFavorites)
