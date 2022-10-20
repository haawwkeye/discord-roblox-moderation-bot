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
        .replace(/>/g, "&gt;");
        // .replace(/"/g, "&quot;")
        // .replace(/'/g, "&#039;");
}

/*
// Taken from w3schools
<div class="alert error">
  <span class="closebtn">&times;</span>  
  <strong>Danger!</strong> Indicates a dangerous or potentially negative action.
</div>

<div class="alert success">
  <span class="closebtn">&times;</span>  
  <strong>Success!</strong> Indicates a successful or positive action.
</div>

<div class="alert info">
  <span class="closebtn">&times;</span>  
  <strong>Info!</strong> Indicates a neutral informative change or action.
</div>

<div class="alert warning">
  <span class="closebtn">&times;</span>  
  <strong>Warning!</strong> Indicates a warning that might need attention.
</div>
*/

function makeAlertHtml(alertType, message) {
    let alert;
    switch (alertType) {
        case 1:
            alert = "Info";
            break;
        case 2:
            alert = "Success";
            break;
        case 3:
            alert = "Warning";
            break;
        case 4:
            alert = "Error";
            break;
        default:
            alert = "Error";
            break;
    }

    return `<div class="alert ${alert.toLowerCase()}">\n
        \t<span class="closebtn" onclick="
            var div = this.parentElement;
            div.style.opacity = '0';
            div.style.transform = 'scale(0)';
            setTimeout(function(){ div.style.display = 'none'; div.remove(); }, 605);
        ">&times;</span>\n
        \t<strong>${alert}!</strong> ${escapeHtml(message)}\n
    </div>`
}

function alert(type, msg) {
    let alerts = $("#Alerts"); // get the div
    let html = makeAlertHtml(type, msg);
    alerts.append(html);
    let current = $("#Alerts")[0].lastElementChild;
    setTimeout(() => {
        current.style.opacity = "1";
        current.style.transform = "scale(1)";
    }, 100);
}

let userInfo;

function getRank(user)
{
    if (typeof(user) != "object") user = {PermissionLevel: -99};
    let rankName = rankings[user.PermissionLevel];
    if (user.PermissionLevel > 6) rankName = rankings[6]; else if (rankName == null) rankName = "NONE";
    let userRank = rankName.toUpperCase();
    return userRank;
}

async function genUserList(users) {
    let list = "";
    // let i = 0;

    const genRanks = (user) => {
        if (typeof(user) != "object") return `<a class="Rank" data-rank="NONE">[NONE]</a> `
        let ranks = ""
        if (user.IsAdmin)
        {
            ranks += `<a class="Rank" data-rank="SITEADMIN">[SITE ADMIN] </a>`
        }

        let userRank = getRank(user);

        ranks += `<a class="Rank" data-rank="${typeof(userRank) == "string" && userRank.replace(/\s/g, "") || "NONE"}">[${userRank}] </a> `
        
        return ranks;
    }

    const genUser = (user) => {
        let userRank = getRank(user);
        let elem = `<div class="UserInfo">\n${genRanks(user)}\n<b class="User" data-rank="${typeof(userRank) == "string" && userRank.replace(/\s/g, "") || "NONE"}">${user.Username}</b>\n</div>`;
        return elem;
    }

    list += genUser(userInfo); // TEMP

    for (const user in users) {
        if (user == userInfo.Username) continue; // Doing manully
        // i++;
        // <div id="UserInfo"><a class="Rank" data-rank="SITEADMIN">[SITE ADMIN] </a><a class="Rank" data-rank="OWNER">[OWNER] </a><a data-rank="OWNER" class="User">SiteAdmin</a></div>
        list += genUser({Username: user});
    }

    return list
}

async function getUsers() {
    let div = $("#OnlineUsers")[0]; // get div
    let users;
    await $.ajax({
        type: "get",
        url: "/api/users",
        // data: "data",
        // dataType: "dataType",
        success: function (res) {
            if (typeof(res) != "object") {
                return console.error(res);
            }
            users = res;
        }
    });

    console.log(users)
    let list = await genUserList(users);
    console.log(list);
    if (div != null) div.innerHTML = list;
}

// We want to wait for everything to load before attempting to do any of this since this script is probably at the top of body
document.addEventListener("DOMContentLoaded", async () => {
    try {
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

        getUsers();

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
            if (user.PermissionLevel > 6) rankName = rankings[6]; else if (rankName == null) rankName = "NONE";
            let userRank = rankName.toUpperCase();

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

        startChat();
    } catch (error) {
        if (typeof(error) == "object" && error.responseText) {
            alert(error.responseText)
        }
        else alert(error);
        
        console.error(error);
    }
});
