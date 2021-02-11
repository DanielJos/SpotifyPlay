const got 	= require('got');
const config = require("config");
var request = require('request'); // "Request" library
const userman = require('./db/user_man.js');
const _ = require('lodash');

let scope = 'user-read-private user-read-email user-read-playback-state user-read-recently-played playlist-read-collaborative playlist-modify-public playlist-read-private user-top-read';
let client_id = config.get("cli-id"); // Your client id
let client_secret = config.get("cli-secret"); // Your secret

const instance = got.extend({
	hooks: {
		beforeRequest: [
			options => {
				if (!options.context || !options.context.Authorization) {
					throw new Error('Token required');
				}

				options.headers.Authorization = options.context.Authorization;
			}
		]
	}
});

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
        user.is_expired = false;
        expires_in = body.expires_in;
        userman.update_user(user, expires_in);    }
    });
}

async function get (user)
{
    const context = {
		Authorization: 'Bearer ' + user.access_tok
    };
    console.log(`Getting data for ${user.name} (id: ${user._id})...`);
    // let collaborative_playlists = await get_playlists(context);
	// let playlist_tracks = await get_playlist_tracks(context, collaborative_playlists);
	
	await get_historic_tracks(context, user._id);
    // console.log(playlist_tracks);
    // insert_playlists(playlist_tracks);
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

async function get_playlist_tracks(context, collaborative_playlists)
{
	tracks = [];
	for (playlist of collaborative_playlists)
	{
		const response = await instance(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {context}).json();
		_.map(response.items, (o) => {
			tracks.push({ playlist: {id: playlist.id, name: playlist.name}, track: {id: o.track.id, name: o.track.name}, adder: o.added_by, added_at: o.added_at }); 
		});	
	}
	return tracks;
}

async function get_historic_tracks(context, user_id)
{
	let tracks = [];
	
	current_unix_time = Math.floor(new Date() / 1000); 

	response = await instance(`https://api.spotify.com/v1/me/player/recently-played?limit=50&after=${current_unix_time}`, {context}).json();
	//response = await instance(response.next, {context}).json();
	// console.log(response);
	// if (response) after = response.cursors.before;
	_.map(response.items, (o) => {
		// console.log(`${o.track.name} : ${o.played_at}`);
		tracks.push( {name: o.track.name, track_id: o.track.id, played_at: o.played_at} );
	});	

	userman.insert_tracks(user_id, tracks);
}

module.exports = {
    refresh:    refresh,
    get:        get 
}