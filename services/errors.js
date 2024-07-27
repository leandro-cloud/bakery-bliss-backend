export class CustomError extends Error {
  constructor (message, statusCode, status = 'error') {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.status = status
    Error.captureStackTrace(this, this.constructor)
  }
}
