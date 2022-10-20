/**
 * @param {express.Application} app
 */
module.exports = (app, http, sessionMiddleware, users) => {
    const fs = require("fs");
    const io = require("socket.io")(http);

    io.use(sessionMiddleware);

    io.use((socket, next) => {
        const session = socket.request.session;
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
        console.log(data);
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

    function getPrivateMessages(session)
    {
        let send = []
        privateMessages.forEach((val) => {
            if (val.toUserId === session.UserId || val.fromUserId === session.UserId) send.push(val);
        })
        return send;
    }

    let numUsers = 0;

    //TODO: Revamp this as one it's from an example and two we should only use UserId
    //      Aswell as whatever else is needed for that event (like message, toUser, etc...)
    //      Maybe add encryption? but probably won't (atleast for private public is probably fine without)
    io.on('connection', (socket) => {
        const session = socket.request.session;
        let addedUser = false;

        console.log(session);

        // when the client emits 'new message', this listens and executes
        socket.on('new message', (data) => {
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
                message: data.message
            });
        });

        // when the client emits 'add user', this listens and executes
        socket.on('add user', () => {
            if (addedUser) return;
            ++numUsers;
            addedUser = true;

            const data = {
                messages: messages,
                privateMessages: getPrivateMessages(session)
            }

            console.log(data);

            socket.emit('login', {
                numUsers: numUsers,
                messages: data.messages,
                privateMessages: data.privateMessages
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
