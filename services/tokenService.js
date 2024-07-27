import jwt from 'jsonwebtoken'
import { CustomError } from './errors.js'
// import { User } from '../models/user.js'

// Generar accessToken
export const generateAccessToken = (payload) => {
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1h' }) // WARNING volver a poner bien la fecha de expiracion
  return accessToken
}

// Generar refreshToken
export const generateRefreshToken = async (id) => {
  const refreshToken = jwt.sign({ userId: id }, process.env.REFRESH_TOKEN_KEY, { expiresIn: '7d' }) // WARNING volver a poner bien la fecha de expiracion
  return refreshToken
}

// Validar access token
export const validateToken = (token, type) => {
  try {
    const isValid = jwt.verify(token, type === 'access' ? process.env.ACCESS_TOKEN_KEY : process.env.REFRESH_TOKEN_KEY)
    return isValid
  } catch (error) {
    throw new CustomError('Invalid token', 401)
  }
}
