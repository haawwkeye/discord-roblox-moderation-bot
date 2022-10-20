/**
 * @param {express.Application} app
 */
module.exports = (app, http, sessionMiddleware, users) => {
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

    let messages = [];
    let privateMessages = [];

    function saveMessage(data)
    {
        console.log(data);
        if (!data.toUserId && !data.fromUserId)
        {
            messages.push(data);
        }
        else
        {
            privateMessages.push(data);
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
            data.UserId = session.UserId;
            saveMessage({
                UserId: session.UserId,
                //TEMP
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
                //TEMP
                toUserId: data.toUserId,
                fromUserId: data.fromUserId,
                message: data.message
            });
            // we tell the client to execute 'new message'
            socket.to(data.toUserId).to(data.fromUserId).emit('private message', {
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
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
                numUsers: numUsers
            });
        });

        // when the client emits 'typing', we broadcast it to others
        socket.on('typing', () => {
            socket.broadcast.emit('typing', {
                Username: session.Username,
                PermissionLevel: session.PermissionLevel,
                IsAdmin: session.IsAdmin,
            });
        });

        // when the client emits 'stop typing', we broadcast it to others
        socket.on('stop typing', () => {
            socket.broadcast.emit('stop typing', {
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
                    Username: session.Username,
                    PermissionLevel: session.PermissionLevel,
                    IsAdmin: session.IsAdmin,
                    numUsers: numUsers
                });
            }
        });
    });
}
