const got 	= require('got');
const _ 	= require('lodash');
const Datastore = require('nedb');

options = {
	filename: '../db/playlist_collection',
	timestampData: true
}

upd_opts = {
	upsert: true,
}

index_opts = {
	fieldName: 'tracks.id',
	unique: 'true',
}

pl_db = new Datastore(options);

options = {
	filename : path.resolve(__dirname, "../db/user_collection"),
	timestampData : true
}
user_db = new Datastore(options);

pl_db.ensureIndex(index_opts, (err)=>{});
pl_db.persistence.setAutocompactionInterval(30*1000)

pl_db.loadDatabase ((err) => {console.log(err); return;})
user_db.loadDatabase ((err) => {console.log(err); return;})

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

function get (access_token, user)
{	
	const context = {
		Authorization: 'Bearer ' + access_token 
	};
	
	let unix_time = Math.floor(new Date() / 1000);
	let date_object = new Date(unix_time * 1000);
	let date_time = date_object.toLocaleString();
	
	console.log(`Getting data for ${user.disp_name} (id: ${user.id}) at ${date_time}...`);
	playlist_process(context);
	// get_top_tracks(context);
	// get_historic_tracks(context, unix_time);
}

async function playlist_process(context)
{
	let collaborative_playlists = await get_playlists(context);
	console.log("Collab playlists out");
	let playlist_tracks = await get_playlist_tracks(context, collaborative_playlists);
	console.log("playlist songs out");
	
	insert_playlists(playlist_tracks);
	console.log("Saved to DB");
}

function insert_playlists(playlist_songs)
{
	for (let track of playlist_songs)
	{
		let track_object = {id: track.track.id, added_at: track.added_at, added_by: track.adder.id}
		pl_db.update( {_id: track.playlist.id, name: track.playlist.name}, {$push: { tracks: track_object }}, upd_opts, (err, numAffected, affectedDocs, upsert)=>{if(err) console.log("Duplicated Track");} );
		
		/*														
		pl_db.findOne ({}, (err, doc) => {
			let track_object = {id: track.track.id, added_at: track.added_at, added_by: track.adder.id}
			if (!doc)
			{
				pl_db.insert( {_id: track.playlist.id, name: track.playlist.name, tracks: [ track_object ]});
				console.log('New playlist added');
			}
			else
			{
				console.log("adding " + track_object);
				pl_db.update( {_id: track.playlist.id}, {$push: { tracks: track_object }}, {}, ()=>{} );
				
			}
		});
		*/
	}
	console.log("Added to DB");
}

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
	
	let top_tracks = { long_term_track_ids : long_term_top_tracks, medium_term_track_ids : medium_term_top_tracks, short_term_track_ids : short_term_top_tracks };
	console.log("Top tracks out");
}

async function get_historic_tracks(context, current_unix)
{
	let tracks = [];
	
	let items_num 	= 50;
	let after 	= current_unix;
	let response = 1;
	
	//while (response)
	//{
		response = await instance(`https://api.spotify.com/v1/me/player/recently-played?limit=50&after=${current_unix}`, {context}).json();
		//response = await instance(response.next, {context}).json();
		console.log(response);
		// if (response) after = response.cursors.before;
		_.map(response.items, (o) => {
			console.log(`${o.track.name} : ${o.played_at}`);
			//tracks.push( {track_id : o.track.id, played_at : o.played_at} );
		});	
	//}	
}

async function store_user()
	
module.exports = {
	update_token: update_token
}
