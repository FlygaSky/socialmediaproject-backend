const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'upperture.app@gmail.com', // Email sender
        pass: 'ckysvweggsuhlglj' // Generated key
    },
    tls: {
        rejectUnauthorized: false
    }
})

module.exports = transporter