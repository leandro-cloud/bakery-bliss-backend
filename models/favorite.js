import { Schema, model } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const FavoriteSchema = Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipeId: {
    type: Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  }
})

FavoriteSchema.plugin(mongoosePaginate)

export const Favorite = model('Favorite', FavoriteSchema)
