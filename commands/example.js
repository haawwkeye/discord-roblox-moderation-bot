const Discord = require("discord.js");
const ms = require("ms");
const __filename__ = __filename; // Old __filename
__filename = require("path").parse(__filename).name.toLowerCase(); // Since names have to be lower cased

// This is the roblox command this is what we will be looking for on the admin website
// with this we can also only show commands that have this Roblox function
exports.Roblox = async() => {}

// Permission level for the command
exports.Level = -1;

exports.help = async() => {
    let name = `**${__filename}**`;
    let description = "This command does nothing";
    return `${name} - ${description}\n`;
}

/**
 * 
 * @param {Discord.SlashCommandBuilder} builder 
 * @returns {Discord.SlashCommandBuilder} built
 */
exports.build = (builder) => {
    return builder
            .setName(__filename)
            .setDescription("Example Command");
}

/**
* @param {Discord.Interaction<CacheType>} interaction
* @param {Discord.Client} client
*/
exports.run = async(interaction, client) => {
    throw Error("Not Implemented");
}
