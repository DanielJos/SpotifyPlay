const express = require("express");
const debug = require("debug")("cateutility:debug");    // debugging  "export DEBUG=testserver:debug"
const morgan = require("morgan");       // http logging
const helmet = require("helmet");       // header security
const mustache = require("mustache-express");
const { networkInterfaces } = require("os");
const Datastore = require("nedb");

const nets = networkInterfaces();
const app = express();

// dirs
const cru_route = require("./routes/cru_route");

// middleware
// app.use(helmet());

// templating engine
app.engine("html", mustache());
app.set("view engine", "html");
app.set("views", "./views")

// routers
app.use("/", cru_route);

// DB Setup
options = {
  filename: "./db/test_collection",
  timestampData: true
}
db = new Datastore(options);
db.loadDatabase();

// debug(`Config File: ${config.get("name")}`);
debug(`Environment Variables:
      NODE_ENV: ${process.env.NODE_ENV}
      PORT: ${process.env.PORT}`);

const results = Object.create(null); // blank object to hold the os networkInterfaces object results

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
            if (!results[name]) {
                results[name] = [];
            }
            results[name].push(net.address);
        }
    }
}

const ip_address = results.en0      || results.enp1s0;
const port       = process.env.PORT || 3000;
// http listener created on ${ip_address}:${port}
app.listen(port, ip_address , ()=>{    // replace this with ann automatic detection of IP
    debug(`Listening on: ${ip_address}:${port}`)
})
