const { Route } = require('express')
const express = require('express')
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
Router.post('/checkuserverify', jwtVerify, UserController.checkUserVerify)
Router.post('/resend', jwtVerify, UserController.resend)

module.exports = Router