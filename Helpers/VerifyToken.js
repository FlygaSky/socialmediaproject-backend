const jwt = require("jsonwebtoken")

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization
  try {
    let decode = jwt.verify(token, '123abc')
    req.user = decode
    next()
  } catch (error) {
    return res.status(401).send({ message: "User unauthorized" })
  }
};


module.exports = { verifyToken }