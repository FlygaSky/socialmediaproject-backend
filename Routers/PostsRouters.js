const { Route } = require('express')
const express = require('express')
const Router = express.Router()
const PostController = require('./../Controllers/PostController')
const jwtVerify = require('./../Middleware/JWT')
const multerUpload = require('../Middleware/Multer')

Router.post('/upload', jwtVerify, multerUpload.single("photo"), PostController.upload)
Router.get('/getAllData', jwtVerify, PostController.getAllData)

module.exports = Router