/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

const debug = require("debug")("sp:debug");    // debugging  "export DEBUG=testserver:debug"
const { networkInterfaces } = require("os");
const nets = networkInterfaces();
// const d_g = require("../dank_gammon/app.js"); 
// const dbms = require("../dank_gammon/dbms.js");
const userman = require("../db/user_man.js");
const config = require("config");

// Get network deets
const results = Object.create(null); // blank object to hold the os networkInterfaces object results

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
            if (!results[name]) {
                results[name] = [];
            }
            results[name].push(net.address);
        }
    }
}

// const ip_address = results.en0      || results.enp1s0 || results.wlp3s0 || '192.168.0.33';
const ip_address = results.en0      || results.enp1s0 || results.wlp3s0 || 'localhost';

const port       = process.env.PORT || 8888;

var client_id = config.get("cli-id"); // Your client id
var client_secret = config.get("cli-secret"); // Your secret
var redirect_uri = `http://${ip_address}:8888/callback/`; // Your redirect uri
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-playback-state user-read-recently-played playlist-read-collaborative playlist-modify-public playlist-read-private user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        let my_user = {};

        my_user.access_tok  = body.access_token;
        my_user.refresh_tok = body.refresh_token;
        expires_in          = body.expires_in;

        let options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + my_user.access_tok },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          // console.log(body);
          let user = {'id' 	: body.id,
          	'pp_url' 	: body.images.url,
          	'disp_name' 	: body.display_name,
          	'email' 	: body.email
          }         

          my_user._id     = body.id;
          my_user.name    = body.display_name;
          my_user.pp_url  = body.images[0].url;

          userman.update_token(my_user, expires_in);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect(`http://${ip_address}:8888/#` +
          querystring.stringify({
            access_token: my_user.access_tok,
            refresh_token:my_user.refresh_tok
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

function listen ()
{
  // http listener created on ${ip_address}:${port}
  app.listen(port, ip_address, ()=>{
      debug(`Listening on: ${ip_address}:${port}`)
      });
}

  module.exports = {
    listen: listen
  }
