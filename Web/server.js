const session = require("express-session");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const express = require("express"); // Yea idk it's just how it works ig /shrug
const path = require("path");

/**
 * 
 * @param {String} str
 * @returns {Boolean} bool
 */
function convertToBool(str)
{
    return (str.toLowerCase() === "true") ? true : false;
}

/**
 * @param {express.Application} app
 */
module.exports = (app) => {
    let dbEnabled = convertToBool(process.env.dbEnabled);
    let hashed    = convertToBool(process.env.hashed);

    // console.log(process.env)

    // Required for auth unless you want to do one manually without a database
    let connection = null;

    //TODO: Make a list of users instead of just using one user
    //      Maybe we can add this in settings.json when that's done??

    let userInfo = {
        permissionLevel: -1, //TODO: When Permission level system is done change this to be something else
        username: process.env.localUsername,
        password: process.env.localPassword
    }

    let fatal = false; // An fatal error happened in the database so we want to shutdown everything
                       // Mostly likely because access was denied or something /shrug idk the errors

    if (dbEnabled)
    {
        userInfo = null; // Not needed if using db since the user will most likely be defined in there
        connection = mysql.createConnection({
            host     : process.env.dbHost,
            user     : process.env.dbUser,
            password : process.env.dbPass,
            database : process.env.dbName
        });
    }

    app.use(session({
        secret: "secret",
        resave: true,
        saveUninitialized: true
    }));
    
    // Too lazy to add fatal detection on this but it should be fine?
    app.use("/css", express.static("Web/CSS"))
    app.use("/img", express.static("Web/Images"))
    app.use("/js", express.static("Web/JS"))

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get("/admin", (req, res) => {
        if (fatal) return res.sendStatus(500);
        if (req.session.LoggedIn) res.sendFile(path.join(__dirname, "Pages", "admin.html"));
        else res.redirect("/login");
    });

    app.get("/login", (req, res) => {
        if (fatal) return res.sendStatus(500);
        if (!req.session.LoggedIn) res.sendFile(path.join(__dirname, "Pages", "login.html"));
        else res.redirect("/admin");
    });

    // This is going to be used later on when we do the admin panel code
    app.get("/api/isAdmin", (req, res) => {
        if (fatal) return res.sendStatus(500);
        if (req.session.LoggedIn) res.send(req.session.isAdmin || false);
        else res.status(403).send("You must be signed in to access this.")
    })

    // Account Creation
    app.post("/api/editUser", (req, res) => {
        if (fatal) return res.sendStatus(500);
        let username  = req.body.username;
        let password  = req.body.password;
        let giveAdmin = req.body.isAdmin || 0;
        let perms     = req.body.perms || 0;

        let isAdmin   = (req.session.LoggedIn && req.session.IsAdmin);
        
        if (!isAdmin || !dbEnabled) res.sendStatus(403);
        else
        {
            //TODO: Make an account with info provided
            connection.query('SELECT * FROM Users WHERE username = ?', [username], (error, results, fields) => {
                // If there is an issue with the query, output the error
                if (error)
                {
                    if (error.fatal) fatal = true;
                    console.error(error);
                    res.status(500).send("Database Error<br>Please try again later.");
                    return;
                }

                // If the account exists
                if (results.length > 0)
                {
                    res.send("An account with that username already exists");
                }
                else
                {
                    let pass = password;

                    if (hashed)
                    {
                        pass = bcrypt.hashSync(password, 10);
                    }

                    connection.query("INSERT INTO Users VALUES (0,?,?,?)", [username, pass, giveAdmin, perms], (error, results, fields) => {
                        // If there is an issue with the query, output the error
                        if (error)
                        {
                            if (error.fatal) fatal = true;
                            console.error(error);
                            res.status(500).send("Database Error<br>Please try again later.");
                            return;
                        }
                        
                        console.log(results);
                        res.send(`Successfully added user: ${username}`);
                    });
                }
            });
        }
    })

    //Account Deletion
    app.delete("/api/editUser", (req, res) => {
        if (fatal) return res.sendStatus(500);
        let username = req.body.username;

        let isAdmin  = (req.session.LoggedIn && req.session.IsAdmin);
        
        if (!isAdmin || !dbEnabled) res.sendStatus(403);
        else
        {
            //TODO: Delete an account with info provided
            if (req.session.Username == username)
            {
                res.status(403).send(`Cannot remove self from database.\nPlease do this manually by going into the mysql console and using the following command:\nDELETE FROM Users WHERE username = ${username}`);
            }
            else
            {
                connection.query('DELETE FROM Users WHERE username = ?', [username], (error, results, fields) => {
                    // If there is an issue with the query, output the error
                    if (error)
                    {
                        if (error.fatal) fatal = true;
                        console.error(error);
                        res.status(500).send("Database Error<br>Please try again later.");
                        return;
                    }

                    console.log(results);

                    res.send(`Successfully deleted user: ${username}`);
                });
            }
        }
    })

    // Login system
    //TODO: Learn how to send a user back to login on fail with a popup saying what went wrong
    app.post("/api/auth", (req, res) => {
        if (fatal) return res.sendStatus(500);
        let username = req.body.username;
        let password = req.body.password;

        if (req.session.LoggedIn)
        {
            res.send("You're already signed in");
            return;
        }
        if (!username || !password)
        {
            res.send("Please enter a vaild Username and Password");
            return;
        }

        if (connection != null)
        {
            connection.query('SELECT * FROM Users WHERE username = ?', [username], (error, results, fields) => {
                // If there is an issue with the query, output the error
                if (error)
                {
                    if (error.fatal) fatal = true;
                    console.error(error);
                    res.status(500).send("Database Error<br>Please try again later.");
                    return;
                }
                // If the account exists
                if (results.length > 0) {
                    let user = results[0];
                    
                    let isVaildPass = (password === user.password);

                    if (hashed)
                    {
                        isVaildPass = bcrypt.compareSync(password, user.password);
                    }

                    if (isVaildPass)
                    {
                        req.session.LoggedIn = true;
                        req.session.Username = username;
                        req.session.PermissionLevel = -1;
                        req.session.IsAdmin = (user.isAdmin === 1); // bool doesn't work in mysql? so it's an int instead

                        res.redirect("/admin");
                        return;
                    }
                }
                res.send("Incorrect Username or Password")
            });
        }
        else
        {
            // Yes I know this is REALLY bad but like I'm lazy and I'm bad at doing this stuff
            if (userInfo.username && userInfo.password)
            {
                let isVaildUser = (username === userInfo.username);
                let isVaildPass = (password === userInfo.password);

                if (hashed)
                {
                    isVaildPass = bcrypt.compareSync(password, userInfo.password);
                }

                let vaild = (isVaildUser && isVaildPass);

                if (vaild)
                {
                    req.session.LoggedIn = true;
                    req.session.Username = username;
                    req.session.PermissionLevel = userInfo.permissionLevel;
                    req.session.IsAdmin = false;

                    res.redirect("/admin");
                }
                else
                {
                    res.send("Incorrect Username or Password");
                }
            }
            else
            {
                res.send("Setup Error: username or password is missing in .env");
            }
        }
    });
}