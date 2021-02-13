const Datastore = require('nedb');
const { listen } = require('./authorization_code/app.js');
const server = require("./authorization_code/app.js");
const spotify = require("./spotify_functions.js");
const dbman = require("./db_man.js");
const path = require("path");

expiration_interval_secs    = 3;
get_data_interval_sec      = 5;

oversee();
server.listen();

let current_unix_time;

function oversee ()
{
    setInterval(check_expiration, expiration_interval_secs*1000 );
    setInterval(get_user_data, get_data_interval_sec*1000 );
}

async function check_expiration ()
{
    // db.loadDatabase ((err) => {if(err){console.log(err)}; return;});
    let current_unix_time = Math.floor(new Date() / 1000);
    let date_object = new Date(current_unix_time * 1000);
	let date_time = date_object.toLocaleString(); 
    // console.log(current_unix_time);

    // Will update the ACCESS TOKEN when the current time is within 1.5x the check REFRESH TIME
    // (worst case being two refresh at 1.5*interval and 0.5 interval. However preferable to loss of access token)
    try {
        users = await dbman.find_users({});
        for (user of users)
        {
            if ( current_unix_time >= user.expire_time  )
            {
                user.is_expired = true;
                console.log(date_time + ": " + user.name + " is expired:(");
                dbman.update_user(user);
            }
            // else if ( user.expire_time <= current_unix_time - 1.5*expiration_interval_secs )
            else if ( current_unix_time >= user.expire_time - 1.5*expiration_interval_secs  )
            {
                console.log(date_time + ": " + user.name + " refreshed!");
                spotify.refresh(user); 
            }                
        }
            
    } catch (error) {
        console.log(err);
    }
    
    // db.find({ }, (err, docs) => {
    //     if(!err)
    //     {
    //         // console.log(current_unix_time);
    //         for (user of docs)
    //         {
    //             if ( current_unix_time >= user.expire_time  )
    //             {
    //                 user.is_expired = true;
    //                 console.log(user.expire_time+ " : " + date_time + ": " + user.name + " is expired:(");
    //                 userman.update_user(user);
    //             }
    //             // else if ( user.expire_time <= current_unix_time - 1.5*expiration_interval_secs )
    //             else if ( current_unix_time >= user.expire_time - 1.5*expiration_interval_secs  )
    //             {
    //                 console.log(date_time + ": " + user.name + " refreshed!");
    //                 spotify.refresh(user); 
    //             }                
    //         }
    //     }
    //     else
    //     {
    //         console.log("err");
    //     }

    // });
}

async function get_user_data()
{
    // let current_unix_time = Math.floor(new Date() / 1000);
    try {
        const users = await dbman.find_users({"is_expired":false});
        for (user of users)
            {
                spotify.get(user);
            }
    } catch (error) {
        console.log(error);
    }
}