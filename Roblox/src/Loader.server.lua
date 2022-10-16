--# selene: allow(global_usage, unused_variable, shadowing)
local wait = task.wait;

local HttpsService = game:GetService("HttpService")
local adminSystem = require(script.Parent.MainModule)

_G.baseReplUrl = "REPL LINK HERE"
_G.getRequestEndpoint = "/get-request"
_G.verifyRequestEndpoint = "/verify-request"


if adminSystem:CheckHTTP() == false then
	warn("HttpService isn't enabled in the game, deleting core administration files")
	adminSystem:Destroy()
	script:Destroy()
	return
end

while true do
	local request

	local suc, err = pcall(function()
		request = HttpsService:GetAsync(_G.baseReplUrl .. _G.getRequestEndpoint)
	end)

	if err then
		warn("There was an error while attempting to connect to the administration webserver: " .. err)
	end

	local newRequest

	local s, e = pcall(function()
		newRequest = HttpsService:JSONDecode(request)
	end)

	if s == true then
		adminSystem:Run(newRequest.type, newRequest)
	end

	wait(5)
end
