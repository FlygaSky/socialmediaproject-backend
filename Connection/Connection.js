const mysql = require('mysql')
require('dotenv').config()

const db = mysql.createConnection({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
})

db.connect((err) => {
    if(err) return console.log('Error ' + err.message)

    console.log('Connected to Database!')
})

module.exports = db