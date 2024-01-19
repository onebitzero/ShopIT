import catchAsyncErrors from '../middleware/catchAsyncErrors.js'
import User from '../models/user.js'
import sendToken from '../utils/sendToken.js'
import ErrorHandler from '../utils/ErrorHandler.js'
import { getResetPasswordEmailTemplate } from '../utils/emailTemplates.js'
import sendEmail from '../utils/sendEmail.js'
import crypto from 'crypto'

export const registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body

  const user = await User.create({
    name,
    email,
    password
  })

  sendToken(user, 201, res)
})

// Login user /api/v1/login
export const loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    return next(new ErrorHandler('Please enter your Email and Password.', 400))
  }

  const user = await User.findOne({ email }).select('+password')

  if (!user) {
    return next(new ErrorHandler('Email doesn\'t exist.', 401))
  }

  const isPasswordValidated = await user.validatePassword(password)

  if (!isPasswordValidated) {
    return next(new ErrorHandler('Invalid password.', 401))
  }

  sendToken(user, 200, res)
})

// Logout user /api/v1/logout
export const logoutUser = catchAsyncErrors(async (req, res, next) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true
  })

  res.status(200).json({
    message: 'Logged out.'
  })
})

// Forgot password /api/v1/password/forgot
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ErrorHandler('User doesnot exist.', 404))
  }

  const resetPasswordToken = user.generateResetPasswordToken()

  await user.save()

  const resetUrl = `${process.env.FRONTEND_URL}/api/v1/password/reset/${resetPasswordToken}`

  const message = getResetPasswordEmailTemplate(user?.name, resetUrl)

  try {
    await sendEmail({
      email: user.email,
      subject: 'ShopIt password recovery.',
      message
    })

    res.status(200).json({
      message: `Email sent to ${user.email}`
    })
  } catch (err) {
    user.resetPasswordToken = undefined
    user.resetPasswordTokenExpiryDate = undefined

    await user.save()

    return next(new ErrorHandler(err?.message, 500))
  }
})

// Reset password /api/v1/password/reset/:resetPasswordToen
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTokenExpiryDate: { $gt: Date.now() }
  }).exec()

  if (!user) {
    return next(new Error('Reset link expired.', 400))
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new Error('Passwords don\'t match.', 400))
  }

  user.password = req.body.password

  user.resetPasswordToken = undefined
  user.resetPasswordTokenExpiryDate = undefined

  await user.save()

  sendToken(user, 200, res)
})
