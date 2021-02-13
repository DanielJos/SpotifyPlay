const Datastore = require('nedb');
const val = require("./validation.js")
const path = require("path");

// Create collection
upd_opts = {
	upsert: true,
}

// index_opts = {
//     fieldName = ""
// }

options = {
	filename : path.resolve(__dirname, "db/user_collection"),
	timestampData : true
}

user_db = new Datastore(options);

options = {
	filename : path.resolve(__dirname, "db/track_collection"),
	timestampData : true
}

track_db = new Datastore(options);

// user_db.ensureIndex(index_opts, (err)=>{});
user_db.persistence.setAutocompactionInterval(30*1000);
track_db.persistence.setAutocompactionInterval(30*1000);

user_db.loadDatabase ((err) => {console.log(err); return;});
track_db.loadDatabase();

// take the USER ID and update the user entry with the given ACCESS TOKEN
function refresh_user (user, expires_in)
{
    console.log("updating " + user.name);
    let unix_time = Math.floor(new Date() / 1000);
    // user.expire_time = unix_time + 5;
    user.expire_time = unix_time + expires_in;
    user.is_expired = false;

    if(val.validate(user))
    {
        user_db.update({ _id: user._id }, user, { upsert: true }, (err, numReplaced) => {
                if(err){
                    console.log(err);
                    return false;
                }
                console.log
                return true;
            } );
    }
    else
    {
        console.log("Invalid user");
    }
}

// Identifies user by id and updates the associated user
// i.e user.id = x, user.name = dave --> updates id x to name dave
function update_user (user) {
    if(val.validate(user))
    {
        user_db.update({ _id: user._id }, user, { upsert: true }, (err, numReplaced) => {
                if(err){
                    console.log(err);
                    return false;
                }
                return true;
            } );
    }
    else
    {
        console.log("Invalid user");
    }
}

function insert_tracks (user, tracks)
{
    let track_alt;
    for(track of tracks)
    {
        track_alt = track;
        track_alt._id = track.played_at + user.id;
        track_alt.user = {id: user.id, name: user.name };
        // track_alt.user.id = user._id;
        // track_alt.user.name = user.name

        track_db.insert(track_alt, (err)=>{
            if(err) console.log(err);
        });
    }
    

}

module.exports = {
    refresh_user: refresh_user,
    update_user: update_user,
    insert_tracks: insert_tracks
}