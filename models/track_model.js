const mongoose = require('mongoose');

const track_schema =  new mongoose.Schema({
    _id:                      {type: String, required: true},
    name:                     {type: String },
    track_id:                 {type: String },
    played_at:                {type: String },
    user:                     {
        name:   {type: String},
        id:     {type: String}   
    } 
}, {timestamps: true});

const Track = mongoose.model("track", track_schema);

module.exports = {
    Track: Track 
}
