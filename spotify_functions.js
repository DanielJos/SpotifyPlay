const got 	= require('got');
const config = require("config");
var request = require('request'); // "Request" library
const dbman = require('./db_man.js');
const _ = require('lodash');
const { response } = require('express');

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
		user.refresh_tok = body.refresh_token;
        user.is_expired = false;
        expires_in = body.expires_in;
        dbman.refresh_user(user, expires_in); }
    });
}

async function get_historic (user)
{
    let context = {
		Authorization: 'Bearer ' + user.access_tok
    };
	// get user play history
	try {
		await get_historic_tracks(context, user);
	} catch (error) {
		console.log(error);
	}
}

async function get_pl (user)
{
	let context = {
		Authorization: 'Bearer ' + user.access_tok
    };

	// Why do I need an await here!!!!!!!!!!!!!!!! :(((
	let collaborative_playlists = await get_playlists(context)
	
	if(collaborative_playlists){
		for(pl of collaborative_playlists){
			err = await dbman.update_playlist(pl);
			if(err) console.log(err);
		}

		// And here!!!!
		let tracks = await get_playlist_tracks(context, collaborative_playlists);
		let unique_users = [];
		let users = [];
		if(tracks)
		{
			for(track of tracks)
			{
				dbman.insert_pl_track(track)
				users.push({id: track.adder.id, pl_id: track.playlist.id})
			}
			
			users_json = users.map((obj)=>JSON.stringify(obj));
			users_json_set = new Set(users_json);
			unique_users = Array.from(users_json_set)
			// console.log(unique_users);
		}
		else console.log("No tracks");
	

		for(user of unique_users)
		{
			dbman.insert_pl_user(user);
		}
	}
 
}

// Local Functions //

async function get_playlists(context)
{
	let collaborative_playlists = [];
	
	try {
		const response = await instance('https://api.spotify.com/v1/me/playlists?limit=50&offset=0', {context}).json();		
		_.map(response.items, (o) => { 
			if (o.collaborative== true) { collaborative_playlists.push({ name : o.name, id : o.id })}
		});
		
		total 	= response.total - 50;
		offset 	= 50;
		
		while (total > 0)
		{
			const response = await instance(`https://api.spotify.com/v1/me/playlists?limit=50&offset=${offset}`, {context}).json();		
			_.map(response.items, (o) => { 
				if (o.collaborative== true) { collaborative_playlists.push({ name : o.name, id : o.id })}
			});
			total 	-= 50;
			offset 	+= 50;
		}
		return collaborative_playlists;

	} catch (error) {
		console.log("Failed to get playlist data.");
		console.log(error);
		return;
	}
	
}

async function get_playlist_tracks(context, collaborative_playlists)
{
	tracks = [];
	for (playlist of collaborative_playlists)
	{
		try {
			const response = await instance(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=100`, {context}).json();
			_.map(response.items, (o) => {
				tracks.push({ playlist: {id: playlist.id, name: playlist.name}, track: {id: o.track.id, name: o.track.name}, adder: o.added_by, added_at: o.added_at });
			});	

			total 	= response.total - 100;
			offset 	= 100;

			while (total > 0)
			{
				try {
					const response = await instance(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=100&offset=${offset}`, {context}).json();
					_.map(response.items, (o) => {
						tracks.push({ playlist: {id: playlist.id, name: playlist.name}, track: {id: o.track.id, name: o.track.name}, adder: o.added_by, added_at: o.added_at }); 
						// console.log(o.track.name); 
					});	
					total 	-= 100;
					offset 	+= 100;
				} catch (error) {
					console.log(error);
				}
			}	
		} catch (error) {
			console.log(error);
		}

		
	}
	return tracks;
}

async function get_historic_tracks(context, user)
{
	let tracks = [];
	
	let response;

	if(user.latest_track_cursor_ms)
	{
		try {
			response = await instance(`https://api.spotify.com/v1/me/player/recently-played?limit=50&after=${user.latest_track_cursor_ms}`, {context}).json();
		} catch (error) {
			console.log("Couldnt get last 50 songs")
		}
	}
	else
	{
		try {
			response = await instance(`https://api.spotify.com/v1/me/player/recently-played?limit=50`, {context}).json();
		} catch (error) {
			console.log("Couldnt get last 50 songs")
		}
	}
	
	// if response returns some tracks then add those tracks to the db
	if(response.items.length)
	{
		user.latest_track_cursor_ms = parseInt(response.cursors.after);

		console.log(`${response.items.length} new tracks for\t${user.name} (id: ${user._id}).`);

		_.map(response.items, (o) => {
			// console.log(`${o.track.name} : ${o.played_at}`);
			tracks.push( {name: o.track.name, track_id: o.track.id, played_at: o.played_at} );
		});	
		try {
			errs = await dbman.insert_tracks(user, tracks);
		} catch (error) {
			console.log(errs)
		}
		try {
			dbman.update_user(user);
		} catch (error) {
			console.log(error);
		}
	}
	else
	{
		console.log(`No data to get for\t${user.name} (id: ${user._id}).`);
	}
}

module.exports = {
    refresh:    refresh,
    get_historic: get_historic,
	get_pl: get_pl
}