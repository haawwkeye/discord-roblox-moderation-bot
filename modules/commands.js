const fs = require('fs');
exports.commandList = [];

exports.readCommandFiles = () =>
{
    let files = fs.readdirSync("./commands");

    for(const file of files)
    {
        if(!file.endsWith(".js")) // Skip file as it isn't a vaild comamnd
        {
            if (file.endsWith(".disabled")) continue; // most likely an disabled command so let's not warn
            console.warn((`Invalid file detected in commands folder, please move this file: ${file}`));
            continue;
        }

        let coreFile = require(`../commands/${file}`);
        this.commandList.push({
            file: coreFile,
            name: file.split('.')[0]
        });
    }

    this.readCommandFiles = () => {}; // Remove function
}
