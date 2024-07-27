import { Router } from 'express'
import { validateAuth } from '../middlewares/validateAuth.js'
import { deleteRate, getRecipeRates, rateRecipe, updateRate } from '../controllers/rates.js'

export const rateRouter = Router()

rateRouter.post('/rate-recipe', validateAuth, rateRecipe)
rateRouter.get('/recipe-rates/:recipeId', getRecipeRates)
rateRouter.put('/update-rate', validateAuth, updateRate)
rateRouter.delete('/delete-rate', validateAuth, deleteRate)
