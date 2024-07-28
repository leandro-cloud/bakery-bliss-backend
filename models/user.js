import { Schema, model } from 'mongoose'

const UserSchema = Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    minlength: 8
  },
  password: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    default: 'default.png'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    immutable: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immmutable: true
  }
})

export const User = model('User', UserSchema)
