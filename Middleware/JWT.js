const jwt = require('jsonwebtoken')

// Import .env
require('dotenv').config()

const jwtVerify = (req, res, next) => {
    const token = req.headers.authorization
    if(!token) return res.status(406).send({ error: true, message: 'Token not found!' })

    jwt.verify(token, process.env.JWT_KEY, (err, dataToken) => {
        try {
           if(err) throw err 
           req.dataToken = dataToken
           next()
        } catch (error) {
            res.status(500).send({
                error: true,
                message: 'error di JWT verification ' + error.message
            })
        }
    })
}

module.exports = jwtVerify
