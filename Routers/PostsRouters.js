const { Route } = require('express')
const express = require('express')
const Router = express.Router()

// Import Controller Todos
const PostController = require('./../Controllers/PostController')

// Import JWT Verify
const jwtVerify = require('./../Middleware/JWT')

Router.post('/create', jwtVerify, PostController.create)
Router.get('/getAllData', jwtVerify, PostController.getAllData)

module.exports = Router