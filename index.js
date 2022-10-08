const express = require('express');
const Discord = require('discord.js');
const fs = require('then-fs');

const client = new Discord.Client();
const app = express();

require('dotenv').config();

const token = process.env.token;
const prefix = process.env.prefix;
const RBXToken = process.env.RBXToken;

//TODO: Use Roblox API instead of get requests that way we can send more then one command every 5 seconds
//      This would also allow us to verify without using client.request or we can make client.request and request table
//      and from there we can check the request id example of this is using messaging service like so:
//      (this is going to be bad I haven't done this in awhile)
//      {"message":{"requestId": currentRequestId, "requestData": "Command here"}} -> {Data={"requestId" = currentRequestId, "requestData" = "Command here"}}
//      Should look something like that but I haven't tested so I might have to stringify the json but it should work kinda like this
//      And for non-global commands you can also just add a jobId argument to say it's only meant for that jobId

//TODO: Move allowedRanks out of the commands and add a permission level system instead aka revamp the rank system
//      This way we can make it so mods can only kick players and admins can kick/ban/announce etc
//      Would also allow us to just make a table of ranks with Id's in the .env file
//      I don't know if you can do this with .env tho so I have to look into this abit more

// More info on the TODO above: basically I want to make it so instead of Mod/Admin/etc being able to run EVERY command
// We make it so the commands require a certain permission level an example is with eval
// We don't want to allow everyone access to this since lets say for an example an mod has access to this
// They can run code with node and that could be bad and even with roblox they could do damage to stuff like datastores
// or even loading backdoors into every server you would probably notice both of the methods but this is still an issue
// but with an permission level system you can make it so only the bot owner has permission or even make it so the level
// is REALLY high this way only people with that certain level and above can use that command
// This is really simple to do if it works with .env I don't know like I said before I have to look into this to see if it's possible
// If not it should be as simple as using a json string and converting a string to json to read the data and setting it up in here

//TODO: Convert all commands to slash commands aka interactions now this is going to be a pain but it will be worth it in the end
//      slash commands would make it so instead of doing something like ?mute username you can do /mute username
//      It also provides a description of what the command is and what the args are and if the arg is required
//      basically makes so you can't run a command without certain args

//TODO: remove dotenv.config() from all scripts but this one (I don't think it's required for it to be in every script??)

//TODO: (optional) Make an web admin panel for all the commands
//      maybe add a way to sign in with discord and check if the user has access not like I know how to do that
//      The most I could do is make an mySQL database with an account list with permission levels
//      and make it so only an admin account can create/remove accounts from the mySQL database (even tho I just learnt how to make an database locally)

//TODO: (This will help with permission system) Spilt some stuff from .env into settings.json
//      Stuff like cooldown, allowedRanks, etc will be in settings.json while stuff like the token would be in .env

//TL;DR
//TODO: Use Open Cloud API for commands instead of using /get-request
//TODO: Permission level system to stop lower ranks from using certain commands instead of giving all ranks full access
//TODO: Convert commands to be slash commands (I will probably keep message commands maybe)
//TODO: Check to see if dotenv needs to be used in EVERY script instead of just in index
//TODO: (optional) Make a website that does the same thing the bot does but in web form ig
//TODO: make a settings.json file this should help with permission system since we can put everything but the tokens in there

// That should be it for the todo comments I hope I might see what I can do later
// God this took too long to type (I'm bad at spelling so hopefully no typos)

client.embedMaker = function embedMaker(author, title, description) {
    let embed = new Discord.MessageEmbed();
    embed.setColor(process.env.embedColor);
    embed.setAuthor(author.tag, author.displayAvatarURL());
    embed.setTitle(title);
    embed.setDescription(description);
    // embed.setFooter('Command created by zachariapopcorn#8105 - https://discord.gg/XGGpf3q');
    return embed;
}

const commandList = [];

app.get('/', async (request, response) => {
     response.sendStatus(200);
});

app.get(`/get-request`, async (request, response) => {
    response.status(200).send(client.request);
});

app.post(`/verify-request`, async (request, response) => {
    let commandRequest = client.request;
    if(commandRequest === "No request") return response.sendStatus(200);
    let successStatus = request.headers.success;
    let message = request.headers.message;

    let channel = client.channels.cache.get(commandRequest.channelID);
    if(!channel) {
        return response.sendStatus(200);
    }

    if(successStatus == "true") {
        if("moderator" in request.headers) {
            channel.send(`<@${commandRequest.authorID}>`);
            let embed = client.embedMaker(client.users.cache.get(commandRequest.authorID), "Success", message)
            embed.addField("Ban Information", `**Moderator**: ${request.headers.moderator}\n**Reason**: ${request.headers.reason}`);
            channel.send(embed);
        } else {
            channel.send(`<@${commandRequest.authorID}>`);
            channel.send(client.embedMaker(client.users.cache.get(commandRequest.authorID), "Success", message));
        }
    } else {
        channel.send(`<@${commandRequest.authorID}>`);
        channel.send(client.embedMaker(client.users.cache.get(commandRequest.authorID), "Failure", message));
    }

    client.request = "No request";

    return response.sendStatus(200);
});

let listener = app.listen(process.env.PORT, () => {
    console.log(`Your app is currently listening on port: ${listener.address().port}`);
});

async function readCommandFiles() {
    let files = await fs.readdir(`./commands`);

    for(const file of files) {
        if(!file.endsWith(".js")) // Skip file as it isn't a vaild comamnd
        {
            console.warn((`Invalid file detected in commands folder, please remove this file for the bot to work: ${file}`));
            continue;
        } 
        let coreFile = require(`./commands/${file}`);
        commandList.push({
            file: coreFile,
            name: file.split('.')[0]
        });
    }
}

client.on('ready', async() => {
    console.log(`Logged into the Discord account - ${client.user.tag}`);
    await readCommandFiles();
    client.request = "No request";
    client.commandList = commandList;
});

client.on("message", async message => {
    if(message.author.bot) return;
    if(message.channel.type == "dm") return;
    if(!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).split(" ");
    let command = args.shift().toLowerCase();
    let index = commandList.findIndex(cmd => cmd.name === command);
    if (index == -1) return;
    commandList[index].file.run(message, client, args);
});

client.login(token);