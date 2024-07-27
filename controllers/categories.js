import { Category } from '../models/Category.js'
import { errorResponse, failedRequestResponse } from '../services/responses.js'

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().select('-__v')

    if (!categories) {
      return failedRequestResponse(res, 'categories not found')
    }

    return res.status(200).send({
      status: 'success',
      message: 'Category found',
      categories
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

export const createCategory = async (req, res) => {
  try {
    const params = req.body
    console.log(params)

    if (!params) {
      return failedRequestResponse(res, 'category is required', 400)
    }

    const categoryExists = await Category.findOne({ category: params.category.toUpperCase() })

    if (categoryExists) {
      return failedRequestResponse(res, 'category already exists', 400)
    }

    const newCategory = await Category.create({ category: params.category.toUpperCase() })

    if (!newCategory) {
      return failedRequestResponse(res, 'Error saving category', 500)
    }

    return res.status(200).send({
      status: 'success',
      message: 'Category created'
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}
