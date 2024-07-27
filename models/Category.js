import { Schema, model } from 'mongoose'

const CategorySchema = Schema({
  category: {
    type: String,
    required: true,
    unique: true
  }
})

export const Category = model('Category', CategorySchema)
