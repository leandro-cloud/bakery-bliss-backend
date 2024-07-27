import { CustomError } from '../services/errors.js'
import { validateToken } from '../services/tokenService.js'
import { errorResponse } from '../services/responses.js'

export const validateAuth = (req, res, next) => {
  // Verificar access Token
  try {
    const accessToken = req.cookies.accessToken

    // Si no hay token de acceso
    if (!accessToken) {
      throw new CustomError('Credentials are missing', 401)
    }

    const isValidToken = validateToken(accessToken, 'access')

    req.user = isValidToken

    next()
  } catch (error) {
    return errorResponse(res, error)
  }
}
