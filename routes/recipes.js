import { Router } from 'express'
import { validateAuth } from '../middlewares/validateAuth.js'
import { createRecipe, deleteRecipe, getBestRecipes, getByCategory, getByDifficulty, getByTitle, getRandomRecipes, getRecipe, getRecipeImage, getRecipeToUpdate, getUserRecipes, updateRecipe } from '../controllers/recipes.js'
import multer from 'multer'

// Configuración de subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/recipePictures')
  },
  filename: (req, file, cb) => {
    cb(null, 'recipe' + '-' + Date.now() + '-' + file.originalname)
  }
})

// Middleware para subida de archivos
const uploads = multer({ storage })

export const recipesRouter = Router()

recipesRouter.post('/create-recipe', [validateAuth, uploads.single('image')], createRecipe)
recipesRouter.get('/get-recipe/:recipeId/:userId?', getRecipe)
recipesRouter.delete('/delete-recipe', validateAuth, deleteRecipe)
recipesRouter.get('/get-recipe-to-update/:recipeId', validateAuth, getRecipeToUpdate)
recipesRouter.put('/update-recipe/:id', [validateAuth, uploads.single('image')], updateRecipe)
recipesRouter.get('/recipe-image/:file', getRecipeImage)
recipesRouter.get('/user-recipes/:id/:page?', getUserRecipes)
recipesRouter.get('/by-title/:title/:page?', getByTitle)
recipesRouter.get('/by-category/:categoryId/:page?', getByCategory)
recipesRouter.get('/best-recipes', getBestRecipes)
recipesRouter.get('/random-recipes/:page?', getRandomRecipes)
recipesRouter.get('/by-difficulty/:difficulty/:page?', getByDifficulty)
