const got = require('got');

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
		const context = {
			Authorization: 'Bearer ' + access_token 
		};
		
		const response = await instance('https://api.spotify.com/v1/me/playlists', {context});
		// headers: { 'Authorization': 'Bearer ' + access_token },
		
		playlists = response.body;
		
		// TODO
//		collaborative_playlists = playlists.filter(playlists => playlists.collaborative == true);
		
//		console.log(collaborative_playlists); 
	}
	
	
module.exports.user_in = user_in;
