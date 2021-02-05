const Datastore = require('nedb');

// Create collection
options = {
	filename : '../db/user_collection',
	timestampData : true
}

db = new Datastore(options);

// Create index settings
index_opts = {
	fieldName: 'tracks.id',
	unique: 'true',
}

pl_db.ensureIndex(index_opts, (err)=>{});