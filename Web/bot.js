exports.bot = {
    User: null, // Gets defined later on
    sendPublicMsg: (msg) => {
        this.bot.User.emit("new message", msg);
    },
    sendPrivateMsg: (msg, uid) => {
        this.bot.User.emit("private message", {
            UserId: 0, // Is this even needed? /shrug
            toUserId: uid,
            message: msg
        });
    },
};

exports.commands = {
    "help": {
        run: (args, sendMsg) => {
            let cmds = this.commands;
            let message = "Commands: \n";
            let found = cmds[args[0]];

            //TODO: find out how to format this
            function fetchHelp(cmd)
            {
                return `${cmd.help}`
            }

            if (found != null && found.help != null) message = fetchHelp(found) + "\n";
            else
            {
                for (const i in cmds)
                {
                    if (Object.hasOwnProperty.call(cmds, i)) {
                        const cmd = cmds[i];
                        message += fetchHelp(cmd) + "\n";
                        
                    }
                }
            }
            message = message.slice(0, message.length-1);
            sendMsg(message);
        },
        help: "help - Shows this message",
        siteAdmin: false,
        perm: -1
    },
    "dm": {
        run: (args, sendMsg) => {
            let uid = args[0];
            let msg;

            args.forEach((elem, i) => {
                if (i < 1) return;
                if (msg === undefined) msg = elem + " ";
                else msg += elem + " ";
            });

            if (!uid) return sendMsg(`UserId is an required option.`);
            if (!msg) return sendMsg(`Message is an required option.`);

            msg.substring(0, msg.length-1);

            try {
                this.bot.sendPrivateMsg(msg, uid);
                sendMsg(`Sent message to ${uid}`);
            } catch (e) {
                sendMsg(`Failed to send message to ${uid}\n${e}`);
            }
            
        },
        help: "dm [UserId] [message] - DM's a certain user a certain message",
        siteAdmin: true,
        perm: -1
    }
}

exports.startBot = async() => {
    const client = require("socket.io-client");
    const url = `http://localhost:${process.env.PORT}`

    this.bot.User = client.io(url, {
        autoConnect: true,
        reconnection: true,

        extraHeaders: {
            auth: JSON.stringify({
                LoggedIn: true,
                // User Info
                UserId: 0,
                Username: "BOT",
                PermissionLevel: 6,
                IsAdmin: true,
            })
        }
    });

    const handleCommand = (data) => {
        // console.log(data);

        let msg = data.message;
        if (msg.startsWith("-"))
        {
            const sendMsg = (msg) => {
                if (data.toUserId) this.bot.sendPrivateMsg(msg, data.toUserId);
                else this.bot.sendPublicMsg(msg);
            }

            let args = msg.slice(1).split(" ");
            let command = this.commands[args[0].toLowerCase()];

            if (command) command.run(args.slice(1), sendMsg);
            else sendMsg("Invaild command, Check -help for all commands");
        }
    }

    this.bot.User.on("new message", handleCommand);
    this.bot.User.on("private message", handleCommand);

    this.bot.User.on("connect", () => {
        console.log("Successfully connected to chat");
    });

    return this.bot.User;
}
