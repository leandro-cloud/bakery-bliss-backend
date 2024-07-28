import { User } from '../models/user.js'
import bcrypt from 'bcrypt'
import { createToken, generateAccessToken, generateRefreshToken, validateToken } from '../services/tokenService.js'
import { CustomError } from '../services/errors.js'
import { encryptPassword } from '../services/encriptPassword.js'
import { errorResponse, failedRequestResponse } from '../services/responses.js'
import fs from 'node:fs'
import path from 'node:path'
import { Favorite } from '../models/favorite.js'
import nodemailer from 'nodemailer'

// Metodo para registrar usuarios
export const register = async (req, res) => {
  try {
    const params = req.body

    // Verificar si faltan campos
    if (!params.firstName || !params.lastName || !params.userName || !params.password || !params.email) {
      return failedRequestResponse(res, 'Fields are missing', 400)
    }

    // Crear instancia del modelo
    const userToSave = new User(params)

    // Verificar si el usuario existe
    const userExists = await User.findOne({
      $or: [
        { email: userToSave.email.toLowerCase() },
        { userName: userToSave.userName.toLowerCase() }
      ]
    })

    if (userExists) {
      return failedRequestResponse(res, 'user already exists', 409)
    }

    // Encriptar el password
    const hashedPassword = await encryptPassword(userToSave.password)
    userToSave.password = hashedPassword

    // Guardar el usuario en la base de datos
    await userToSave.save()

    return res.status(200).send({
      status: 'success',
      message: 'User registered successfully'
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Metodo para login de usuarios
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Verificar si hay email y password
    if (!email || !password) {
      return failedRequestResponse(res, 'Fields are missing', 400)
    }

    // Verificar si el usuario existe
    const user = await User.findOne({ email })

    if (!user) {
      return failedRequestResponse(res, "The user doesn't exists", 404)
    }

    // Verificar la contraseña
    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return failedRequestResponse(res, 'Incorret email or password', 400)
    }

    // Generar el payload para el access token
    const payload = {
      userId: user._id,
      username: user.userName,
      email: user.email,
      role: user.role
    }

    // Generar los tokens
    const accessToken = generateAccessToken(payload)
    const refreshToken = await generateRefreshToken(user._id)

    // Generar cookies
    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 })

    // Lista de favoritos
    const favorites = await Favorite.find({ userId: user._id }).select('recipeId  -_id')

    return res.status(200).send({
      status: 'success',
      message: 'User logged in successfully',
      user: {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.userName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      },
      favorites
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}
// endpoint para traer datos del usuario
export const myProfile = async (req, res) => {
  try {
    const { userId } = req.user

    // buscar el perfil de usuario
    const user = await User.findById(userId)

    if (!user) {
      return failedRequestResponse(res, "The user doesn't exists", 404)
    }

    const favorites = await Favorite.find({ userId: user._id }).select('recipeId  -_id')

    return res.status(200).send({
      status: 'success',
      message: 'User info found',
      user: {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      },
      favorites
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Metodo para actualizar los datos del usuario
export const updateUser = async (req, res) => {
  try {
    // Obtener los datos del usuario
    const userIdentity = req.user
    const userToUpdate = req.body

    // Validar que los campos necesarios esten presentes
    if (!userToUpdate.email || !userToUpdate.userName) {
      return failedRequestResponse(res, 'Fields email and username are required', 400)
    }

    // delete userToUpdate.role
    delete userToUpdate.profileImage
    delete userToUpdate.createdAt

    // Consultar si el email y username existen en la base de datos y que sean diferentes al id del usuario
    const users = await User.find({
      $and: [
        { _id: { $ne: userIdentity.userId } },
        {
          $or: [
            { email: userToUpdate.email.toLowerCase() },
            { userName: userToUpdate.userName.toLowerCase() }
          ]
        }
      ]
    })

    // Si hay duplicados manda error
    if (users.length > 0) {
      const duplicateEmail = users.some(user => user.email.toLowerCase() === userToUpdate.email.toLowerCase())
      const duplicateUserName = users.some(user => user.userName.toLowerCase() === userToUpdate.userName.toLowerCase())

      if (duplicateEmail && duplicateUserName) return failedRequestResponse(res, 'Email and username already exists', 409)
      if (duplicateEmail) return failedRequestResponse(res, 'Email already exists', 409)
      if (duplicateUserName) return failedRequestResponse(res, 'Username already exists', 409)
    }

    // Encriptar la contraseña si la hay
    if (userToUpdate.password) {
      const pwd = await encryptPassword(userToUpdate.password)
      userToUpdate.password = pwd
    }

    // Buscar y actualizar el usuario
    const userUpdated = await User.findByIdAndUpdate(userIdentity.userId, userToUpdate, { new: true, runValidators: true }).select('-password -__v -createdAt')

    if (!userUpdated) {
      throw new CustomError('Error updating the user', 400)
    }

    return res.status(200).json({
      status: 'success',
      message: 'User successfully updated',
      user: userUpdated
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Endpoint para cambiar contraseña
export const changePassword = async (req, res) => {
  try {
    const { userId } = req.user

    const { oldPassword, newPassword } = req.body

    if (!oldPassword) {
      return failedRequestResponse(res, 'Old password is required', 400)
    }
    // Confirmar si la antigua contraseña es valida
    const user = await User.findById(userId)

    if (!user) {
      return failedRequestResponse(res, "The user doesn't exists", 404)
    }

    const validPassword = await bcrypt.compare(oldPassword, user.password)

    if (!validPassword) {
      return failedRequestResponse(res, 'Old password is invalid', 400)
    }

    const hashedPassword = await encryptPassword(newPassword)

    const updatePassword = await User.findOneAndUpdate({ _id: userId }, { password: hashedPassword })

    if (!updatePassword) {
      return failedRequestResponse(res, 'The password change failed', 500)
    }

    return res.status(200).send({
      status: 'success',
      message: 'Password changed'
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Cerrar sesion
export const logout = (req, res) => {
  try {
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    return res.status(200).send({
      status: 'success',
      message: 'Logout successful'
    })
  } catch (error) {
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    return errorResponse(res, error)
  }
}

// Generar nuevo access token si el anterior ya no es valido
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
      return failedRequestResponse(res, 'Token is missing', 400)
    }

    const isValid = validateToken(refreshToken, 'refresh')

    console.log(isValid)

    const user = await User.findOne({ _id: isValid.userId })

    if (!user) {
      return failedRequestResponse(res, "user doen't exists", 404)
    }

    const payload = {
      userId: user._id,
      username: user.userName,
      email: user.email,
      role: user.role
    }

    const newAccessToken = generateAccessToken(payload)

    res.cookie('accessToken', newAccessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
    return res.status(200).send({
      status: 'success',
      message: 'New Access token generated correctly'
    })
  } catch (error) {
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    return errorResponse(res, error)
  }
}

// Metodo para subir imagen de perfil
export const uploadProfilePicture = async (req, res) => {
  try {
    // Recoger el archivo de imagen y comprobarmos que existe
    if (!req.file) return failedRequestResponse(res, 'The image is required', 400)

    // Conseguir el nombre del archivo
    const image = req.file.originalname

    const { oldImageName } = req.body

    console.log(oldImageName)

    // Obtener la extensión del archivo
    const imageSplit = image.split('.')
    const extension = imageSplit[imageSplit.length - 1]

    // Validar la extensión
    if (!['png', 'jpg', 'jpeg', 'gif'].includes(extension.toLowerCase())) {
      // Borrar archivo subido
      const filePath = req.file.path
      fs.unlinkSync(filePath)

      return failedRequestResponse(res, 'invalid extension', 400)
    }

    // Comprobar tamaño del archivo (pj: máximo 1MB)
    const fileSize = req.file.size
    const maxFileSize = 3 * 1024 * 1024 // 1 MB

    if (fileSize > maxFileSize) {
      const filePath = req.file.path
      fs.unlinkSync(filePath)

      return failedRequestResponse(res, 'File size exceeds limit (max 3 MB)', 400)
    }

    // Guardar la imagen en la BD
    const userUpdated = await User.findOneAndUpdate(
      { _id: req.user.userId },
      { profileImage: req.file.filename }, { new: true }
    ).select('-password -__v -createdAt')

    // verificar si la actualización fue exitosa
    if (!userUpdated) {
      fs.unlinkSync(req.file.path)
      throw new CustomError('Image upload error', 500)
    }

    // Ruta de la imagen anterior
    const oldImage = `${req.file.destination}/${oldImageName}`

    // Si la imagen existe se elimina
    if (fs.existsSync(oldImage)) {
      fs.unlinkSync(`${req.file.destination}/${oldImageName}`)
    }

    // Devolver respuesta exitosa
    return res.status(200).json({
      status: 'success',
      message: 'Profile image updated successfully',
      user: userUpdated
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Ruta para pedir la imagen de usuario
export const getProfileImage = (req, res) => {
  try {
    const { file } = req.params

    const filePath = './uploads/profilePictures/' + file

    if (fs.existsSync(filePath)) {
      return res.sendFile(path.resolve(filePath))
    } else {
      return failedRequestResponse(res, 'Image not found', 404)
    }
  } catch (error) {
    return errorResponse(res, error)
  }
}

// Metodo para mostrar el perfil de un usuario
export const profile = async (req, res) => {
  try {
    // Obtener el ID del usuario desde los parametros de la URL
    const { id } = req.params

    // Buscar al usuario en la BD, excluimos la contraseña, rol, versión.
    const userProfile = await User.findOne({ _id: id }).select('-password -role -__v')

    // Buscar recetas del usuario

    if (!userProfile) {
      return failedRequestResponse(res, 'User not found', 404)
    }

    return res.status(200).json({
      status: 'success',
      user: userProfile
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    console.log(email)
    if (!email) {
      return failedRequestResponse(res, 'Email is required', 400)
    }

    const user = await User.findOne({ email })

    if (!user) {
      return failedRequestResponse(res, 'User not found', 404)
    }

    const token = createToken({ id: user._id })

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'bakeryblissrecipes@gmail.com',
        pass: process.env.EMAIL_KEY
      }
    })

    const mailOptions = {
      from: 'bakeryblissrecipes@gmail.com',
      to: email,
      subject: 'Reset password',
      text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
        `http://localhost:5173/reset-password/${token}\n\n` +
        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
    }

    await transporter.sendMail(mailOptions)
    return res.status(200).send({ status: 'success', message: 'Email sent' })
  } catch (error) {
    return errorResponse(res, error)
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    if (!token || !password) {
      return failedRequestResponse(res, 'Data is missing', 400)
    }

    const decoded = validateToken(token, 'general')
    const id = decoded.id

    console.log(token, password)
    const hashPassword = await encryptPassword(password)
    const changePassword = await User.findByIdAndUpdate({ _id: id }, { password: hashPassword })

    if (!changePassword) {
      return failedRequestResponse(res, 'Error updating password', 400)
    }

    return res.status(200).send({
      status: 'success',
      message: 'Password changed successfuly'
    })
  } catch (error) {
    return errorResponse(res, error)
  }
}
