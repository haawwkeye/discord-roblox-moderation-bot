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

    let publicName = __dirname + "/data/Messages.json";
    let privateName = __dirname + "/data/PrivateMessages.json";

    if (!fs.existsSync(publicName)) fs.writeFileSync(publicName, "[]");
    if (!fs.existsSync(privateName)) fs.writeFileSync(privateName, "[]");

    let publicData = JSON.parse(fs.readFileSync(publicName));
    let privateData = JSON.parse(fs.readFileSync(privateName));

    if (typeof(publicData) != "object") fs.writeFileSync(publicName, "[]");
    if (typeof(privateData) != "object") fs.writeFileSync(privateName, "[]");

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

    //TODO: Revamp this as one it's from an example and two we should only use UserId
    //      Aswell as whatever else is needed for that event (like message, toUser, etc...)
    //      Maybe add encryption? but probably won't (atleast for private public is probably fine without)
    io.on('connection', (socket) => {
        let isSelf = socket.request.headers.host === `localhost:${process.env.PORT}` && socket.request.headers.auth;
        const session = isSelf ? JSON.parse(socket.request.headers.auth) : socket.request.session;
        let addedUser = false;
        let currentRoom = "General";

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
            const data = {
                messages: currentRoom === "General" ? messages : getPrivateMessages(session, currentRoom),
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

        // when the client emits 'new message', this listens and executes
        socket.on('new message', (data) => {
            if (currentRoom != "General") return;
            saveMessage({
                UserId: session.UserId,
                //TEMP
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
                //TEMP
                message: data
            });
            // we tell the client to execute 'new message'
            socket.broadcast.emit('new message', {
                UserId: session.UserId,
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
                message: data
            });
        });

        // when the client emits 'private message', this listens and executes
        socket.on('private message', (data) => {
            saveMessage({
                UserId: session.UserId,
                //TEMP
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
                //TEMP
                toUserId: data.toUserId,
                fromUserId: data.UserId,
                message: data.message
            });
            // we tell the client to execute 'new message'
            
            socket.to(data.toUserId).to(data.UserId).emit('private message', {
                UserId: session.UserId,
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
                toUserId: data.toUserId,
                fromUserId: data.UserId,
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
            socket.broadcast.emit('typing', {
                UserId: session.UserId,
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
            });
        });

        // when the client emits 'stop typing', we broadcast it to others
        socket.on('stop typing', () => {
            socket.broadcast.emit('stop typing', {
                UserId: session.UserId,
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
            });
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
