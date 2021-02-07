const got 	= require('got');
const config = require("config");
var request = require('request'); // "Request" library
const userman = require('./db/user_man.js');
const _ = require('lodash');

let scope = 'user-read-private user-read-email user-read-playback-state user-read-recently-played playlist-read-collaborative playlist-modify-public playlist-read-private user-top-read';
let client_id = config.get("cli-id"); // Your client id
let client_secret = config.get("cli-secret"); // Your secret

// Module Exports //

function refresh (user)
{
    let expires_in;

    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
        form: {
          grant_type: 'refresh_token',
          refresh_token: user.refresh_tok
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
        // console.log(body);
        user.access_tok = body.access_token;
        expires_in = body.expires_in;
        userman.update_token(user, expires_in);
        console.log("Refreshed!");
    }
    });
}

async function get (user)
{
    const context = {
		Authorization: 'Bearer ' + user.access_tok
    };
    console.log(`Getting data for ${user.disp_name} (id: ${user.id}) at ${date_time}...`);
    let collaborative_playlists = await get_playlists(context);
}


// Local Functions //

async function get_playlists(context)
{
	let collaborative_playlists = [];
	
	const response = await instance('https://api.spotify.com/v1/me/playlists?limit=50&offset=0', {context}).json();		
	_.map(response.items, (o) => { 
		if (o.collaborative== true) { collaborative_playlists.push({ name : o.name, id : o.id })}
		return
	});
	
	total 	= response.total - 50;
	offset 	= 50;
	
	while (total > 0)
	{
		const response = await instance(`https://api.spotify.com/v1/me/playlists?limit=50&offset=${offset}`, {context}).json();		
		_.map(response.items, (o) => { 
			if (o.collaborative== true) { collaborative_playlists.push({ name : o.name, id : o.id })}
			return
		});
		total 	-= 50;
		offset 	+= 50;
	}
	console.log(collaborative_playlists);
	return collaborative_playlists;
}

module.exports = {
    refresh: refresh,
    get: get 
}