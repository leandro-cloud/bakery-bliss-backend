import { failedRequestResponse } from './responses.js'
import fs from 'node:fs'

export const imageValidator = (req, res) => {
  // Conseguir el nombre del archivo
  const image = req.file.originalname

  // Obtener la extensión del archivo
  const imageSplit = image.split('.')
  const extension = imageSplit[imageSplit.length - 1]

  // Validar la extensión
  if (!['png', 'jpg', 'jpeg', 'gif'].includes(extension.toLowerCase())) {
    // Borrar archivo subido
    const filePath = req.file.path
    console.log(filePath)
    fs.unlinkSync(filePath)

    return failedRequestResponse(res, 'invalid extension', 400)
  }

  // Comprobar tamaño del archivo (pj: máximo 1MB)
  const fileSize = req.file.size
  const maxFileSize = 1 * 1024 * 1024 // 1 MB

  if (fileSize > maxFileSize) {
    const filePath = req.file.path
    fs.unlinkSync(filePath)

    return failedRequestResponse(res, 'File size exceeds limit (max 1 MB)', 400)
  }
}
