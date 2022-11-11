const args = process.argv.slice(2);

// require("better-logging")(console);
require('dotenv').config();

const commandModule = require("./modules/commands");
const commandList = commandModule.commandList;

commandModule.readCommandFiles()

if (args.length > 0 && args[0] == "setup") return require("./setup").run(commandList);

const express = require('express');
const fs = require('then-fs');
const path = require("path");
const settingsModule = require("./modules/settings");
const settings = settingsModule.getSettings();

const { Client, GatewayIntentBits, REST, Routes, GuildMember, EmbedBuilder } = require('discord.js');

const client = new Client({
    // We don't need everything but might aswell for development purposes
    intents: [
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
    ],
    ws: {
        // Makes the bot popup as using phone
        properties: {
            $os: process ? process.platform : 'discord.js',
            $browser: 'Discord iOS',
            $device: 'discord.js',
      },
    }
});

// Default values
client.request = {};
client.commandList = [];
client.interactions = [];

const server = require("./Web/server");
const app = express();
const http = require('http').Server(app);

//TODO: Convert everything from discord.js 12 to discord.js 14

const token = process.env.token;
const prefix = process.env.prefix;
const RBXToken = process.env.RBXToken;

// const rest = new REST({ version: '10' }).setToken(token); // Maybe we can move this and make a script instead?

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

//TODO: Make an web admin panel for all the commands
//      maybe add a way to sign in with discord and check if the user has access not like I know how to do that
//      The most I could do is make an mySQL database with an account list with permission levels
//      and make it so only an admin account can create/remove accounts from the mySQL database (even tho I just learnt how to make an database locally)

//TODO: (This will help with permission system) Spilt some stuff from .env into settings.json
//      Stuff like cooldown, allowedRanks, etc will be in settings.json while stuff like the token would be in .env

//I'm going to hate this one so much....
//TODO: Convert ALL commands currently to work WITHOUT the bot that way the website can work
//      The reason why I want to do this is just so the bot can use the function to run the command
//      As well can the website currently it's bot only
//      We could always still run the command and have the bot log it tho
//      But this is still a pain so that's going to be fun see example.command.js for more info

//TL;DR
//TODO: Use Open Cloud API for commands instead of using /get-request
//TODO: Permission level system to stop lower ranks from using certain commands instead of giving all ranks full access
//TODO: Convert commands to be slash commands (I will probably keep message commands maybe)
//TODO: Check to see if dotenv needs to be used in EVERY script instead of just in index
//TODO: Make a website that does the same thing the bot does but in web form ig
//TODO: make a settings.json file this should help with permission system since we can put everything but the tokens in there

// That should be it for the todo comments I hope I might see what I can do later
// God this took too long to type (I'm bad at spelling so hopefully no typos)

/**
 * @param {String} str
 * @returns {Boolean} bool
 */
function convertToBool(str)
{
    if (typeof(str) != "string") return false;
    return (str.toLowerCase() === "true") ? true : false;
}

let __DEBUG = convertToBool(process.env.WEBSITEDEBUG)

client.getBotOwner = () => {
    let owner = client.application.owner;
    
    if (owner != null && owner.ownerId != null) return owner.ownerId;
    if (owner != null && owner.id != null) return owner.id;

    return null; 
}

/**
 * 
 * @param {Discord.User} author 
 * @param {string} title 
 * @param {string} description 
 * @returns {Discord.MessageEmbed} embed
 */
client.embedMaker = (author, title, description) => {
    let embedColor = process.env.embedColor;
    let embed = new EmbedBuilder();

    if (embedColor) embed.setColor(embedColor);
    embed.setAuthor({
        name: author.tag,
        url: author.displayAvatarURL()
    });
    embed.setTitle(title);
    embed.setDescription(description);
    embed.setFooter({
        text: "Temp Footer"
    });
    // embed.setFooter('Command created by zachariapopcorn#8105 - https://discord.gg/XGGpf3q');
    return embed;
}

//#region Express

app.all("/bot", (req, res) => {
    let status = client.ws.status;

    let code, text;

    switch (status) {
        case 0:
            code = 200;
            text = "Ready";
            break;
        case 1:
            code = 425;
            text = "Connecting";
            break;
        case 2:
            code = 503;
            text = "Reconnecting";
            break;
        case 3:
            code = 503;
            text = "Idle";
            break;
        case 4:
            code = 425;
            text = "Nearly";
            break;
        case 5:
            code = 503;
            text = "Disconnected";
            break;
        case 6:
            code = 425;
            text = "WaitingForGuilds";
            break;
        case 7:
            code = 425;
            text = "Identifying";
            break;
        case 8:
            code = 200;
            text = "Resuming";
            break;
        default:
            code = 500;
            text = "Internal Server Error";
            break;
    }

    res.status(code).json({
        status: text,
        ping: client.ws.ping
    })
});

app.get('/', async (req, res) => {
    if (convertToBool(process.env.enableAdminWebsite)) res.sendFile(path.join(__dirname,  "index.html"));
    else res.sendStatus(200);
});

app.get(`/get-request`, async (req, res) => {
    res.status(200).send(client.request);
});

app.post(`/verify-request`, async (req, res) => {
    let requestID = req.headers.requestid;

    console.log(requestID);
    console.log(client.request[requestID]);
    console.log(client.interactions[requestID]);

    let commandRequest = client.request[requestID];
    let interaction = client.interactions[requestID];
    
    if (commandRequest === undefined) return res.sendStatus(403);
    if (interaction === undefined) return res.sendStatus(500);

    delete client.request[requestID];
    delete client.interactions[requestID];

    let successStatus = req.headers.success;
    let message = req.headers.message;

    console.log(interaction);

    let user = interaction.user;

    if(successStatus == "true")
    {
        if("moderator" in req.headers)
        {
            let embed = client.embedMaker(user, "Success", message);
            embed.addField("Ban Information", `**Moderator**: ${req.headers.moderator}\n**Reason**: ${req.headers.reason}`);
            interaction.followUp({
                content: `<@${user.id}>`,
                embeds: [embed],
                ephemeral: true
            });
        }
        else
        {
            interaction.followUp({
                content: `<@${user.id}>`,
                embeds: [client.embedMaker(user, "Success", message)],
                ephemeral: true
            });
        }
    }
    else
    {
        interaction.followUp({
            content: `<@${user.id}>`,
            embeds: [client.embedMaker(user, "Failure", message)],
            ephemeral: true
        });
    }

    // client.request

    return res.sendStatus(200);
});

let listener = http.listen(process.env.PORT, () => {
    server(app, http);
    console.log(`Your app is currently listening on port: ${listener.address().port}`);
});

//#endregion

if (__DEBUG) return; // Just some stuff for debugging only the website 
                     // So I don't spam discord api Lol

client.on("debug", console.debug)

client.on('ready', async() => {
    console.log(`Logged into the Discord account - ${client.user.tag}`);
    client.commandList = commandList;
});

/**
 * 
 * @param {GuildMember} user 
 * @param {*} command 
 */
client.hasPermission = function(user, command)
{
    //TODO: Make permission system
    return true; // Awaiting permission system so this will do
}

/**
 * @param {Interaction<CacheType>} interaction
*/
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.isCommand())
    {
        let index = commandList.findIndex(cmd => cmd.name === interaction.commandName.toLowerCase());
        if (index == -1) return interaction.reply({ content: `${interaction.commandName} Not Found`, ephemeral: true }); // Command not found
        let command = commandList[index];
        if (!client.hasPermission((interaction.member || interaction.user), command)) return interaction.reply({ content: `Invalid permissions for '${interaction.commandName}'`, ephemeral: true }); // Command found but no access
        try
        {
            await command.file.run(interaction, client);
        }
        catch (err)
        {
            console.error(err);

            let data = {
                content: "There was an error running this command.\nPlease try again later.",
                ephemeral: true
            }

            if (!interaction.replied)
                return interaction.reply(data);
            else
                return interaction.followUp(data);
        }
    }
});

//TODO: Rewrite interactionCreate function that I took from a bot I made awhile ago
//      That I probably took from somewhere else Lol

let interactionCreateDisabled = true; // Since this is taken from old code and needs to be redone
                                      // I think it's best that we just disable it for now

/**
 * @param {Interaction<CacheType>} interaction
*/
client.on("interactionCreate", async interaction => {
    if (interactionCreateDisabled) return; // TEMP AS THIS FUNCTION NO LONGER WORKS HERE
    //console.log(interaction)
    let cmdName;
    let command;

    const guildId = interaction.inGuild() && interaction.guildId.toString() || null;
    const perms = client.getpermission(interaction.user.id)

    if (interaction.isCommand())
        cmdName = interaction.commandName;
    else if (interaction.isButton())
        cmdName = interaction.message.interaction.commandName
  
    if (guildId != null)
    {
        let guildcmds;
        for (let guild of req_guildCommands)
        {
        if (guild.guildId === guildId)
        {
            guildcmds = guild.commands;
            break;
        }
        }
        if (guildcmds != null)
        {
        for (let cmd of guildcmds)
        {
            if (cmd.name != null && cmd.name === cmdName)
            {
            command = cmd;
            break;
            }
        }
        }
    }

    if (command == null)
    {
        for (let cmd of reg_commands)
        {
        if (cmd.name != null && cmd.name === cmdName)
        {
            command = cmd;
            break;
        }
        }
    }

    if (interaction.isCommand())
    {
        if (command != null)
        {
            // Yup this is the permission system!
            if (command.permission <= perms)
            //try {
                // wtf is this? like fr what did I try to do
                //TODO: Fix whatever tf this mess is... Looks like it's for error catching but really wow
                //      Very bad way of doing this I think for now it works tho since I'm lazy
                command.run(client, interaction)
                .catch(async (error) => {
                    let msg = `There was an error running this command.\n${error}`;
                    console.error(`There was an error running ${command}\n${error}`);
                    try
                    {
                        try
                        {
                            await interaction.reply({ content: msg, ephemeral: true });
                        }
                        catch (error1)
                        {
                            await interaction.followUp(msg)
                        }
                    }
                    catch (error2)
                    {
                        try 
                        {
                            await interaction.reply({ content: "There was an error running this command.", ephemeral: true })
                        }
                        catch (error3)
                        {
                            try 
                            {
                                await interaction.followUp(msg)
                            }
                            catch (err)
                            {
                                console.warn(`Discord maybe having problems???\n${err}`)
                            }
                        }
                    }
                })
                .then(() => {});
            /*
            } catch (error) {
                await interaction.reply({ content: "There was an error running this command.", ephemeral: true })
                console.error(error);
            }
            */
            else
                await interaction.reply({ content: "Invaild permissions.", ephemeral: true })
        }
        else
        {
            await interaction.reply({ content: "Command function not found or removed.", ephemeral: true })
        }
    }
    else if (interaction.isButton())
    {
        //TODO: Find out how to do this again It's been a long time
        return; // moved to collecters in run
    }
    else
    {
        console.log(interaction)
    }
});

client.login(token);
