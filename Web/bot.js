exports.bot;
exports.commands = {
    "help": {
        run: (args) => {
            let cmds = this.commands;
            let message = "Commands: \n";
            let found = cmds[args[0]];

            if (found != null && found.help != null) message = found.help + "\n";
            else
            {
                for (const i in cmds)
                {
                    if (Object.hasOwnProperty.call(cmds, i)) {
                        const cmd = cmds[i];
                        console.log(cmd);
                        message += cmd.help + "\n";
                        
                    }
                }
            }
            message = message.slice(0, message.length-1);
            this.bot.emit("new message", message);
        },
        help: "help - Shows this message"
    }
}

exports.startBot = async() => {
    const client = require("socket.io-client");

    this.bot = client.io(`http://localhost:${process.env.PORT}`, {
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

    socket.on("new message", (data) => {
        let msg = data.message.toLowerCase();
        if (msg.startsWith("-"))
        {
            let args = msg.slice(1).split(" ");
            let command = this.commands[args[0]];
            if (command) command.run(args.slice(1));
            else socket.emit("new message", "Invaild command, Check -help for all commands");
        }
    });

    socket.on("connect", () => {
        console.log("Successfully connected to chat");
    });
}
