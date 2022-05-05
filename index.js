const express = require('express')
const cors = require('cors')

const app = express() 
app.use(express.json())
const PORT = 3001

app.use(cors())

// app.use(cors({
//     origin: 'http://localhost:3000'
// }))

const db = require('./Connection/Connection')

// Import Routers
const PostsRouters = require('./Routers/PostsRouters')
app.use('/posts', PostsRouters)

const UserRouters = require('./Routers/UserRouter')
app.use('/user', UserRouters)

// Read with Params
app.get('/get/:idUser', (req, res) => {
    let id = req.params.idUser 
    
    const sqlQuery = 'SELECT * FROM todos AS t JOIN users AS u ON t.users_id = u.id WHERE u.id = ?'

    db.query(sqlQuery, id, (err, result) => {
        try {
            if(err) throw err
            
            if(result.length > 0){
                res.status(201).send({
                    status: 201,
                    error: false, 
                    message: 'Get Data Success!',
                    data: result
                })
            }else{
                res.status(201).send({
                    status: 201,
                    error: true,
                    message: 'Data User with Id = ' + id + ' Not Found!'
                })
            }
        } catch (error) {
            console.log(error)
        }
    })
})
// Read with Query Params
app.get('/getByStatusId', (req, res) => {
    const statusId = req.query.statusId
    
    const sqlQuery = 'SELECT * FROM todos WHERE status = ?'

    db.query(sqlQuery, statusId, (err, result) => {
        try {
            if(err) throw err

            if(result.length > 0){
                res.status(200).send({
                    status: 200, 
                    error: false, 
                    message: 'Filter Data Success!',
                    data: result
                })
            }else{
                res.status(201).send({
                    status: 201,
                    error: true,
                    message: 'Data Todos with Status Id = ' + statusId + ' Not Found!'
                })
            }
        } catch (error) {
            console.log(error)
        }
    })
})

// Update
app.patch('/udpdate/:idTodo', (req, res) => {
    const idTodo = req.params.idTodo 
    const data = req.body

    const sqlQuery = 'SELECT * FROM todos WHERE id = ?'

    db.query(sqlQuery, idTodo, (err, result) => {
        try {
            if(err) throw err 

            if(result.length > 0){
                // Lakukan update data
                const sqlQuery1 = 'UPDATE todos SET ? WHERE id = ?'

                db.query(sqlQuery1, [data, idTodo], (err1, result1) => {
                    try {
                        if(err1) throw err1 

                        res.status(201).send({
                            status: 201,
                            error: false, 
                            message: 'Update Data Success!'
                        })
                    } catch (error) {
                        console.log(error)
                    }
                })
            }else{
                // Response error
                res.status(400).send({
                    status: 400, 
                    error: true, 
                    message: 'Todo with Id = ' + idTodo + ' Not Found!'
                })
            }
        } catch (error) {
            console.log(error)
        }
    })
})

// Delete
app.delete('/delete/:idTodo', (req, res) => {
    const idTodo = req.params.idTodo 
    
    const sqlQuery = 'SELECT * FROM todos WHERE id = ?'

    db.query(sqlQuery, idTodo, (err, result) => {
        try {
            if(err) throw err
            
            if(result.length > 0){
                const sqlQuery1 = 'DELETE FROM todos WHERE id = ?'

                db.query(sqlQuery1, idTodo, (err1, result1) => {
                    try {
                        if(err1) throw err1
                        
                        res.status(201).send({
                            status: 201, 
                            error: false, 
                            message: 'Delete Data Success!'
                        })
                    } catch (error) {
                        console.log(error)
                    }
                })
            }else{
                res.status(400).send({
                    status: 400, 
                    error: true, 
                    message: 'Todo with Id = ' + idTodo + ' Not Found!'
                })
            }
        } catch (error) {
            console.log(error)
        }
    })
})

// Login
//  -> 1. Cek datanya -> SELECT
//  -> 2. Kalo datanya ada, kirim id -> frontend

// Register
//  -> 1. Cek datanya, apakah email/phone number sudah terdaftar belum -> SELECT
//  -> 2. Kalo datanya ada, kirim response error
//  -> 3. Kalo datanya tidak ada, kirim datanya -> INSERT

// Get Post
//  -> 

app.listen(PORT, () => console.log('API Running on PORT ' + PORT) )