const Validator = require('jsonSchema').Validator
let v = new Validator();

let user_schema = {
    "id": "/SimpleAddress",
    "type": "object",
    "properties": 
    {
        "_id":          {"type": "string"},
        "name":         {"type": "string"},
        "access_tok":   {"type": "string"},
        "refresh_tok":  {"type": "string"},
        "expire_time":  {"type": "number"},
        "pp_url":       {"type": "string"}
    },
    "required": ["_id", "name", "access_tok"]
} 

function validate_user(user_obj)
{
    return v.validate(user_obj, user_schema).valid;
}

module.exports = {
    validate: validate_user
}