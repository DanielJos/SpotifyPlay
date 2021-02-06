const got 	= require('got');
const config = require("config");
var request = require('request'); // "Request" library

let scope = 'user-read-private user-read-email user-read-playback-state user-read-recently-played playlist-read-collaborative playlist-modify-public playlist-read-private user-top-read';
let access_token_g;
let refresh_token_g;
let client_id = config.get("cli-id"); // Your client id
let client_secret = config.get("cli-secret"); // Your secret

async function refresh (refresh_token)
{
    refresh_token_g = refresh_token;
    var authOptions = 
    {
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
        access_token = body.access_token;
        console.log("Refreshed!");
    }
    });
}

module.exports = {
    scope: scope,
    refresh: refresh
}