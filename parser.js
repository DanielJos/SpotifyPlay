function time (time_string)
{
    unix_time = new Date(time_string).getTime()/1000
    return unix_time;
}

module.exports = {
    time: time
}