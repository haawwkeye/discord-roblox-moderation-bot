const fs = require("fs");
const path = require("path");

let settings;

const settingsPath = path.join(__dirname, "settings.json");
const defaultSettings = `//TODO: Work on some settings
//      by this I mean some example settings stuff that could be nice to have etc

{
    // Settings for the discord bot
    "bot": {
        // This is the permission system used for the bot (DO NOT MAKE DEFAULT MORE THEN -1)
        //TODO: Revamp if we make the universeIdList stuff
        "permissions": {
            "roles": {
                "roleId": -1
            },
            "users": {
                "userId": -1
            },
            "default": -1
        },
        // This is the prefix used by the discord bot (DEFAULT: ?)
        "prefix": "?",
        // This is the cooldown in seconds for commands since we don't want to be ratelimited (DEFAULT: 10)
        "cooldown":10,
        // This is the color of the embed use nil for a random color (DEFAULT: BLUE)
        "embedColor": "BLUE"
    },
    // Settings for the website (when/if done)
    "web": {
        // None for now
    },
    // Settings for roblox
    "roblox": {
        "universe": {
            "Id": "123456789",
            "Name": "Example Universe"
        },
        // Universe Id's for the places being used (and name if you want)
        // example: "123456789": "Example Universe"
        // If there is no name provided it will grab the current name from roblox
        "universeIdList": {
            // This is not to be used for now just use universe (I don't wanna do more then one for rn)
        }
    }
}
`

/**
 * 
 * @param {Boolean} forceUpdate Should settings be reloaded
 * @returns {{}} settings
 */
exports.getSettings = function(forceUpdate)
{
    if (settings && !forceUpdate) return settings;

    if (!fs.existsSync(settingsPath))
    {
        fs.writeFileSync(settingsPath, defaultSettings);
    }

    let json = JSON.parse(fs.readFileSync(settingsPath));
    settings = json;

    return settings;
}