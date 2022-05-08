const { Route } = require('express')
const express = require('express')
const { verifyToken } = require('../Helpers/VerifyToken')
const Router = express.Router()

// Import Controller Todos
const UserController = require('./../Controllers/UserController')

// Import JWT Verify
const jwtVerify = require('./../Middleware/JWT')

Router.post('/register', UserController.register)
Router.post('/getusername', UserController.getUsername)
Router.post('/getemail', UserController.getEmail)
Router.patch('/confirmation', jwtVerify, UserController.confirmation)
Router.post('/login', UserController.login)
Router.get('/keeplogin', verifyToken, UserController.keeplogin)
Router.post('/resend', jwtVerify, UserController.resend)

module.exports = Router