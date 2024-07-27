import path, { dirname } from 'node:path'
import { Recipe } from '../models/recipe.js'
import { CustomError } from '../services/errors.js'
import { imageValidator } from '../services/imageValidator.js'
import { errorResponse, failedRequestResponse } from '../services/responses.js'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Favorite } from '../models/favorite.js'
import { Rate } from '../models/rate.js'

// Metodo para crear una receta
export const createRecipe = async (req, res) => {
  try {
    const { userId } = req.user

    // Recuperar los datos del body y convertirlos a un objeto y parsear los ingredientes
    const newRecipe = { ...req.body }

    newRecipe.ingredients = JSON.parse(newRecipe.ingredients)
    newRecipe.instructions = JSON.parse(newRecipe.instructions)

    if (newRecipe.category) {
      newRecipe.category = JSON.parse(newRecipe.category)
    }

    // Validar si datos requeridos existen
    if (!newRecipe.title || !newRecipe.ingredients || newRecipe.ingredients.length <= 1 || !newRecipe.instructions) {
      return failedRequestResponse(res, 'Fields are missing', 400)
    }

    // Agregar el id del usuario que la crea
    newRecipe.publishedBy = userId

    if (req.file) {
      const validationError = imageValidator(req, res)
      if (validationError) return validationError
      newRecipe.image = req.file.filename
    }

    // Crear la receta
    const createRecipe = await Recipe.create(newRecipe)

    // borrar la imagen
    if (!createRecipe) {
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }
      throw new CustomError('Error creating recipe', 500)
    }

    return res.status(200).send({
      status: 'success',
      message: 'recipe created successfully',
      recipe: createRecipe
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}
// Metodo para leer una receta
// TODO obtener tambien cuantos favoritos tiene la receta ***
// TODO arreglar la categoria
export const getRecipe = async (req, res) => {
  try {
    // Obtener el ID de la receta de los parametros
    const { recipeId } = req.params
    const { userId } = req.params

    if (!recipeId) {
      return failedRequestResponse(res, 'RecipeId is required', 400)
    }

    const searchRecipe = await Recipe.findById(recipeId).select('-__v').populate('category', '-__v').populate('publishedBy', '_id firstName lastName').lean()

    if (!searchRecipe) {
      return failedRequestResponse(res, 'Recipe not found', 404)
    }

    const existRate = userId ? await Rate.findOne({ userId, recipeId }) : false

    return res.status(200).send({
      status: 'success',
      recipe: {
        _id: searchRecipe._id,
        title: searchRecipe.title,
        ingredients: searchRecipe.ingredients,
        instructions: searchRecipe.instructions,
        prepTime: searchRecipe.prepTime,
        category: searchRecipe.category,
        difficulty: searchRecipe.difficulty,
        image: searchRecipe.image,
        averageRating: searchRecipe.averageRating
      },
      isRatedByUser: !!existRate,
      publisher: searchRecipe.publishedBy
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Metodo para pedir la informacion de la receta a actualizar
export const getRecipeToUpdate = async (req, res) => {
  try {
    const { userId } = req.user

    // Obtener el ID de la receta a elimiar
    const { recipeId } = req.params

    if (!recipeId) {
      return failedRequestResponse(res, 'RecipeId is required')
    }

    const recipe = await Recipe.findOne({ _id: recipeId, publishedBy: userId }).select('-_id -__v -averageRating -publishedBy')

    if (!recipe) {
      return failedRequestResponse(res, "Recipe not found or you doesn't have authorization to update it", 404)
    }

    return res.status(200).send({
      status: 'success',
      message: 'Recipe found',
      recipe
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Metodo para borrar una receta
export const deleteRecipe = async (req, res) => {
  try {
    const { userId } = req.user

    // Obtener el ID de la receta a eliminar
    const { recipeId } = req.body

    // Buscar la receta y que coincida con el id de usuario

    const deleteParams = req.user.role === 'admin' ? { _id: recipeId } : { _id: recipeId, publishedBy: userId }

    const recipeToDelete = await Recipe.findOneAndDelete(deleteParams)

    if (!recipeToDelete) {
      return failedRequestResponse(res, 'recipe not found or you are not authorized to delete it', 400)
    }

    // TODO ver si hay necesidad de manejar errores
    // Borrar los favoritos
    await Favorite.deleteMany({ recipeId })

    // Borrar los ratings
    await Rate.deleteMany({ recipeId })

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)

    const imageToDelete = path.join(__dirname, '..', 'uploads/recipePictures', recipeToDelete.image)

    if (fs.existsSync(imageToDelete)) {
      fs.unlinkSync(imageToDelete)
    }

    return res.status(200).send({
      status: 'success',
      message: 'Recipe deleted successfuly'
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Metodo para modificar una receta
export const updateRecipe = async (req, res) => {
  try {
    const { userId } = req.user

    // Obtener el ID de la receta a eliminar
    const { id } = req.params

    const dataToUpdate = { ...req.body }
    dataToUpdate.ingredients = JSON.parse(dataToUpdate.ingredients)
    dataToUpdate.category = JSON.parse(dataToUpdate.category)
    dataToUpdate.instructions = JSON.parse(dataToUpdate.instructions)

    delete dataToUpdate.publishedBy

    if (dataToUpdate.ingredients.length < 2) return errorResponse('At least 2 ingredients are required')

    if (req.file) {
      const validationError = imageValidator(req, res)
      if (validationError) return validationError
      dataToUpdate.image = req.file.filename
    }

    const recepeToUpdate = await Recipe.findOneAndUpdate({ _id: id, publishedBy: userId }, dataToUpdate, { runValidators: true })

    // borrar la imagen
    if (!recepeToUpdate) {
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }
      return failedRequestResponse(res, 'recipe not found or you do not have authorized to update it', 400)
    }

    if (req.file) {
      // Ruta de la imagen anterior
      const oldImage = `${req.file.destination}/${recepeToUpdate.image}`
      // Si la imagen existe se elimina
      if (fs.existsSync(oldImage)) {
        fs.unlinkSync(`${req.file.destination}/${recepeToUpdate.image}`)
      }
    }

    return res.status(200).send({
      status: 'success',
      message: 'Recipe uploaded successfuly'
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Ruta para pedir la imagen de la receta
export const getRecipeImage = (req, res) => {
  try {
    const { file } = req.params

    const filePath = './uploads/recipePictures/' + file

    if (fs.existsSync(filePath)) {
      return res.sendFile(path.resolve(filePath))
    } else {
      return failedRequestResponse(res, 'Image not found', 404)
    }
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Metodo para tener recetas random
export const getRandomRecipes = async (req, res) => {
  try {
    const page = req.params.page ? parseInt(req.params.page, 10) : 1

    const aggregate = Recipe.aggregate([
      {
        $sample: { size: 100 }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          prepTime: 1,
          difficulty: 1,
          image: 1
        }
      }
    ])

    const options = {
      page,
      limit: 20,
      lean: true
    }

    const randomRecipes = await Recipe.aggregatePaginate(aggregate, options)

    if (!randomRecipes) {
      return failedRequestResponse(res, 'Error searching the recipes', 400)
    }

    return res.status(200).send({
      status: 'Success',
      message: 'Random recipes found correctly',
      randomRecipes
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Metodo para obtener las recetas del usuario
// TODO mandar solo lo necesario
export const getUserRecipes = async (req, res) => {
  try {
    const authorId = req.params.id

    const page = req.params.page ? parseInt(req.params.page, 10) : 1

    if (!authorId || authorId === 'undefined' || authorId.trim() === '') {
      return failedRequestResponse(res, 'User ID is required', 400)
    }

    const options = {
      page,
      limit: 10,
      select: ('-__v -ingredients -instructions -category -publishedBy -id'),
      lean: true
    }

    const userRecipes = await Recipe.paginate({ publishedBy: authorId }, options)

    if (!userRecipes) {
      return failedRequestResponse(res, "The user doen't have any recipe", 404)
    }

    return res.status(200).json({
      status: 'success',
      message: 'user recipes successfully found',
      recipes: userRecipes
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Buscar recetas por titulo
// TODO mandar solo lo necesario
export const getByTitle = async (req, res) => {
  try {
    // Atrapar el query de busqueda
    const { title } = req.params

    const page = req.params.page ? parseInt(req.params.page, 10) : 1

    if (title === '') {
      return failedRequestResponse(res, 'Recipe title required', 400)
    }

    // Buscar receta por el titulo y paginacion
    const options = {
      page,
      limit: 3,
      select: ('-__v -ingredients -instructions -category -publishedBy -id'),
      lean: true
    }
    const recipesByTitle = await Recipe.paginate({ title: { $regex: `\\b${title}`, $options: 'i' } }, options)

    if (!recipesByTitle) {
      return failedRequestResponse(res, 'Search failed')
    }

    return res.status(200).send({
      status: 'success',
      message: 'Recipes searched correctly',
      recipes: recipesByTitle
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// buscar recetas por categoria
// TODO mandar solo lo necesario
// TODO Arreglara el endpoint y analizar si con nombre de la categoria o con id
export const getByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params

    if (!categoryId) {
      return failedRequestResponse(res, 'Category is required', 400)
    }

    const page = req.params.page ? parseInt(req.params.page, 10) : 1

    // Buscar receta opr categoria y paginar
    const options = {
      page,
      limit: 10,
      lean: true
    }

    const recipeByCategory = await Recipe.paginate({ category: { $in: [categoryId] } }, options)

    if (!recipeByCategory) {
      return failedRequestResponse(res, 'Search failed')
    }

    return res.status(200).send({
      status: 'success',
      message: 'Recipes searched correctly',
      recipes: recipeByCategory
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Endpoint para las mejores recetas
// TODO devolver mas cosas si es necesario
export const getBestRecipes = async (req, res) => {
  try {
    // Buscar las mejores recetas
    const topRatedRecipes = await Recipe.find().sort({ averageRating: -1 }).limit(10)
      .select('_id title difficulty image averageRating')

    if (!topRatedRecipes) {
      return failedRequestResponse(res, 'Search failed', 400)
    }

    return res.status(200).send({
      status: 'success',
      message: 'Best recipes searched correctly',
      topRatedRecipes
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Buscar recetas por dificultad

export const getByDifficulty = async (req, res) => {
  try {
    const { difficulty } = req.params

    const page = req.params.page ? parseInt(req.params.page, 10) : 1

    // Buscar receta opr categoria y paginar
    const options = {
      page,
      limit: 10,
      lean: true,
      select: ('-__v -ingredients -instructions -publishedBy')
    }

    const recipesByDifficulty = await Recipe.paginate({ difficulty }, options)

    if (!recipesByDifficulty) {
      return failedRequestResponse(res, 'Recipes not found', 400)
    }

    return res.status(200).send({
      status: 'success',
      message: 'Recipes by cagegory found',
      recipes: recipesByDifficulty
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}
