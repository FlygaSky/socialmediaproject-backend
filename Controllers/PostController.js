const db = require('./../Connection/Connection')
const util = require('util')
const query = util.promisify(db.query).bind(db)
const path = require("path");



module.exports = {
    upload: (req, res) => {
        try {
            const data = req.body
            let finalImageURL = req.protocol + "://" + req.get("host") + "/uploads/" + req.file.filename

            const sqlQuery = 'INSERT INTO posts (image, caption, users_id) VALUES (?, ?, ?);'
            db.query(sqlQuery, [finalImageURL, data.caption, data.users_id], (err, result) => {
                try {
                    if (err) throw err
                    res.status(200).send({
                        error: false,
                        message:'Success!'
                    })
                } catch (error) {
                    res.status(error.status).send({
                        status: error.status,
                        error: true,
                        message: error.message
                    })
                }
            })
        } catch (error) {
            res.status(error.status).send({
                status: error.status,
                error: true,
                message: error.message
            })
        }
    },

    getAllData: (req, res) => {
        try {
            let id = req.dataToken.id

            const sqlQuery = 'SELECT * FROM todos WHERE users_id = ?'

            db.query(sqlQuery, id, (err, result) => {
                try {
                    if (err) throw err

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
}