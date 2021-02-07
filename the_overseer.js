const Datastore = require('nedb');
const { listen } = require('./authorization_code/app.js');
const userman = require('./db/user_man.js');
const serv = require("./authorization_code/app.js")

options = {
	filename : './db/user_collection',
    timestampData : true,
    autoload: true
}

db = new Datastore(options);



update_interval_secs = 2

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
    console.log(current_unix_time);
    db.find({ expire_time: { $lte: current_unix_time - 1.5*update_interval_secs} }, (err, docs) => {
        if(!err)
        {
            // console.log(docs)
            for (doc of docs)
            {
                console.log(doc.expire_time + "\n");
            }
        }
        else
        {
            console.log("err");
        }

    });
}