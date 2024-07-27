import { Recipe } from '../models/recipe.js'
import { Rate } from '../models/rate.js'
import mongoose from 'mongoose'

export const updateAverageRating = async (recipeId) => {
  try {
    // Calcular el promedio de calificaciones
    const averageRatingResult = await Rate.aggregate([
      { $match: { recipeId: new mongoose.Types.ObjectId(recipeId) } },
      { $group: { _id: '$recipeId', averageRating: { $avg: '$rate' } } }
    ])

    // Si no hay calificaciones, averageRatingResult estará vacío
    let averageRating = averageRatingResult.length > 0 ? averageRatingResult[0].averageRating : 0

    averageRating = Number.isInteger(averageRating) ? averageRating : parseFloat(averageRating.toFixed(1))

    // Buscar la receta
    const recipe = await Recipe.findById(recipeId)

    if (!recipe) {
      console.error('Recipe not found')
      return
    }

    // Actualizar el promedio de calificaciones en la receta
    recipe.averageRating = averageRating
    await recipe.save()
  } catch (error) {
    throw new Error(error.message)
  }
}
