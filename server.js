const express = require('express')
const { readdirSync } = require('fs')
const app = express()
const cookieParser = require('cookie-parser')
const { configDotenv } = require('dotenv').config()
const cors = require('cors')
const body = require('body-parser')
const path = require('path')

const port = process.env.SERVER_PORT || 9000
app.use(express.json())

app.use(cors({
  origin: (origin, callback) => {
    callback(null, origin || true);
  },
  credentials: true
}));

app.use(body.json({ limit: '10mb' }))
app.use(body.urlencoded({ extended: true }))

app.use(express.static("upload"));
app.use('/upload', express.static(path.join(__dirname, 'upload')));


readdirSync('./app/routes').map((route) =>

    app.use('/api', require('./app/routes/' + route))
)


app.listen(port, () => console.log(`listening to port:${port} `))


