//TODO: Rewrite the command script using this example before working on all commands
//      This way I know the format and I can test using only this command until it's done
//      to make sure everything works

const Discord = require('discord.js');

// This is the roblox command this is what we will be looking for on the admin website
// with this we can also only show commands that have this Roblox function
exports.Roblox = async() => {}

exports.help = async() => {
    let name = `**example**`;
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
            .setName('questionnaire')
            .setDescription('Asks you a series of questions!')
            .addStringOption(option => option.setName('input').setDescription('Your name?'))
            .addBooleanOption(option => option.setName('bool').setDescription('True or False?'))
            .addUserOption(option => option.setName('target').setDescription('Closest friend?'))
            .addChannelOption(option => option.setName('destination').setDescription('Favourite channel?'))
            .addRoleOption(option => option.setName('role').setDescription('Least favourite role?'))
            .addIntegerOption(option => option.setName('int').setDescription('Sides to a square?'))
            .addNumberOption(option => option.setName('num').setDescription('Value of Pi?'))
            .addMentionableOption(option => option.setName('mentionable').setDescription('Mention something!'))
            .addAttachmentOption(option => option.setName('attachment').setDescription('Best meme?'));
}

/**
* @param {Discord.Interaction<CacheType>} interaction
* @param {Discord.Client} client
*/
exports.run = async(interaction, client) => {
    console.log(interaction);
    throw Error("Not Implemented");
}
