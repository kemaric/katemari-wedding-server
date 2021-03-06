const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const OktaJwtVerifier = require('@okta/jwt-verifier')
require('dotenv').config();

const oktaJwtVerifier = new OktaJwtVerifier({
  clientId: `${process.env.VUE_APP_OKTA_CLIENT}`,
  issuer: `${process.env.VUE_APP_OKTA_URI_BASE}/oauth2/default`
})

let app = express()
app.use(cors())
app.use(bodyParser.json())

// verify JWT token middleware
const authRequired = () => {
  return (req, res, next) => {
    // require request to have an authorization header
    if (!req.headers.authorization) {
      res.status(403);
      return res.send('Authorization header is required');
    }
    let parts = req.headers.authorization.trim().split(' ')
    let accessToken = parts.pop()
    oktaJwtVerifier.verifyAccessToken(accessToken)
      .then(jwt => {
        req.user = {
          uid: jwt.claims.uid,
          email: jwt.claims.sub
        }
        next()
      })
      .catch(err => {
        res.status(403);
        return res.send(`Not authorized: ${err}`);
      }) // jwt did not verify!
  }
}

// public route that anyone can access
app.get('/hello', (req, res) => {
  console.log("Client request", req.hostname);
  return res.json({
    message: 'Hello world!'
  })
})

// route uses authRequired middleware to secure it
app.get('/secure-data', authRequired(), (req, res) => {
  return res.json({
    secret: 'The answer is always "A"!'
  })
})

module.exports = app