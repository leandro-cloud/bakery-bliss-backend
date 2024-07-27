import { Schema, model } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const IngredientsSchema = Schema({
  ingredientName: {
    type: String,
    required: true
  },
  quantity: {
    type: String,
    required: true
  }
}, { _id: false })

const RecipeSchema = Schema({
  title: {
    type: String,
    required: true
  },
  ingredients: {
    type: [IngredientsSchema]
  },
  instructions: {
    type: [String],
    required: true
  },
  prepTime: {
    type: String,
    default: '1H'
  },
  category: {
    type: [Schema.Types.ObjectId],
    ref: 'Category',
    default: ['66987bf817b30642f7e91dcb']
  },
  difficulty: {
    type: Number,
    default: 3,
    min: 1,
    max: 5
  },
  quantity: {
    type: String
  },
  image: {
    type: String,
    default: 'default.png'
  },
  publishedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immmutable: true
  },
  averageRating: { // Nuevo campo añadido
    type: Number,
    default: 0
  }
})

RecipeSchema.plugin(mongoosePaginate)

RecipeSchema.plugin(aggregatePaginate)

export const Recipe = model('Recipe', RecipeSchema)
