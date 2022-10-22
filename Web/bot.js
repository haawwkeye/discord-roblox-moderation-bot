exports.bot = {
    User: null,
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
}; // Gets defined later on
exports.commands = {
    "help": {
        run: (args, sendMsg) => {
            let cmds = this.commands;
            let message = "Commands: \n";
            let found = cmds[args[0]];

            //TODO: find out how to format this
            function fetchHelp(cmd)
            {
                return `${cmd.siteAdmin ? "(SITE ADMIN ONLY)" : ""} ${cmd.help}`
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
            sendMsg("new message", message);
        },
        help: "help - Shows this message",
        siteAdmin: false,
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

    this.bot.User.on("new message", (data) => {
        let msg = data.message.toLowerCase();
        if (msg.startsWith("-"))
        {
            let args = msg.slice(1).split(" ");
            let command = this.commands[args[0]];
            if (command) command.run(args.slice(1), this.bot.sendPublicMsg);
            else this.bot.sendPublicMsg("Invaild command, Check -help for all commands");
        }
    });

    this.bot.User.on("private message", (data) => {
        let msg = data.message.toLowerCase();
        if (msg.startsWith("-"))
        {
            let args = msg.slice(1).split(" ");
            let command = this.commands[args[0]];
            if (command) command.run(args.slice(1), (msg) => {
                this.bot.sendPrivateMsg(msg, data.UserId);
            });
            else this.bot.sendPrivateMsg("Invaild command, Check -help for all commands", data.UserId);
        }
    });

    this.bot.User.on("connect", () => {
        console.log("Successfully connected to chat");
    });
}
