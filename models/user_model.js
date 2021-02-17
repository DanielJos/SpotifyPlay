const mongoose = require('mongoose');

const user_schema =  new mongoose.Schema({
    _id:                      {type: String, required: true},
    name:                     {type: String },
    access_tok:               {type: String },
    refresh_tok:              {type: String },
    expire_time:              {type: Number },
    is_expired:               {type: Boolean},
    latest_track_cursor_ms:   {type: Number },
    pp_url:                   {type: String }  
}, {timestamps: true});

const User = mongoose.model("user", user_schema);

module.exports = {
    User: User
}
