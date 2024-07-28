import { Router } from 'express'
import { logout, login, register, refreshAccessToken, profile, updateUser, uploadProfilePicture, getProfileImage, myProfile, changePassword, forgotPassword, resetPassword } from '../controllers/user.js'
import { validateAuth } from '../middlewares/validateAuth.js'
import multer from 'multer'

// Configuración de subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/profilePictures')
  },
  filename: (req, file, cb) => {
    const { userId } = req.user
    cb(null, userId + '-' + Date.now() + '-' + file.originalname)
  }
})

// Middleware para subida de archivos
const uploads = multer({ storage })

export const userRouter = Router()

userRouter.post('/register', register)
userRouter.post('/login', login)
userRouter.get('/my-profile', validateAuth, myProfile)
userRouter.post('/logout', validateAuth, logout)
userRouter.post('/refresh-token', refreshAccessToken)
userRouter.get('/profile/:id', profile)
userRouter.put('/update', validateAuth, updateUser)
userRouter.post('/upload-profile-picture', [validateAuth, uploads.single('profilePicture')], uploadProfilePicture)
userRouter.get('/profile-picture/:file', getProfileImage)
userRouter.put('/change-password', validateAuth, changePassword)
userRouter.post('/forgot-password', forgotPassword)
userRouter.post('/reset-password/:token', resetPassword)
