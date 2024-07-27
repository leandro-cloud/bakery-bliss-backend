import { Schema, model } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const RateSchema = Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipeId: {
    type: Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: String
})

RateSchema.plugin(mongoosePaginate)

export const Rate = model('Rate', RateSchema)
