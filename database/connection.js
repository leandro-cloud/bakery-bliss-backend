import { connect } from 'mongoose'

export const connectionDB = async () => {
  try {
    await connect('mongodb://localhost:27017/recipes-app')
    console.log('Connected to database')
  } catch (error) {
    console.log(error)
    throw new Error('Database not found')
  }
}
