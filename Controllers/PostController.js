const db = require('./../Connection/Connection')
const util = require('util')
const query = util.promisify(db.query).bind(db)
const path = require("path");



module.exports = {
    upload: (req, res) => {
        try {
            const data = req.body
            let finalImageURL = req.protocol + "://" + req.get("host") + "/uploads/" + req.file.filename

            const sqlQuery = 'INSERT INTO posts (image, caption, unique_id, users_id) VALUES (?, ?, ?, ?);'
            db.query(sqlQuery, [finalImageURL, data.caption, data.unique_id, data.users_id], (err, result) => {
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

    getAllPosts: async(req, res) => {
        try {
            const page = parseInt(req.query.page)
            const limit = parseInt(req.query.limit)
            const data = req.body
            const ownId = data.ownId
            const startIndex = (page - 1) * limit
            const endIndex = page * limit

            let query1 = `SELECT posts.*, users.username, user_detail.image as profilePic
            FROM posts
            JOIN users 
            ON posts.users_id = users.id 
            JOIN user_detail
            ON posts.users_id = user_detail.users_id
            ORDER BY posts.id DESC
            LIMIT ${startIndex},${limit};`

            const posts = await query(query1)
            
            let query2 = `SELECT COUNT(*) users_id FROM likes WHERE posts_id = ?`;
            for (let i = 0; i < posts.length; i++) {
                let post = posts[i];
                let resultLikes = await query(query2, post.id);
                posts[i] = { ...posts[i], likes: resultLikes[0].users_id };
            }

            let query3 = `SELECT COUNT(*) users_id FROM likes WHERE users_id = ? AND posts_id = ?`;
            for (let i = 0; i < posts.length; i++) {
                let post = posts[i];
                let resultIsLiked = await query(query3, [ownId, post.id]);
                posts[i] = { ...posts[i], isLiked: resultIsLiked[0].users_id };
            }
            
            res.status(200).send(posts)
        } catch (error) {
            res.status(400).send({
                status: 400,
                error: true,
                message: error.message
            })
        }
    },

    getOwnPosts: async(req, res) => {
        try {
            const page = parseInt(req.query.page)
            const limit = parseInt(req.query.limit)
            const username = req.body.username
            const startIndex = (page - 1) * limit
            const likedPosts = []
            
            const query0 = 'SELECT id FROM users WHERE username = ?'
            const query0Result = await query(query0, [username])

            const query1 = `SELECT * FROM posts
                            WHERE users_id = ?
                            ORDER BY id DESC
                            LIMIT ${startIndex},${limit};`
            const posts = await query(query1, [query0Result[0].id])
            
            const query2 = `SELECT COUNT(*) users_id FROM likes WHERE posts_id = ?`;
            for (let i = 0; i < posts.length; i++) {
                let resultLikes = await query(query2, posts[i].id);
                posts[i] = { ...posts[i], likes: resultLikes[0].users_id };
            }

            let query3 = `SELECT COUNT(*) id FROM comments WHERE posts_id = ?`;
            for (let i = 0; i < posts.length; i++) {
                let resultCommentsCount = await query(query3, [posts[i].id]);
                posts[i] = { ...posts[i], comments: resultCommentsCount[0].id };
            }
            
            res.status(200).send(posts)
        } catch (error) {
            res.status(400).send({
                status: 400,
                error: true,
                message: error.message
            })
        }
    },

    getLikedPosts: async(req, res) => {
        try {
            const page = parseInt(req.query.page)
            const limit = parseInt(req.query.limit)
            const ownId = req.body.ownId
            const startIndex = (page - 1) * limit
            const likedPosts = []
            let query0 = `SELECT posts_id FROM likes WHERE users_id = ?
                          ORDER BY posts_id DESC
                          LIMIT ${startIndex},${limit};`
            const query0Result = await query(query0, [ownId])
            
            let query1 = `SELECT * FROM posts WHERE id = ?;`
            for (let i = 0; i < query0Result.length; i++) {
                const query1Result = await query(query1, [query0Result[i].posts_id])
                likedPosts.push(query1Result[0])
            }
            
            let query2 = `SELECT COUNT(*) users_id FROM likes WHERE posts_id = ?`;
            for (let i = 0; i < likedPosts.length; i++) {
                let resultLikes = await query(query2, likedPosts[i].id);
                likedPosts[i] = { ...likedPosts[i], likes: resultLikes[0].users_id };
            }
       
            let query3 = `SELECT COUNT(*) users_id FROM likes WHERE users_id = ? AND posts_id = ?`;
            for (let i = 0; i < likedPosts.length; i++) {
                let resultIsLiked = await query(query3, [ownId, likedPosts[i].id]);
                likedPosts[i] = { ...likedPosts[i], isLiked: resultIsLiked[0].users_id };
            }

            let query4 = `SELECT username FROM users WHERE id = ?`;
            for (let i = 0; i < likedPosts.length; i++) {
                let resultLikes = await query(query4, likedPosts[i].users_id);
                likedPosts[i] = { ...likedPosts[i], username: resultLikes[0].username };
            }
       
            let query5 = `SELECT image FROM user_detail WHERE users_id = ?`;
            for (let i = 0; i < likedPosts.length; i++) {
                let resultIsLiked = await query(query5, [ownId, likedPosts[i].users_id]);
                likedPosts[i] = { ...likedPosts[i], profilePic: resultIsLiked[0].image };
            }
            
            res.status(200).send(likedPosts)
        } catch (error) {
            res.status(400).send({
                status: 400,
                error: true,
                message: error.message
            })
        }
    },

    addLike: (req, res) => {
        try {
            const data = req.body
            const sqlQuery = 'INSERT INTO likes (users_id, posts_id) VALUES (?, ?);'
            db.query(sqlQuery, [data.users_id, data.posts_id], (err, result) => {
                try {
                    if (err) throw err
                    res.status(200).send({
                        error: false,
                        message:'Success!'
                    })
                } catch (error) {
                    console.log(error)
                    res.status(400).send({
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

    deleteLike: (req, res) => {
        try {
            const data = req.body
            const sqlQuery = 'DELETE FROM likes WHERE users_id = ? AND posts_id = ?;'
            db.query(sqlQuery, [data.users_id, data.posts_id], (err, result) => {
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
    
    getPost: async(req, res) => {
        try {
            let uniqueId = req.body.uniqueId
            let ownId = req.body.ownId

            let query1 = `SELECT posts.*, users.username, user_detail.image as profilePic
            FROM posts
            JOIN users 
            ON posts.users_id = users.id 
            JOIN user_detail
            ON posts.users_id = user_detail.users_id
            WHERE posts.unique_id = ?`;
            const query1Result = await query(query1, [uniqueId])

            const query2 = `SELECT COUNT(*) users_id FROM likes WHERE posts_id = ?;`
            const numOfLikes = await query(query2, [query1Result[0].id])
            
            const query3 = `SELECT COUNT(*) users_id FROM likes WHERE users_id = ? AND posts_id = ?;`
            const isLiked = await query(query3, [ownId, query1Result[0].id])

            let query4 = `SELECT comments.*, users.username, user_detail.image as profilePic
            FROM comments
            JOIN users 
            ON comments.users_id = users.id 
            JOIN user_detail
            ON comments.users_id = user_detail.users_id
            WHERE comments.posts_id = ?
            ORDER BY comments.id
            LIMIT 0,5;`;
            const query4Result = await query(query4, [query1Result[0].id])

            const query5 = `SELECT COUNT(*) users_id FROM comments WHERE posts_id = ?;`
            const query5Result = await query(query5, [query1Result[0].id])

            const finalResult = { ...query1Result[0], likes: numOfLikes[0].users_id, isLiked: isLiked[0].users_id, comments: query4Result, totalComments: query5Result[0].users_id }

            res.status(200).send(finalResult)
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message
            })
        }  
    },

    getComments: async(req, res) => {
        try {
            const page = parseInt(req.query.page)
            const limit = parseInt(req.query.limit)
            const startIndex = (page - 1) * limit
            let post_id = req.body.post_id

            let query1 = `SELECT comments.*, users.username, user_detail.image as profilePic
            FROM comments
            JOIN users 
            ON comments.users_id = users.id 
            JOIN user_detail
            ON comments.users_id = user_detail.users_id
            WHERE comments.posts_id = ?
            ORDER BY comments.id
            LIMIT ${startIndex},${limit};`;
            const query1Result = await query(query1, [post_id])

            res.status(200).send(query1Result)
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message
            })
        }  
    },

    postComment: async(req, res) => {
        try {
            let comment = req.body.comment
            let user_id = req.body.user_id
            let post_id = req.body.post_id
            
            let query1 = 'INSERT INTO comments (comment, users_id, posts_id) VALUES (?, ?, ?);'
            const query1Result = await query(query1, [comment, user_id, post_id])

            let query2 = `SELECT @@IDENTITY AS 'Identity'`
            const query2Result = await query(query2)

            let query3 = `SELECT comments.*, users.username, user_detail.image as profilePic
            FROM comments
            JOIN users 
            ON comments.users_id = users.id 
            JOIN user_detail
            ON comments.users_id = user_detail.users_id
            WHERE comments.id = ?`
            const query3Result = await query(query3, [query2Result[0].Identity])

            console.log('query3Result:', query3Result)
            res.status(200).send({
                error: false,
                message: 'Comment successfully posted!',
                data: query3Result[0]
            })
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message
            })
        }  
    },

    deletePost: async(req, res) => {
        try {
            const unique_id = req.body.unique_id

            const query1 = 'SELECT id FROM posts WHERE unique_id = ?;'
            let query1Result = await query(query1, [unique_id])
            let post_id = query1Result[0].id

            const query2 = 'DELETE FROM comments WHERE posts_id = ?;'
            await query(query2, [post_id])
            
            const query3 = 'DELETE FROM likes WHERE posts_id = ?;'
            await query(query3, [post_id])
           
            const query4 = 'DELETE FROM posts WHERE unique_id = ?;'
            await query(query4, [unique_id])
            
            res.status(200).send({
                error: false,
                message: 'Post deletion success!'
            })
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message
            })
        }  
    },

    editCaption: async(req, res) => {
        try {
            const data = req.body
            console.log(data)

            const query1 = 'UPDATE posts SET caption = ? WHERE id = ?;'
            await query(query1, [data.caption, data.post_id])
            
            res.status(200).send({
                error: false,
                message: 'Edit caption success!'
            })
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message
            })
        }  
    }
}
    
