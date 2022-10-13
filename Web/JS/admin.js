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

// We want to wait for everything to load before attempting to do any of this since this script is probably at the top of body
document.addEventListener("DOMContentLoaded", async () => {
    try {
        let userInfo;
        await $.ajax({
            type: "get",
            url: "/api/userInfo",
            // data: "data",
            // dataType: "dataType",
            success: function (res) {
                if (typeof(res) != "object") {
                    return console.error(res);
                }
                userInfo = res;
            }
        });

        //TODO: switch to using jquery?

        if (userInfo != null)
        {
            let user = {
                Username: escapeHtml(userInfo.Username),
                PermissionLevel: userInfo.PermissionLevel,
                IsAdmin: userInfo.IsAdmin
            }

            // Setup Admin Only

            let AdminElems = document.getElementsByClassName("SiteAdmin");

            for (const Elem of AdminElems) {
                if (!user.IsAdmin)
                {
                    Elem.remove();
                    continue;
                }
                //TODO: Setup element after check
                break; // TEMP UNTIL SETUP IS FINISHED
            }

            // End Of Setup

            //TODO: Find out a way to do this better this is a mess like fr please clean this up

            let infoElem = document.getElementById("UserInfo");

            if (user.IsAdmin)
            {
                let rank = document.createElement("a");
                rank.className = "Rank";
                rank.setAttribute("data-rank", "SITEADMIN")
                rank.innerHTML = "[SITE ADMIN] ";
                infoElem.appendChild(rank);
            }

            let rankName = rankings[user.PermissionLevel];
            let userRank = rankName != null && rankName.toUpperCase() || rankings[6].toUpperCase();

            let rank = document.createElement("a");
            rank.className = "Rank";
            if (typeof(userRank) == "string")
            {
                rank.setAttribute("data-rank", userRank.replace(/\s/g, ""))
            }
            else
            {
                rank.setAttribute("data-rank", "NONE")
            }
            rank.innerHTML = `[${userRank}] `;
            infoElem.appendChild(rank);

            let userHtml = document.createElement("a");
            userHtml.setAttribute("data-rank", rank.getAttribute("data-rank") || "NONE")
            userHtml.className = "User";
            userHtml.innerHTML = user.Username;
            infoElem.appendChild(userHtml);
        }
        else
        {
            let rank = document.createElement("a");
            rank.className = "Rank";
            rank.setAttribute("data-rank", "NONE")
            rank.innerHTML = `[NONE] `;
            infoElem.appendChild(rank);

            let userHtml = document.createElement("a");
            userHtml.setAttribute("data-rank", "NONE")
            userHtml.className = "User";
            userHtml.innerHTML = "N/A";
            infoElem.appendChild(userHtml);
        }
    } catch (error) {
        console.error(error);
        alert(error);
    }
});
