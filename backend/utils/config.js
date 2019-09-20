require('dotenv').config()

let PORT = process.env.PORT
let DB_URI = process.env.MONGODB_URI

if(process.env.NODE_ENV === 'test'){
    DB_URI = process.env.TEST_MONGODB_URI
}



module.exports =  {PORT, DB_URI}