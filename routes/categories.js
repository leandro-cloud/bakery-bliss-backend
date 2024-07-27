import { Router } from 'express'
import { createCategory, getCategories } from '../controllers/categories.js'

export const categoriesRouter = Router()

categoriesRouter.post('/create-category', createCategory)
categoriesRouter.get('/get-categories', getCategories)
