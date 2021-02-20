const Datastore = require('nedb');
const mongoose = require('mongoose');
const model = require("./models/models.js");
const config = require("config");
const parse = require("./parser.js")

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
        return new Error(`Error refreshing user ${user._id} : ${error}`);
    }
}

// Identifies user by id and updates the associated user
// i.e user.id = x, user.name = dave --> updates id x to name dave
async function update_user (user) {
    try {
        await model.User.updateOne({_id: user._id}, user, { upsert: true })
        return
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
            try {
                ret_track = await track_model.save();  
            } catch (error) {
                console.log(`Could not save track ${track_alt.name} (${track_alt._id})`)
            }
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

async function update_playlist(pl)
{
    // console.log(pl)
    try {
        await model.Pl.updateOne({_id: pl.id}, pl, { upsert: true })
        return;
    } catch (err) {
        return new Error(`Error updating playlist ${pl.name} (id: ${pl.id}): ${err}`);;
    }
}

async function insert_pl_track(track)
{

    const track_alt = {
        _id: track.track.id,
        name: track.track.name,
        user_id: track.adder.id,
        added_time: parse.time(track.added_at) 
    }

    try{
        let matches = await model.Pl.findOne({"tracks._id": track_alt._id})

        if(!matches)
        {
            await model.Pl.updateOne({_id: track.playlist.id}, {$push: {tracks: track_alt} })
        }
        return
    } catch (err) {
        return new Error(`Error pushing playlist track ${track_alt.name} (id: ${track_alt._id}): ${error}`);;
    }
}

async function insert_pl_user(unique_user)
{
    unique_user = JSON.parse(unique_user);
    try
    {
        let matches = await model.Pl.findOne({ $and: [
                                            {"users._id": unique_user.id},
                                            {"_id": unique_user.pl_id}
                                            ]})
        // let matches = await model.Pl.findOne({ $and: [{"_id": unique_user.pl_id}] });
        if(!matches)
        {
             docs = await model.Pl.updateOne({"_id": unique_user.pl_id}, {$push: {"users": {_id: unique_user.id}} })
        }
        return
    } 
    catch (err) {
        return new Error(`Error pushing playlist user ${track.playlist.name} (id: ${track.playlist.id}): ${err}`);
    }
}

module.exports = {
    refresh_user: refresh_user,
    update_user: update_user,
    insert_tracks: insert_tracks,
    find_users: find_users,
    update_playlist: update_playlist,
    insert_pl_track: insert_pl_track,
    insert_pl_user: insert_pl_user
}