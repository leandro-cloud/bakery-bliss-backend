import { Favorite } from '../models/favorite.js'
import { Recipe } from '../models/recipe.js'
import { errorResponse, failedRequestResponse } from '../services/responses.js'

export const registerFavorite = async (req, res) => {
  try {
    const { userId } = req.user

    // ID de la receta
    const { recipeId } = req.body

    if (!recipeId) {
      return failedRequestResponse(res, 'Recipe ID is required', 400)
    }

    // Consulta a la base de datos si la receta existe
    const recipe = await Recipe.findById(recipeId)

    if (!recipe) {
      return failedRequestResponse(res, "The recipe doesn't exists", 404)
    }

    // Consultar si el usuario ya tiene esa receta como favorita
    const favoriteExists = await Favorite.findOne({ userId, recipeId })

    if (favoriteExists) {
      return failedRequestResponse(res, 'You already have this recipe as a favorite', 400)
    }

    // Guardar el favorito
    const saveFavorite = await Favorite.create({ userId, recipeId })

    if (!saveFavorite) {
      return failedRequestResponse(res, 'Error saving favorite')
    }

    return res.status(200).send({
      status: 'success',
      message: 'Favorite saved successfuly'
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Borrar favorito
export const deleteFavorite = async (req, res) => {
  try {
    const { userId } = req.user

    // Id favorito
    const { recipeId } = req.body

    if (!recipeId) {
      return failedRequestResponse(res, 'Recipe ID is required', 400)
    }

    // Eliminar favorito
    const deletedFavorite = await Favorite.findOneAndDelete({ userId, recipeId })

    if (!deletedFavorite) {
      return failedRequestResponse(res, 'Favorite not found', 404)
    }

    return res.status(200).send({
      status: 'success',
      message: 'Favorite deleted successfuly'
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Lista de favoritos
export const userFavorites = async (req, res) => {
  try {
    const { userId } = req.user

    // Asignar el número de página
    const page = req.params.page ? parseInt(req.params.page, 10) : 1

    // consultar las recetas del usuario
    // TODO analizar que datos necesito
    const options = {
      page,
      limit: 20,
      select: '-__v',
      populate: {
        path: 'recipeId',
        select: '-__v -ingredients -instructions -category -publishedBy'
      },
      lean: true,
      leanWithId: false
    }
    const favorites = await Favorite.paginate({ userId }, options)

    if (!favorites) {
      return failedRequestResponse(res, "The user doesn't have favorites", 404)
    }
    console.log(favorites)

    const newDoc = []

    favorites.docs.forEach(favorite => {
      newDoc.push(favorite.recipeId)
    })

    const newFavorites = { ...favorites, docs: [...newDoc] }

    return res.status(200).send({
      status: 'success',
      message: 'Favorites listed successfuly',
      favorites: newFavorites
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}
