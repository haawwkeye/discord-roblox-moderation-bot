const fs = require("fs");
const path = require("path");

if (!fs.existsSync(path.join(__dirname, ".env")))
{
    fs.readFileSync(path.join(__dirname, "example.env"));
    fs.writeFileSync()
}