const Datastore = require('nedb');
const { listen } = require('./authorization_code/app.js');
const serv = require("./authorization_code/app.js")
const spotify = require("./spotify_functions.js")

options = {
	filename : './db/user_collection',
    timestampData : true,
    autoload: true
}

db = new Datastore(options);

update_interval_secs = 4

oversee();
serv.listen();

function oversee ()
{
    setInterval(check_expiration, update_interval_secs*1000 );
}

function check_expiration ()
{
    db.loadDatabase ((err) => {if(err){console.log(err)}; return;});
    let current_unix_time = Math.floor(new Date() / 1000); 

    // Will update the ACCESS TOKEN when the current time is within 1.5x the check REFRESH TIME
    // (worst case being two refresh at 1.5*interval and 0.5 interval. However preferable to loss of access token)
    db.find({ expire_time: { $lte: current_unix_time - 1.5*update_interval_secs} }, (err, docs) => {
        if(!err)
        {
            for (user of docs)
            {
                console.log(user.expire_time + "\n");
                spotify.refresh(user);
            }
        }
        else
        {
            console.log("err");
        }

    });
}