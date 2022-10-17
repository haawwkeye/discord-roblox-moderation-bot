const fs = require("fs");
const path = require("path");

let settings;

const settingsPath = path.join(__dirname, "..", "config.json");
const defaultSettings = `{
    "bot": {
        "permissions": {
            "roles": {
                "roleId": -1
            },
            "users": {
                "userId": -1
            },
            "default": -1
        },
        "cooldown":10,
        "embedColor": "BLUE"
    },
    "web": {},
    "roblox": {
        "universe": {
            "Id": "123456789",
            "Name": "Example Universe"
        },
        "universeIdList": {}
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