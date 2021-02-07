const got 	= require('got');
const _ 	= require('lodash');
const Datastore = require('nedb');

options = {
	filename: '../db/playlist_collection',
	timestampData: true
}


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
	

