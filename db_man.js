const Datastore = require('nedb');
const mongoose = require('mongoose');
const model = require("./models/models.js");
const config = require("config");


const uri = `mongodb+srv://dank_gammon_heroku:${config.get("mongopw")}@dankgammon-cluster.dhapx.mongodb.net/dankgammon?retryWrites=true&w=majority`

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology:true,
    useFindAndModify: false,
    useCreateIndex: true
}).then(()=>{ console.log("Connected to DB...")})
    .catch(err => console.error("Could not connect to DB...", err));

// take the USER ID and update the user entry with the given ACCESS TOKEN
async function refresh_user (user, expires_in)
{
    console.log(`Updating ${user.name} (id: ${user._id})`);
    let unix_time = Math.floor(new Date() / 1000);
    user.expire_time = unix_time + expires_in;
    user.is_expired = false;
    try {
        users = await model.User.updateOne({_id: user._id}, user, { upsert: true });
        return users;
    } catch (error) {
        return new Error(`Error refreshing user ${user.id} : ${error}`);
    }
}

// Identifies user by id and updates the associated user
// i.e user.id = x, user.name = dave --> updates id x to name dave
async function update_user (user) {
    try {
        const users = await model.User.updateOne({_id: user._id}, user, { upsert: true })
        return users;
    } catch (err) {
        return new Error(`Error updating user ${user.name} (id: ${user.id}): ${error}`);;
    }
}

async function insert_tracks (user, tracks)
{
    return new Promise(async (resolve, reject)=>{
        let track_alt;
        let errs;
        for (track of tracks)
        {
            track_alt = track;
            track_alt._id = track.played_at + user._id;
            track_alt.user = {}
            track_alt.user.id = user._id;
            // track_alt.user.id = user._id;
            track_alt.user.name = user.name;
    
            const track_model = new model.Track(track_alt);
            ret_track = await track_model.save();
            if(!ret_track){
                errs.push(new Error(`Unable to add ${track_alt.name} (id: ${track_alt._id})`));
            }
        }
        resolve(errs);
    });

    

}
// TODO, synchronous? all this file
// Returns PROMISE of ARRAY of USER matching the CRITERIA
async function find_users (criteria)
{
    return new Promise(async (resolve, reject)=>{
        try{
            const users = await model.User.find(criteria)
            resolve(users);
        }
        catch(err)
        {
            reject(err)
        }
    });
}

module.exports = {
    refresh_user: refresh_user,
    update_user: update_user,
    insert_tracks: insert_tracks,
    find_users: find_users
}