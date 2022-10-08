const session = require("express-session");
const mySQL = require("mysql");
const bcrypt = require("bcrypt");
const { application } = require("express"); // Yea idk it's just how it works ig /shrug

/**
 * @param {application} app
 */
exports = (app) => {
    app.post("/api/auth", (req, res) => {
        res.sendStatus(504);
    });
}