const session = require("express-session");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const express = require("express"); // Yea idk it's just how it works ig /shrug
const path = require("path");
const { userInfo } = require("os");

/**
 * @param {express.Application} app
 */
module.exports = (app) => {
    let dbEnabled, hashed
    if (process.env.dbEnabled != null)
    {
        dbEnabled = process.env.dbEnabled.toLowerCase();
        if (dbEnabled === "true") dbEnabled = true; else dbEnabled = false;
    }
    else
    {
        dbEnabled = false;
    }

    if (process.env.hashed != null)
    {
        hashed = process.env.hashed.toLowerCase();
        if (hashed === "true") hashed = true; else hashed = false;
    }
    else
    {
        hashed = false;
    }

    // console.log(process.env)

    // Required for auth unless you want to do one manually without a database
    let connection = null;

    //TODO: Make a list of users instead of just using one user
    //      Maybe we can add this in settings.json when that's done??

    let userInfo = {
        permissionLevel: -1, //TODO: When Permission level system is done change this to be something else
        username: process.env.localUsername,
        password: process.env.localPassword,
        isHashed: hashed
    }

    if (dbEnabled)
    {
        userInfo = null; // Not needed if using db since the user will most likely be defined in there
        connection = mysql.createConnection({
            host: process.env.dbHost,
            user: process.env.dbUser,
            password: process.env.dbPassword,
            database: process.env.dbName
        });
    }

    app.use(session({
        secret: "secret",
        resave: true,
        saveUninitialized: true
    }));
    
    app.use("/css", express.static("Web/CSS"))
    app.use("/img", express.static("Web/Images"))
    app.use("/js", express.static("Web/JS"))

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get("/admin", (req, res) => {
        if (req.session.LoggedIn) res.sendFile(path.join(__dirname, "Pages", "admin.html")); else res.redirect("/login");
        // res.send("Hello, World")
    });

    app.get("/login", (req, res) => {
        if (!req.session.LoggedIn) res.sendFile(path.join(__dirname, "Pages", "login.html"))
        else res.redirect("/admin");
    });

    // This is going to be used later on when we do the admin panel code
    app.get("/api/isAdmin", (req, res) => {
        res.send(req.session.isAdmin || false);
    })

    app.post("/api/editUser", (req, res) => {
        let username  = req.body.username;
        let password  = req.body.password;
        let giveAdmin = req.body.isAdmin || 0;
        let perms     = req.body.perms || 0;

        let isAdmin   = (req.session.LoggedIn && req.session.IsAdmin);
        
        if (!isAdmin) res.sendStatus(403);
        else
        {
            //TODO: Make an account with info provided
            connection.query('SELECT * FROM accounts WHERE username = ?', [username], (error, results, fields) => {
                if (error) throw error;

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

                    connection.query("INSERT INTO accounts VALUES (0,?,?,?)", [username, pass, giveAdmin, perms], (error, results, fields) => {
                        if (error) throw error;
                        console.log(results);
                    });
                }
            });
        }
    })

    app.delete("/api/editUser", (req, res) => {
        let username = req.body.username;

        let isAdmin  = (req.session.LoggedIn && req.session.IsAdmin);
        
        if (!isAdmin) res.sendStatus(403);
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
                    if (error) throw error;
                    // If the account exists
                    console.log(results);
                })
            }
        }
    })

    app.post("/api/auth", (req, res) => {
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
            //TODO: mysql account system (this is PAIN since I'm very new to mysql databases)
            try {
                connection.query('SELECT * FROM Users WHERE username = ?', [username], (error, results, fields) => {
                    // If there is an issue with the query, output the error
                    if (error) throw error;
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
                            req.session.IsAdmin = (user.isAdmin === 1);

                            res.redirect("/admin");
                            return;
                        }
                    }
                    res.send("Incorrect Username or Password")
                });
            } catch (err) {
                console.error(err);
                res.status(500).send("Database Error\nPlease try again later.");
            }
        }
        else
        {
            // Yes I know this is REALLY bad but like I'm lazy and I'm bad at doing this stuff
            if (userInfo.username && userInfo.password)
            {
                let isVaildUser = (username === userInfo.username);
                let isVaildPass = (password === userInfo.password);

                if (userInfo.isHashed)
                {
                    isVaildPass = bcrypt.compareSync(password, userInfo.password);
                }

                req.session.LoggedIn = (isVaildUser && isVaildPass);
                req.session.Username = username;
                req.session.PermissionLevel = userInfo.permissionLevel;
                req.session.IsAdmin = false;

                res.redirect("/admin");
                return;
            }
            else
            {
                res.send("Setup Error: username or password is missing in .env");
            }
        }
        res.send("Incorrect Username or Password")
    });
}