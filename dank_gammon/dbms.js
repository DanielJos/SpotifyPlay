const got 	= require('got');
const _ 	= require('lodash');
const Datastore = require('nedb');

options = {
	filename: '../db/playlist_collection',
	timestampData: true
}


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
	

