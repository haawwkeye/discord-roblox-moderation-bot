//TODO: Add a sendHttp function that can be used with await and return data without a callback
//      This is very usefull as rn we can only do everything once the request is done instead of waiting
//      for the request to be done before doing anything else

const rankings = {
    [-1]: "Player",
    [0]: "VIP",
    [1]: "Trial Mod",
    [2]: "Mod",
    [3]: "Admin",
    [4]: "Super Admin",
    [5]: "Developer",
    [6]: "Owner"
}

/**
 * 
 * @param {String} unsafe 
 * @returns {String} escaped
 */
const escapeHtml = (unsafe) => {
    if (typeof(unsafe) != "string") return "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * 
 * @param {String} type
 * @param {String} url
 * @param {Document | XMLHttpRequestBodyInit | null | undefined}
 * @param {void} callback
 */
function sendhttp(type, url, body, callback)
{
    let xhr = new XMLHttpRequest();
    xhr.open(type, url, true);

    xhr.onload = () => {

        let status = xhr.status;

        if (status == 200) {
            callback(null, xhr.response);
        } else {
            callback(status, xhr.response);
        }
    };

    xhr.send(body);
}

// We want to wait for everything to load before attempting to do any of this since this script is probably at the top of body
document.addEventListener("DOMContentLoaded", () => {
    try {
        let userInfo;
        sendhttp("get", "/api/userInfo", null, (err, res) => {
            if (err)
            {
                console.error(err);
                throw err;
            }
            userInfo = JSON.parse(res);

            let user = {
                Username: escapeHtml(userInfo.Username),
                PermissionLevel: userInfo.PermissionLevel,
                IsAdmin: userInfo.IsAdmin
            }

            let infoElem = document.getElementById("UserInfo");
            let userHtml = document.createElement("b");
            userHtml.className = "User";
            userHtml.innerHTML = `${user.IsAdmin && "[SITE ADMIN]" || ""}[${rankings[user.PermissionLevel].toUpperCase() || user.PermissionLevel}] ${user.Username}`;
    
            infoElem.appendChild(userHtml);
        });
    } catch (error) {
        console.error(error);
        alert(error);
    }
});
