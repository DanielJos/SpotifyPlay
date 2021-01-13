const got 	= require('got');
const _ 	= require('lodash');
const Datastore = require('nedb');


options = {
	filename : './db/collaboration_collection',
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
			total -= 50;
			offset += 50;
		}
		
		console.log(collaborative_playlists);

	}
	
	
module.exports.user_in = user_in;
