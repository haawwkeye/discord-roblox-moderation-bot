//TODO: Rewrite the command script using this example before working on all commands
//      This way I know the format and I can test using only this command until it's done
//      to make sure everything works

const Discord = require('discord.js');
const ms = require('ms');

require('dotenv').config();

const embedColor = process.env.embedColor;

// This is the roblox command this is what we will be looking for on the admin website
// with this we can also only show commands that have this Roblox function
exports.Roblox = async() => {

}

//TODO: Rewrite the run function as it only works with discord messages
//      And we now only use interactions (make new function???)
//      ofc message commands should probably still work but I'm lazy rn

/**
* @param {Discord.Message} message
* @param {Discord.Client} client
* @param {String[]} args
*/

exports.run = async(message, client, args) => {

}

exports.help = async() => {
    let name = `**example**`;
    let description = "This command does nothing";
    return `${name} - ${description}\n`;
}
