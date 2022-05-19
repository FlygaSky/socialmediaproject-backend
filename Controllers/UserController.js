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
            let data = req.body

            if(!data.username || !data.email || !data.password) throw { message: 'Data incomplete' }
            if(!validator.isEmail(data.email)) throw { message: 'Invalid email' }

            const hmac = crypto.createHmac('sha256', 'abc123')
            await hmac.update(data.password)
            const passwordHashed = await hmac.digest('hex')
            data.password = passwordHashed

            let query3 = 'INSERT INTO users SET ?'
            const insertUser = await query(query3, data)
            .catch((error) => {
                throw error
            })

            jwt.sign({id: insertUser.insertId}, '123abc', (err, token) => {
                try {
                    if(err) throw err

                    let query3 = 'UPDATE users SET token = ? WHERE id = ?'
                    db.query(query3, [token, insertUser.insertId], (err1, result1) => {
                        try {
                            if(err1) throw err1

                            fs.readFile('G:/Purwadhika/MiniProject/upperture/src/Supports/Assets/EmailTemplate/EmailTemplateInline.html', {
                                encoding: 'utf-8'}, (err, file) => {
                                    if(err) throw err 

                                    const newTemplate = handlebars.compile(file)
                                    const newTemplateResult = newTemplate({link:`http://localhost:3000/confirmation/${token}`, username:`${data.username}`})

                                    transporter.sendMail({
                                        from: 'Upperture', // Sender Address 
                                        to: data.email, // Email User
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
            let query1 = 'SELECT * FROM users WHERE email = ?'
            const findEmail = await query(query1, data.email)
            // if(error) throw error
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

    getPassword: async(req, res) => {
        try {
            let data = req.body

            const hmac = crypto.createHmac('sha256', 'abc123')
            hmac.update(data.password)
            const passwordHashed = hmac.digest('hex')
            data.password = passwordHashed

            let query1 = 'SELECT * FROM users WHERE password = ? AND id = ?'
            const findPassword = await query(query1, [data.password, data.id])
            if(findPassword.length == 0){
                throw { message: 'Incorrect old password' }
            }else {
                res.status(201).send({
                    status: 201,
                    error: false,
                    message: 'Correct password'
                })
            }
        } catch (error) {
            res.status(500).send({
                error: true, 
                message: error.message
            })
        }
    }, 

    getUserData: async(req, res) => {
        try {
            const id = req.dataToken.id 
            const token = req.headers.authorization

            let query1 = 'SELECT * FROM users WHERE id = ?'
            const userData = await query(query1, id)

            if(token == userData[0].reset_password_token){
                res.status(201).send({
                    status: 201,
                    error: false,
                    username: userData[0].username,
                    tokenIsValid: true,
                    message: 'Token is valid'
                })
            }else{
                res.status(201).send({
                    status: 201,
                    error: false,
                    username: userData[0].username,
                    tokenIsValid: false,
                    message: 'Token deactivated, please check your newest email.'
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
        const id = req.dataToken.id 
        db.query('SELECT * FROM users WHERE id = ? AND is_verified = 0', id, (err, result) => {
            try {
                if(err) throw err 

                if(result.length === 0){
                    res.status(400).send({
                        error: true, 
                        message: 'Account not found / email already active'
                    })
                }else {
                        db.query('SELECT * FROM users WHERE token = ?', req.headers.authorization, (err, result) => {
                        try {
                            if(err) throw err 

                            if(result.length === 0){
                                res.status(400).send({
                                    error: true, 
                                    message: 'Token deactivated, check your newest email'
                                })
                            }else{
                                db.query('UPDATE users SET is_verified = 1 WHERE id = ?', id, (err1, result1) => {
                                    try {
                                        if(err1) {
                                            throw err1 
                                        } else { 
                                            db.query('INSERT INTO user_detail SET users_id = ?', id, (err2, result2) => {
                                            try {
                                                if(err2) {
                                                    throw err2 
                                                } else { db.query('SELECT * FROM users WHERE id = ?', id, (err3, result3) => {
                                                    try {
                                                        if(err3) throw err3 
                                                        res.status(200).send({
                                                            error: false, 
                                                            message: 'Your account is active!',
                                                            myTkn: result3[0].token,
                                                            id: result3[0].id,
                                                            username: result3[0].username,
                                                            email: result3[0].email,
                                                            isVerified: result3[0].is_verified
                                                        })
                                                    } catch (error) {
                                                        res.status(500).send({
                                                            error: true, 
                                                            message: error.message
                                                        })
                                                    }
                                                }
                                            )}
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
        })} 
    } catch (error) {
            res.status(500).send({
                error: true, 
                message: error.message
        })
    }}) 
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
                                        email: result[0].email,
                                        isVerified: result[0].is_verified
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
                                        email: result[0].email,
                                        isVerified: result[0].is_verified
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

    keeplogin: (req, res) => { 
        try {
            const idQuery = req.user.id
            sql = 'SELECT * FROM users WHERE id = ?'
            db.query(sql, idQuery, (err, result) => {
                try {;
                    if(err) throw err
                    return res.status(200).send({
                        myTkn: req.headers.authorization,
                        id: result[0].id,
                        username: result[0].username,
                        email: result[0].email,
                        isVerified: result[0].is_verified
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

    resend: (req, res) => {

        let id = req.dataToken.id 

        db.query('SELECT * FROM users WHERE id = ?', id, (err, result) => {
            try {
                if(err) throw err

                if(result.length === 1){
                    let email = result[0].email
                    let username = result[0].username

                    jwt.sign({id: id}, '123abc', (err, token) => {
                        try {
                            if(err) throw err
        
                            let query3 = 'UPDATE users SET token = ? WHERE id = ?'
                            db.query(query3, [token, id], (err1, result1) => {
                                try {
                                    if(err1) throw err1
        
                                    fs.readFile('G:/Purwadhika/MiniProject/upperture/src/Supports/Assets/EmailTemplate/EmailTemplateInline.html', {
                                        encoding: 'utf-8'}, (err, file) => {
                                            if(err) throw err 
        
                                            const newTemplate = handlebars.compile(file)
                                            const newTemplateResult = newTemplate({username: username, link:`http://localhost:3000/confirmation/${token}`})
        
                                            transporter.sendMail({
                                                from: 'Upperture', // Sender Address 
                                                to: email, // Email User
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
                    res.status(200).send({
                        error: true, 
                        message: 'Account not found'
                    })
                }
            } catch (error) {
                console.log(error)                
            }
        })
    },

    getUserDetail: async(req, res) => {
        try {
            let data = req.body
            let query1 = 'SELECT id FROM users WHERE username = ?'
            const id = await query(query1, data.username)
            console.log(id[0].id)
            let query2 = 'SELECT * FROM user_detail WHERE users_id = ?'
            const userDetail = await query(query2, id[0].id)
            console.log(userDetail)
            if(userDetail.length == 0){
                res.status(201).send({
                    status: 201,
                    error: false,
                    message: 'User detail is still empty'
                })
            } else {
                res.status(201).send({
                    status: 201,
                    error: false,
                    message: 'Get user detail success!',
                    fullname: userDetail[0].fullname,
                    bio: userDetail[0].bio,
                    profilePic: userDetail[0].image
                })
            }
        } catch (error) {
            res.status(500).send({
                error: true, 
                message: error.message
            })
        }
    },

    editUserDetail: async (req, res) => {
        try {
                let data = req.body
                let query1 = 'UPDATE users SET username = ? WHERE id = ?;'
                let query2 = 'UPDATE user_detail SET fullname = ?, bio = ? WHERE users_id = ?;'
                await db.query(query1, [data.username, data.users_id])
                await db.query(query2, [data.fullname, data.bio, data.users_id])
                let query3 = 'SELECT * FROM users JOIN user_detail ON (users.id = user_detail.users_id) WHERE users.id = ?'
                db.query(query3, data.users_id, (err1, res1) => {
                    try {
                        res.status(200).send({
                            error: false, 
                            message: 'Profile details updated!',
                            username: res1[0].username,
                            fullname: res1[0].fullname,
                            bio: res1[0].bio         
                        })
                    } catch {
                        res.status(500).send({
                            error: true, 
                            message: err1.message,
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

    editProfilePic: async(req, res) => {
        try {
            let data = req.body
            let finalImageURL = req.protocol + "://" + req.get("host") + "/uploads/" + req.file.filename
            let query1 = 'SELECT * FROM user_detail WHERE users_id = ?'
            const userDetail = await query(query1, data.users_id)
            if(userDetail.length == 0){
                let query2 = 'INSERT INTO user_detail (image, users_id) VALUES (?, ?)'
                db.query(query2, [finalImageURL, data.users_id], (err, result) => {
                    try {
                        res.status(200).send({
                            error: false, 
                            message: 'Profile picture updated!'
                        })
                    } catch (error) {
                        res.status(500).send({
                            error: true, 
                            message: error.message,
                            image: finalImageURL
                        })
                    }
                })
            } else {
                let query3 = 'UPDATE user_detail SET image = ? WHERE users_id = ?'
                db.query(query3, [finalImageURL, data.users_id], (err, result) => {
                    try {
                        res.status(200).send({
                            error: false, 
                            message: 'Profile picture updated!',
                            image: finalImageURL
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
    },

    sendResetPasswordMail: async(req, res) => {
        try {
            let data = req.body

            let query1 = 'SELECT * FROM users WHERE email = ?'
            const userData = await query(query1, data.email)
            .catch((error) => {
                throw error
            })

            console.log(userData)
            jwt.sign({id: userData[0].id}, '123abc', (err, token) => {
                try {
                    if(err) throw err

                    let query2 = 'UPDATE users SET reset_password_token = ? WHERE id = ?'
                    db.query(query2, [token, userData[0].id], (err1, result1) => {
                        try {
                            if(err1) throw err1

                            fs.readFile('G:/Purwadhika/MiniProject/upperture/src/Supports/Assets/EmailTemplate/EmailResetPassword.html', {
                                encoding: 'utf-8'}, (err, file) => {
                                    if(err) throw err 

                                    const newTemplate = handlebars.compile(file)
                                    const newTemplateResult = newTemplate({username: userData[0].username, link:`http://localhost:3000/resetpassword/${token}`})

                                    transporter.sendMail({
                                        from: 'Upperture', // Sender Address 
                                        to: data.email, // Email User
                                        subject: 'Upperture Reset Password Email',
                                        html: newTemplateResult
                                    })
                                    .then((response) => {
                                        res.status(200).send({
                                            error: false, 
                                            message: 'Email to reset password sent!'
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

    resetPassword: async(req, res) => {
        try {
            let password = req.body.password
            const id = req.dataToken.id 

            const hmac = crypto.createHmac('sha256', 'abc123')
            await hmac.update(password)
            const passwordHashed = await hmac.digest('hex')
            password = passwordHashed
            
            const tokenValid = await query('SELECT * FROM users WHERE reset_password_token = ? AND id = ?', [req.headers.authorization, id])
            if(tokenValid.length === 0){
                res.status(400).send({
                    error: true, 
                    message: 'Token deactivated, check your newest email'
                })
            }else{
                await query('UPDATE users SET reset_password_token = null where id = ?', id)
                await query('UPDATE users SET password = ? WHERE id = ?', [password, id])
                res.status(200).send({
                    error: false, 
                    message: 'Your password has been changed. Please log in with your new password.'
            })
            }
        } catch (error) {
            res.status(500).send({
                    error: true, 
                    message: error.message
            })
        }
    },

    searchUser: async(req, res) => {
        try {
            let entry = req.body.entry
            const query1 = `SELECT username, id FROM users WHERE username LIKE ? ORDER BY id LIMIT 0,10`
            const users = await query(query1, ['%' + entry + '%'])
            
            const query2 = `SELECT image FROM user_detail WHERE users_id = ?`;
            for (let i = 0; i < users.length; i++) {
                let resultImage = await query(query2, users[i].id);
                users[i] = { ...users[i], image: resultImage[0].image };
            }
            
            res.status(200).send({
                error: false, 
                users: users
            })
        } catch (error) {
            res.status(500).send({
                    error: true, 
                    message: error.message
            })
        }
    },

    changePassword: async(req, res) => {
        try {
            const id = req.body.id 
            let newPassword = req.body.newPassword 

            const hmac = crypto.createHmac('sha256', 'abc123')
            await hmac.update(newPassword)
            const passwordHashed = await hmac.digest('hex')
            newPassword = passwordHashed

            await query('UPDATE users SET password = ? WHERE id = ?', [newPassword, id])
            res.status(200).send({
                error: false, 
                message: 'Your password has been changed.'
            })
        } catch (error) {
            res.status(500).send({
                    error: true, 
                    message: error.message
            })
        }
    }
}