const mongoose = require('mongoose');

const track_schema = new mongoose.Schema({
    _id:            {type: String, required: true},
    name:           {type: String, required: true},
    user_id:        {type: String, required: true},
    added_time:     {type: Number, required: true},
});

const user_abrv_schema = new mongoose.Schema({
    _id:            {type: String, required: true},
});

const pl_schema =  new mongoose.Schema({
    _id:            {type: String, required: true},
    name:           {type: String, required: true},
    tracks:         [track_schema],
    users:          [user_abrv_schema]
}, {timestamps: true});

const Pl = mongoose.model("playlist", pl_schema);

module.exports = {
    Pl: Pl
}
