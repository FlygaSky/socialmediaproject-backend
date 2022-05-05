// Import Connection
const db = require('./../Connection/Connection')

const create = (req, res) => {
    try {
        // Step1.1. Menerima req.body dari frontend
        const data = req.body 
        const id = req.dataToken.id 
        data.users_id = id

        // Step1.2 Validasi data
        if(!data.todo || !data.description || !data.users_id) throw {
            status: 400,
            error: true, 
            message: 'Data Not Completed!'
        }

        // Step2.1. Define query insert
        const sqlQuery1 = 'INSERT INTO todos SET ?'
        // Step2.3. Define query get
        const sqlQuery2 = 'SELECT * FROM todos'

        // Step3. Jalankan query insert
        db.query(sqlQuery1, data, (err, result) => {
            try {
                if(err) throw err

                const sqlQueryEvent = `
                    CREATE EVENT Update_Status_Data_${result.insertId}
                    ON SCHEDULE AT '${data.deadline}' 
                    DO UPDATE todos SET status_id = 2
                    WHERE id = ${result.insertId}
                `
                
                db.query(sqlQueryEvent, (errEvent, resultEvent) => {
                    try {
                        if(errEvent) throw errEvent 

                        db.query(sqlQuery2, (err1, result1) => {
                            try {
                                if(err1) throw err1
            
                                res.status(201).send({
                                    status: 201, 
                                    error: false,
                                    message: 'Post Data Success!',
                                    data: result1
                                })
                            } catch (error) {
                                console.log(error)
                            }
                        })
                    } catch (error) {
                        console.log(error)
                    }
                })
            } catch (error) {
                console.log(error)
            }
        })
    } catch (error) {
        res.status(error.status).send({
            status: error.status,
            error: true,
            message: error.message
        })
    }
}

const getAllData = (req, res) => {
    try {
        let id = req.dataToken.id

        const sqlQuery = 'SELECT * FROM todos WHERE users_id = ?'

        db.query(sqlQuery, id, (err, result) => {
            try {
                if(err) throw err 

                res.status(200).send({
                    status: 200,
                    error: false, 
                    message: 'Get Data Success!',
                    data: result
                })
            } catch (error) {
                console.log(error)
            }
        })
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    create,
    getAllData
}