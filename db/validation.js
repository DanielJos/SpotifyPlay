const Validator = require('jsonSchema').Validator
let v = new Validator();

let user_schema = {
    "id": "/SimpleAddress",
    "type": "object",
    "properties": {
        "_id": {"type": "string"},
        "name": {"type": "string"},
        "tok": {"type": "string"}
    },
    "required": ["_id", "name", "tok"]
} 

function validate_user(user_obj)
{
    return v.Validate(user_obj, user_schema).valid;
}

module.exports = {
    validate: validate_user
}