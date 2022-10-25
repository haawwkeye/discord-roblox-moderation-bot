/**
 * @param {express.Application} app
 */
module.exports = async (app, http, sessionMiddleware, users) => {
    const fs = require("fs");
    const io = require("socket.io")(http);
    const bot = require("./bot");
    let botUser = bot.User ? bot.User : await bot.startBot();

    //TODO: Rewrite server and client code for io as most of it is stolen from
    //      https://github.com/socketio/socket.io/tree/master/examples/
    //      It should be fine to take it from examples but at the same time at some point
    //      I should probably rewrite it instead of copy paste and not knowing what it does
    //      Either way it WORKS for now ima change it later on probably when the bot/web is done
    //      AKA revamp EVERYTHING once the bot and website work at the same time
    //      That way I don't have to revamp just this I can revamp the whole system from v1 to v2
    //      or ig v2 to v3 for the bot Lol

    //TL;DR
    //TODO: Rewrite the whole system at some point (most likely after everything works)

    io.use(sessionMiddleware);

    io.use((socket, next) => {
        let isSelf = socket.request.headers.host === `localhost:${process.env.PORT}` && socket.request.headers.auth;
        const session = isSelf ? JSON.parse(socket.request.headers.auth) : socket.request.session;
        if (session && session.LoggedIn) {
            next();
        } else {
            next(new Error("unauthorized"));
        }
    });

    // Chatroom
    
    //TODO: When saving chat and all that ONLY save UserId and Message
    //      This way we don't have to deal with permissions being wrong (or a deleted user)
    //TODO: Handle deleted users aswell as maybe adding an option to save to database???

    if (!fs.existsSync(__dirname + "/data/")) fs.mkdirSync(__dirname + "/data/");

    let userDataName = __dirname + "/data/UserData.json";
    let publicName = __dirname + "/data/Messages.json";
    let privateName = __dirname + "/data/PrivateMessages.json";

    if (!fs.existsSync(userDataName)) fs.writeFileSync(userDataName, "{}");
    if (!fs.existsSync(publicName)) fs.writeFileSync(publicName, "[]");
    if (!fs.existsSync(privateName)) fs.writeFileSync(privateName, "[]");

    let _userData = JSON.parse(fs.readFileSync(userDataName));
    let publicData = JSON.parse(fs.readFileSync(publicName));
    let privateData = JSON.parse(fs.readFileSync(privateName));

    if (typeof(_userData) != "object") fs.writeFileSync(_userData, "{}");
    if (typeof(publicData) != "object") fs.writeFileSync(publicName, "[]");
    if (typeof(privateData) != "object") fs.writeFileSync(privateName, "[]");

    let userData = typeof(_userData) === "object" ? _userData : {};
    let messages = typeof(publicData) === "object" ? publicData : [];
    let privateMessages = typeof(privateData) === "object" ? privateData : [];

    //TODO: Change how save and get works
    function saveMessage(data)
    {
        
        // console.log(data);
        if (!data.toUserId && !data.fromUserId)
        {
            messages.push(data);
            fs.writeFileSync(publicName, JSON.stringify(messages, null, "\t"));
        }
        else
        {
            privateMessages.push(data);
            fs.writeFileSync(privateName, JSON.stringify(privateMessages, null, "\t"));
        }
    }

    function getPrivateMessages(session, id)
    {
        let send = [];

        privateMessages.forEach((val) => {
            let isSelf = (val.toUserId === session.UserId || val.fromUserId === session.UserId);
            let isUser = (val.toUserId === id || val.fromUserId === id);

            if (id ? isSelf && isUser : isSelf) send.push(val);
        });
        
        return send;
    }

    let numUsers = 0;
    let hasRan = false;

    function beforeExit(eventType, ...args)
    {
        if (eventType === "uncaughtException") console.error(...args);
        if (hasRan) return;
        hasRan = true;
        console.log("Disconeected attempting to save userdata");
        fs.writeFileSync(userDataName, JSON.stringify(userData, null, "\t"));
        process.exit(-1); // I hope we don't have to use process more then this....
    }

    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, beforeExit.bind(null, eventType));
    })
    io.on("disconnected", beforeExit)

    //TODO: Revamp this as one it's from an example and two we should only use UserId
    //      Aswell as whatever else is needed for that event (like message, toUser, etc...)
    //      Maybe add encryption? but probably won't (atleast for private public is probably fine without)
    io.on('connection', (socket) => {
        if (hasRan) hasRan = false;
        let isSelf = socket.request.headers.host === `localhost:${process.env.PORT}` && socket.request.headers.auth;
        const session = isSelf ? JSON.parse(socket.request.headers.auth) : socket.request.session;
        let addedUser = false;
        let currentRoom = "General";

        function updateUserData(roomId, msgTbl)
        {
            if (session.UserId === 0) return;
            let userdata = userData[session.UserId];
            if (!userdata)
            {
                userdata = {};
                userData[session.UserId] = userdata;
            }
            if (!userdata[roomId]) userdata[roomId] = {lastMsgId: msgTbl.length};
            else userdata[roomId].lastMsgId = msgTbl.length;
        }

        function getUserData(roomId)
        {
            if (session.UserId === 0) return roomId != undefined ? {lastMsgId: -1} : {};
            let userdata = userData[session.UserId];
            if (!userdata)
            {
                userdata = {};
                userData[session.UserId] = userdata;
            }
            if (roomId != undefined)
            {
                if (!userdata[roomId]) userdata[roomId] = {lastMsgId: -1};
                return userdata[roomId];
            }
            return userdata;
        }

        if (isSelf) {
            socket.on("botJoin", (data) => {
                socket.join(data);
            });

            socket.on("botLeave", (data) => {
                socket.leave(data);
            });
        }

        // console.log(session);

        socket.on("roomData", () => {
            let roomUserData = getUserData(currentRoom);
            const data = {
                messages: currentRoom === "General" ? messages : getPrivateMessages(session, currentRoom),
                lastMessage: roomUserData.lastMsgId,
                numUsers: numUsers //TEMP UNTIL WE CAN GET ROOM USERS
            }
            // console.log(data);
            socket.emit("roomData", data);
        })

        socket.on("join room", (roomId) => {
            let lastRoom = currentRoom;
            currentRoom = roomId;
            
            // We can't join/leave the default room
            if (roomId === "General") return;
            if (lastRoom != "General") socket.leave(lastRoom);

            socket.join(roomId);
        });

        //TODO: Fix being able to see messages anywhere when they're supposed to only show up
        //      In the current Room
        //      example: have two clients signed in have client 1 stay in any channel
        //      Then have client 2 open another channel and send any message
        //      This will then (even tho it's not supposed to) show that one message
        //      to ALL clients if you leave and rejoin the channel you were just in (client 1)
        //      The messages will be gone tho maybe it's an issue on the client side?
        //      Or it's in issue on how I send message to the client /shrug

        //TODO: Use new message for both all and private messages maybe? just an idea
        //      Probably won't do this tho

        // when the client emits 'new message', this listens and executes
        socket.on('new message', (data) => {
            if (currentRoom != "General") return;
            let timestamp = Date.now;
            saveMessage({
                UserId: session.UserId,
                //TEMP
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
                //TEMP
                timestamp: timestamp,
                message: data
            });
            updateUserData(currentRoom, messages);
            // we tell the client to execute 'new message'

            socket.broadcast.emit('new message', {
                UserId: session.UserId,
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
                timestamp: timestamp,
                message: data
            });
        });

        // when the client emits 'private message', this listens and executes
        socket.on('private message', (data) => {
            let timestamp = Date.now;
            saveMessage({
                UserId: session.UserId,
                //TEMP
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
                //TEMP
                toUserId: data.toUserId,
                fromUserId: data.UserId,
                timestamp: timestamp,
                message: data.message
            });
            updateUserData(currentRoom, getPrivateMessages(session, currentRoom));
            // we tell the client to execute 'new message'
            
            socket.to(data.toUserId).to(data.UserId).emit('private message', {
                UserId: session.UserId,
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
                toUserId: data.toUserId,
                fromUserId: data.UserId,
                timestamp: timestamp,
                message: data.message
            });
        });

        // when the client emits 'add user', this listens and executes
        socket.on('add user', () => {
            botUser.emit("botJoin", session.UserId);
            
            if (addedUser) return;
            ++numUsers;
            addedUser = true;

            // console.log(data);

            socket.emit('login', {
                numUsers: numUsers,
            });
            // echo globally (all clients) that a person has connected
            socket.broadcast.emit('user joined', {
                UserId: session.UserId,
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
                numUsers: numUsers
            });
        });

        // when the client emits 'typing', we broadcast it to others
        socket.on('typing', () => {
            let isGeneral = (currentRoom === "General");

            const sent = {
                UserId: session.UserId,
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
                isGeneral: isGeneral
            }

            if (isGeneral)
            {
                socket.broadcast.emit('typing', sent);
            }
            else socket.to(currentRoom).emit('typing', sent)
        });

        // when the client emits 'stop typing', we broadcast it to others
        socket.on('stop typing', () => {
            let isGeneral = (currentRoom === "General");

            const sent = {
                UserId: session.UserId,
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
                isGeneral: isGeneral
            }

            if (isGeneral)
            {
                socket.broadcast.emit('stop typing', sent);
            }
            else socket.to(currentRoom).emit('stop typing', sent)
        });

        // when the user disconnects.. perform this
        socket.on('disconnect', () => {
            if (addedUser)
            {
                --numUsers;

                botUser.emit("botLeave", session.UserId);

                // echo globally that this client has left
                socket.broadcast.emit('user left', {
                    UserId: session.UserId,
                    Username: session.Username,
                    PermissionLevel: session.PermissionLevel,
                    IsAdmin: session.IsAdmin,
                    numUsers: numUsers
                });
            }
        });
    });
}
