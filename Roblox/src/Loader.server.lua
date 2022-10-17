local wait = task.wait;

local HttpsService = game:GetService("HttpService")
local adminSystem = require(script.Parent.MainModule)
local cooldown = 3;

_G.baseReplUrl = "http://localhost:8080"
_G.getRequestEndpoint = "/get-request"
_G.verifyRequestEndpoint = "/verify-request"


if adminSystem:CheckHTTP() == false then
	warn("HttpService isn't enabled in the game, deleting core administration files")
	adminSystem:Destroy()
	script:Destroy()
	return
end

while true do
	local cooldown_Check = (os.time() + 5);

	local suc, request = pcall(function()
		return HttpsService:GetAsync(_G.baseReplUrl .. _G.getRequestEndpoint)
	end)

	if not suc then
		warn("There was an error while attempting to connect to the administration webserver:", request)
		wait(cooldown_Check-os.time())
		continue;
	end

	warn(request)

	local s, reqs = pcall(function()
		return HttpsService:JSONDecode(request)
	end)

	if not s then wait(cooldown_Check-os.time()) continue end; -- Json Error or no request

	for _, req in pairs(reqs) do
		if (req == nil) then continue end;
		pcall(function() wait(cooldown) adminSystem:Run(req.type, req) end)
	end
	wait(cooldown_Check-os.time())
end
