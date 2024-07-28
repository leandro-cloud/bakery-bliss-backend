import jwt from 'jsonwebtoken'
import { CustomError } from './errors.js'
// import { User } from '../models/user.js'

// Generar accessToken
export const generateAccessToken = (payload) => {
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1d' })
  return accessToken
}

// Generar refreshToken
export const generateRefreshToken = async (id) => {
  const refreshToken = jwt.sign({ userId: id }, process.env.REFRESH_TOKEN_KEY, { expiresIn: '30d' })
  return refreshToken
}

// Validar access token
export const validateToken = (token, type) => {
  try {
    const isValid = jwt.verify(token, type === 'access' ? process.env.ACCESS_TOKEN_KEY : type === 'general' ? process.env.CHANGE_PASSWORD_KEY : process.env.REFRESH_TOKEN_KEY)
    return isValid
  } catch (error) {
    console.log(error)
    throw new CustomError('Invalid token', 401)
  }
}

export const createToken = (payload) => {
  const token = jwt.sign(payload, process.env.CHANGE_PASSWORD_KEY, { expiresIn: '5m' })
  return token
}
