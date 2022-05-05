const db = require('./../Connection/Connection');
const util = require('util')
const query = util.promisify(db.query).bind(db)
const validator = require('validator')
const crypto = require('crypto')
const transporter = require('./../Helpers/Transporter')
const fs = require('fs')
const handlebars = require('handlebars')
const jwt = require('jsonwebtoken');
const { send } = require('process');

module.exports = {
    register: async(req, res) => {
        try {
            // Step1. Get All Data
            let data = req.body

            // Step2. Validasi
            if(!data.username || !data.email || !data.password) throw { message: 'Data incomplete' }
            if(!validator.isEmail(data.email)) throw { message: 'Invalid email' }

            // Step3. Hashing Password
            const hmac = crypto.createHmac('sha256', 'abc123')
            await hmac.update(data.password)
            const passwordHashed = await hmac.digest('hex')
            data.password = passwordHashed

            // Step4. Store ke Db
            let query3 = 'INSERT INTO users SET ?'
            const insertUser = await query(query3, data)
            .catch((error) => {
                throw error
            })

            jwt.sign({id: insertUser.insertId}, '123abc', (err, token) => {
                try {
                    if(err) throw err

                    // Step5.0. Save Token to Db
                    let query3 = 'UPDATE users SET token = ? WHERE id = ?'
                    db.query(query3, [token, insertUser.insertId], (err1, result1) => {
                        try {
                            if(err1) throw err1

                            // Step5.1. Send Email Confirmation
                            fs.readFile('G:/Purwadhika/MiniProject/upperture/src/Supports/Assets/EmailTemplate/EmailTemplateInline.html', {
                                encoding: 'utf-8'}, (err, file) => {
                                    if(err) throw err 

                                    const newTemplate = handlebars.compile(file)
                                    const newTemplateResult = newTemplate({link:`http://localhost:3000/confirmation/${token}`})

                                    transporter.sendMail({
                                        from: 'Upperture', // Sender Address 
                                        to: 'agnoiathlipsi@gmail.com', // Email User
                                        subject: 'Upperture Confirmation Email',
                                        html: newTemplateResult
                                    })
                                    .then((response) => {
                                        res.status(200).send({
                                            error: false, 
                                            message: 'To continue using Upperture, check your email and verify your account.'
                                        })
                                    })
                                    .catch((error) => {
                                        res.status(500).send({
                                            error: true, 
                                            message: error.message
                                        })
                                    })
                            })
                        } catch (error) {
                            res.status(500).send({
                                error: true, 
                                message: error.message
                            })
                        }
                    })
                } catch (error) {
                    res.status(500).send({
                        error: true, 
                        message: error.message
                    })
                }
            })
        } catch (error) {
            res.status(500).send({
                error: true, 
                message: error.message
            })
        }
    },

    getUsername: async(req, res) => {
        try {
            let data = req.body
            let query1 = 'SELECT * FROM users WHERE username = ?'
            const findUsername = await query(query1, data.username)
            .catch((error) => {
                throw error
            })

            if(findUsername.length > 0){
                throw { message: 'Username already taken' }
            }else {
                res.status(201).send({
                    status: 201,
                    error: false,
                    message: 'Username not taken'
                })
            }
        } catch (error) {
            res.status(500).send({
                error: true, 
                message: error.message
            })
        }
    }, 

    getEmail: async(req, res) => {
        try {
            let data = req.body
            let query2 = 'SELECT * FROM users WHERE email = ?'
            const findEmail = await query(query2, data.email)
            .catch((error) => {
                throw error
            })

            if(findEmail.length > 0){
                throw { message: 'Email already registered' }
            }else{
                res.status(201).send({
                    status: 201,
                    error: false,
                    message: 'Email not registered yet'
                })
            }
        } catch (error) {
            res.status(500).send({
                error: true, 
                message: error.message
            })
        }
    }, 

    confirmation: (req, res) => {
        // Step1. Get id
        const id = req.dataToken.id 
            // Step2.1. Check, apakah id nya exist & is_verified masih = 0
            db.query('SELECT * FROM users WHERE id = ? AND is_verified = 0', id, (err, result) => {
                try {
                    if(err) throw err 

                    if(result.length === 0){
                        res.status(400).send({
                            error: true, 
                            message: 'Account not found / email already active'
                        })
                    }else {
                         // Step3. Check, apakah token sama dengan yg disimpan di dalam database
                         db.query('SELECT token FROM users WHERE token = ?', req.headers.authorization, (err, result) => {
                            try {
                                if(err) throw err 

                                if(result.length === 0){
                                    res.status(400).send({
                                        error: true, 
                                        message: 'Token deactivated, check your newest email'
                                    })
                                }else{
                                    // Step4. Apabila is_confirmed = 0, update menjadi = 1
                                    db.query('UPDATE users SET is_verified = 1 WHERE id = ?', id, (err1, result1) => {
                                        try {
                                            if(err) throw err 

                                            res.status(200).send({
                                                error: false, 
                                                message: 'Your account is active!'
                                            })
                                        } catch (error) {
                                            res.status(500).send({
                                                error: true, 
                                                message: error.message
                                            })
                                        }
                                    })
                                }
                            } catch (error) {
                                res.status(500).send({
                                    error: true, 
                                    message: error.message
                                })
                            }
                        })
                    }
                } catch (error) {
                    res.status(500).send({
                        error: true, 
                        message: error.message
                    })
                }
            }) 
    },

    login: (req, res) => {
        try {
            const data = req.body 

            if(!data.usernameOrEmail || !data.password) throw { message: 'Data incomplete!' }

            const hmac = crypto.createHmac('sha256', 'abc123')
            hmac.update(data.password)
            const passwordHashed = hmac.digest('hex')
            data.password = passwordHashed

            if(data.usernameOrEmail.includes('@')) {
            db.query('SELECT * FROM users WHERE email = ?', [data.usernameOrEmail], (err, result) => {
                try {
                    if(err) throw error

                    if(result.length === 1){
                        if (data.password == result[0].password) {
                            jwt.sign({id: result[0].id}, '123abc', { expiresIn: "1 days" }, (err, token) => {
                                try {
                                    if(err) throw err
                                    res.status(200).json({
                                        myTkn: token,
                                        id: result[0].id,
                                        username: result[0].username,
                                        email: result[0].email
                                    })
                                } catch (error) {
                                    res.status(500).send({
                                        error: true, 
                                        message: error.message
                                    })
                                }
                            })
                        } else {
                            res.status(200).send({
                                error: true, 
                                message: "Incorrect password",
                            });
                          }
                    }else{
                        res.status(200).send({
                            error: true, 
                            message: 'Account not found'
                        })
                    }
                } catch (error) {
                    res.status(500).send({
                        error: true, 
                        message: error.message
                    })
                }
            })
        } else {
            db.query('SELECT * FROM users WHERE username = ?', [data.usernameOrEmail], (err, result) => {
                try {
                    if(err) throw error
                    if(result.length === 1){
                        if (data.password == result[0].password) {
                            jwt.sign({id: result[0].id}, '123abc', { expiresIn: "1 days" }, (err, token) => {
                                try {
                                    if(err) throw err
                                    res.status(200).json({
                                        myTkn: token,
                                        id: result[0].id,
                                        username: result[0].username,
                                        email: result[0].email
                                    })
                                } catch (error) {
                                    res.status(500).send({
                                        error: true, 
                                        message: error.message
                                    })
                                }
                            })
                        } else {
                            res.status(400).send({
                                error: true, 
                                message: "Incorrect password",
                            });
                          }
                    }else{
                        res.status(400).send({
                            error: true, 
                            message: 'Account not found'
                        })
                    }
                } catch (error) {
                    res.status(500).send({
                        error: true, 
                        message: error.message
                    })
                }
            })
        }
        } catch (error) {
            res.status(500).send({
                error: true, 
                message: error.message
            })
        }
    },

    checkUserVerify: (req, res) => {
        let id = req.dataToken.id
        
        db.query('SELECT * FROM users WHERE id = ?', id, (err, result) => {
            try {
                if(err) throw err 
                
                res.status(200).send({
                    error: false, 
                    is_confirmed: result[0].is_confirmed
                })
            } catch (error) {
                res.status(500).send({
                    error: true, 
                    message: error.message
                })
            }
        })
    },

    resend: (req, res) => {

        let id = req.dataToken.id 

        // Step0. Make sure bahwa id user itu ada
        db.query('SELECT * FROM users WHERE id = ?', id, (err, result) => {
            try {
                if(err) throw err

                if(result.length === 1){
                    // Step1. Get Email dari user id tersebut 
                    let email = result[0].email

                    // Step2. Resend Email Confirmationnya
                    jwt.sign({id: id}, '123abc', (err, token) => {
                        try {
                            if(err) throw err
        
                            // Step5.0. Save Token to Db
                            let query3 = 'UPDATE users SET token = ? WHERE id = ?'
                            db.query(query3, [token, id], (err1, result1) => {
                                try {
                                    if(err1) throw err1
        
                                    // Step5.1. Send Email Confirmation
                                    fs.readFile('G:/Purwadhika/MiniProject/upperture/src/Supports/Assets/EmailTemplate/EmailTemplateInline.html', {
                                        encoding: 'utf-8'}, (err, file) => {
                                            if(err) throw err 
        
                                            const newTemplate = handlebars.compile(file)
                                            const newTemplateResult = newTemplate({bebas: email, link:`http://localhost:3000/confirmation/${token}`, code_activation: code_activation, link_activation_code: `http://localhost:3000/confirmationcode/${token}`})
        
                                            transporter.sendMail({
                                                from: 'Upperture', // Sender Address 
                                                to: 'agnoiathlipsi@gmail.com', // Email User
                                                subject: 'Upperture Confirmation Email',
                                                html: newTemplateResult
                                            })
                                            .then((response) => {
                                                res.status(200).send({
                                                    error: false, 
                                                    message: 'Check your email to verify your account.'
                                                })
                                            })
                                            .catch((error) => {
                                                res.status(500).send({
                                                    error: false, 
                                                    message: error.message
                                                })
                                            })
                                    })
                                } catch (error) {
                                    res.status(500).send({
                                        error: true, 
                                        message: error.message
                                    })
                                }
                            })
                        } catch (error) {
                            res.status(500).send({
                                error: true, 
                                message: error.message
                            })
                        }
                    })
                }else{
                    // Kirim message error, bahwa id tidak ditemukan
                    res.status(200).send({
                        error: true, 
                        message: 'Account not found'
                    })
                }
            } catch (error) {
                console.log(error)                
            }
        })
    }
}