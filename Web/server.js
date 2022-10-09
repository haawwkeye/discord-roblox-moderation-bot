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
    let userInfo = {
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

    app.post("/api/editUser", (req, res) => {
        let username  = req.body.username;
        let password  = req.body.password;
        let giveAdmin = req.body.isAdmin || false;

        let isAdmin   = (req.session.LoggedIn && req.session.IsAdmin);
        
        if (isAdmin) res.sendStatus(403);
        else
        {
            //TODO: Make an account with info provided
        }
    })

    app.delete("/api/editUser", (req, res) => {
        let username = req.body.username;

        let isAdmin  = (req.session.LoggedIn && req.session.IsAdmin);
        
        if (isAdmin) res.sendStatus(403);
        else
        {
            //TODO: Delete an account with info provided
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

                        if (userInfo.isHashed)
                        {
                            isVaildPass = bcrypt.compareSync(password, user.password);
                        }

                        if (isVaildPass)
                        {
                            req.session.LoggedIn = true;
                            req.session.Username = true;
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