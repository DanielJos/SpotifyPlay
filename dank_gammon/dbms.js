const got 	= require('got');
const _ 	= require('lodash');
const Datastore = require('nedb');


options = {
	filename : '..rm/db/playlist_collection',
	timestampData : true
}
db = new Datastore(options);

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

async function user_in (access_token, user)
{
	db.loadDatabase ((err) => {console.log(err); return;})
	
	const context = {
		Authorization: 'Bearer ' + access_token 
	};
	let collaborative_playlists = [];
	
	const response = await instance('https://api.spotify.com/v1/me/playlists?limit=50&offset=0', {context}).json();		
	_.map(response.items, (o) => { 
		if (o.collaborative== true) { collaborative_playlists.push({ name : o.name, id : o.id })}
		return
	});
	
	total = response.total - 50;
	offset = 50;
	
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
	
	console.log(`Getting data for ${user.disp_name} (id: ${user.id})...`);
	let songs = await get_playlist_songs(context, collaborative_playlists);
	let top_tracks = await get_top_tracks(context);
	await get_recent_tracks(context);
}
	
async function get_playlist_songs(context, collaborative_playlists)
{
	songs = [];
	for (playlist of collaborative_playlists)
	{
		const response = await instance(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {context}).json();	
		_.map(response.items, (o) => {
			songs.push({ playlist : playlist.name, track_id : o.track.id, adder : o.added_by, time : o.added_at }); 
			// just get track id
		});	
	}
	return songs;
}

async function get_top_tracks(context)
{
	long_term_top_tracks 	= [];
	medium_term_top_tracks 	= [];
	short_term_top_tracks 	= [];	

// long term
	
	let response = await instance(`https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50`, {context}).json();	
		_.map(response.items, (o) => {
			long_term_top_tracks.push(o.id); 
		});
	
	total 	= response.total - 50;
	offset 	= 50;
	
	while (total > 0)
	{
		response = await instance(`https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50&offset=${offset}`, {context}).json();	
		_.map(response.items, (o) => {
			long_term_top_tracks.push(o.id); 
		});
		total 	-= 50;
		offset 	+= 50;
	}
// mid term

	response = await instance(`https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50`, {context}).json();	
		_.map(response.items, (o) => {
			medium_term_top_tracks.push(o.id); 
		});
	
	total 	= response.total - 50;
	offset 	= 50;
	
	while (total > 0)
	{
		response = await instance(`https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50&offset=${offset}`, {context}).json();	
		_.map(response.items, (o) => {
			medium_term_top_tracks.push(o.id); 
		});
		total 	-= 50;
		offset 	+= 50;
	}
	
// short term

	response = await instance(`https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50`, {context}).json();	
		_.map(response.items, (o) => {
			short_term_top_tracks.push(o.id); 
		});	
	
	total 	= response.total - 50;
	offset 	= 50;
	
	while (total > 0)
	{
		response = await instance(`https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50&offset=${offset}`, {context}).json();	
		_.map(response.items, (o) => {
			short_term_top_tracks.push(o.id); 
		});
		total 	-= 50;
		offset 	+= 50;
	}
	
	return { long_term_track_ids : long_term_top_tracks, medium_term_track_ids : medium_term_top_tracks, short_term_track_ids : short_term_top_tracks };
}
	
	
module.exports.user_in = user_in;
