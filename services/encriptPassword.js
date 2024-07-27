import { CustomError } from './errors.js'
import bcrypt from 'bcrypt'

export const encryptPassword = async (password) => {
  try {
    const encryptedPassword = await bcrypt.hash(password, 10)
    return encryptedPassword
  } catch (error) {
    throw new CustomError('error encrypting password', 500)
  }
}
