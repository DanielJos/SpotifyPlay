const Datastore = require('nedb');
const val = require("./validation.js")

// Create collection
upd_opts = {
	upsert: true,
}

options = {
	filename : '../db/user_collection',
	timestampData : true
}

db = new Datastore(options);

// db.ensureIndex(index_opts, (err)=>{});
db.persistence.setAutocompactionInterval(30*1000);

db.loadDatabase ((err) => {console.log(err); return;});

function update_token (user, expire_time)
{
    let unix_time = Math.floor(new Date() / 1000);
    user.expire_time = unix_time + expire_time;

    // console.log(user);

    if(val.validate(user))
    {
        db.update({ _id: user._id }, user, { upsert: true }, (err, numReplaced) => {
                if(err){
                    console.log(err);
                    return false;
                }
                console.log
                return true;
            } );
    }
}

module.exports = {
	update_token: update_token
}