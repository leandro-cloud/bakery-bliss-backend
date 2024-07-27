import { CustomError } from './errors.js'
import dotenv from 'dotenv'

dotenv.config()

const environment = process.env.NODE_ENV

export const failedRequestResponse = (res, message, statusCode) => {
  return res.status(statusCode).send({
    message,
    status: 'error',
    error: true
  })
}

export const errorResponse = (res, error) => {
  if (error instanceof CustomError) {
    return res.status(error.statusCode).send({
      status: error.status,
      message: error.message,
      error: true
    })
  } else {
    return res.status(500).send({
      status: 'error',
      message: environment === 'development' ? error.message : 'Something went wrong',
      error: true
    })
  }
}
