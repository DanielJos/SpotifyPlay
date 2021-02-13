const Datastore = require('nedb');
const { listen } = require('./authorization_code/app.js');
const serv = require("./authorization_code/app.js");
const spotify = require("./spotify_functions.js");
const userman = require("./db/user_man.js");
const path = require("path");

// console.log(path.resolve(__dirname))
options = {
	filename : path.resolve(__dirname, "/db/user_collection"),
    timestampData : true,
    // autoload: true
}

db = new Datastore(options);

db.loadDatabase ((err) => {if(err){console.log(err)}; return;});


expiration_interval_secs    = 4;
playlist_interval_secs      = 5;

oversee();
serv.listen();

let current_unix_time;

function oversee ()
{
    setInterval(check_expiration, expiration_interval_secs*1000 );
    setInterval(get_user_data, playlist_interval_secs*1000 );
    
}

function check_expiration ()
{
    db.loadDatabase ((err) => {if(err){console.log(err)}; return;});
    current_unix_time = Math.floor(new Date() / 1000); 
    console.log(current_unix_time);

    // Will update the ACCESS TOKEN when the current time is within 1.5x the check REFRESH TIME
    // (worst case being two refresh at 1.5*interval and 0.5 interval. However preferable to loss of access token)
    db.find({ }, (err, docs) => {
        if(!err)
        {
            console.log(docs);
            for (user of docs)
            {
                if ( current_unix_time >= user.expire_time  )
                {
                    user.is_expired = true;
                    console.log(user.name + " is expired:(");
                    userman.update_user(user);
                }
                // else if ( user.expire_time <= current_unix_time - 1.5*expiration_interval_secs )
                else if ( current_unix_time >= user.expire_time - 1.5*expiration_interval_secs  )
                {
                    console.log(user.name + " refreshed!");
                    spotify.refresh(user); 
                }                
            }
        }
        else
        {
            console.log("err");
        }

    });
}

function get_user_data()
{
    current_unix_time = Math.floor(new Date() / 1000);
    db.find({ is_expired: false }, (err, docs) => {
        if(!err)
        {
            for (user of docs)
            {
                console.log(user.expire_time + "\n");
                spotify.get(user);
            }
        }
        else
        {
            console.log("err");
        }

    });
}