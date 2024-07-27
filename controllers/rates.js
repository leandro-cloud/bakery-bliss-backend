import { Rate } from '../models/rate.js'
import { Recipe } from '../models/recipe.js'
// import updateAverageRating from '../services/averageRating.js'
import { errorResponse, failedRequestResponse } from '../services/responses.js'
import { updateAverageRating } from '../services/updateAverageRating.js'

// Crear una calificacion
export const rateRecipe = async (req, res) => {
  try {
    const { userId } = req.user

    // Obtener el id de la receta
    const { recipeId } = req.body

    // Validar informacion
    if (!recipeId) {
      return failedRequestResponse(res, 'Recipe ID is required', 400)
    }

    // Consultar si la receta existe
    const recipeExists = await Recipe.findOne({ _id: recipeId })

    if (!recipeExists) {
      return failedRequestResponse(res, "The recipe doen't exists", 404)
    }

    if (recipeExists.publishedBy.toString() === userId) {
      return failedRequestResponse(res, "You can't rate your own recipe", 400)
    }

    // Consultar si el usuario ya tiene esa receta como calificada
    const isAlreadyRated = await Rate.findOne({ userId, recipeId })

    if (isAlreadyRated) {
      return failedRequestResponse(res, 'Recipe already rated', 400)
    }

    const dataToSave = {
      userId,
      recipeId,
      rate: req.body.rate
    }

    if (req.body.comment) {
      dataToSave.comment = req.body.comment
    }

    const saveRate = await Rate.create(dataToSave)

    if (!saveRate) {
      return failedRequestResponse(res, 'error rating the recipe', 400)
    }

    await updateAverageRating(recipeId)

    return res.status(200).send({
      status: 'success',
      message: 'Recipe rated correctly',
      saveRate
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Obtener calificaciones de la receta
export const getRecipeRates = async (req, res) => {
  try {
    const recipeId = req.params.recipeId

    const options = {
      page: 1,
      limit: 10,
      populate: {
        path: 'userId',
        select: '_id firstName lastName'
      },
      lean: true
    }

    const recipeRates = await Rate.paginate({ recipeId }, options)

    return res.status(200).send({
      status: 'success',
      message: 'Rates found',
      recipeRates
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Modificar una calificacion
export const updateRate = async (req, res) => {
  try {
    const { userId } = req.user

    const { recipeId, rate, comment } = req.body

    if (!rate || rate === 0) {
      return failedRequestResponse(res, 'Rate must be more than 0', 400)
    }

    if (comment === '') {
      delete req.body.comment
    }

    const updateRate = await Rate.findOneAndReplace({ userId, recipeId }, { ...req.body, userId }, { new: true, runValidators: true })

    if (!updateRate) {
      return failedRequestResponse(res, 'Fail update', 400)
    }

    await updateAverageRating(recipeId)

    return res.status(200).send({
      status: 'success',
      message: 'Rate updated',
      updateRate
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Borrar una calificacion
export const deleteRate = async (req, res) => {
  const { userId } = req.user

  const { recipeId, user } = req.body
  console.log(recipeId, user)

  if (!recipeId) {
    return failedRequestResponse(res, 'Rate ID is required', 400)
  }

  const deleteRate = await Rate.findOneAndDelete({ recipeId, userId })

  if (!deleteRate) {
    return failedRequestResponse(res, "Rate not found or you don't have authorizarion to delete it", 404)
  }

  await updateAverageRating(recipeId)

  try {
    return res.status(200).send({
      status: 'success',
      message: 'Rate deleted correctly'
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}
