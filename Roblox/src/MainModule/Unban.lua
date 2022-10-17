local module = {}

function module:Run(request)
	local players = game:GetService("Players")
	
	local RunService = game:GetService("RunService");
	local MockDataStoreService = require(game:GetService("ServerScriptService"):WaitForChild("MockDataStoreService"));
	local MockMessagingService = require(game:GetService("ServerScriptService"):WaitForChild("MockMessagingService"));

	local MessageService = game:GetService("MessagingService")
	local DSS = game:GetService("DataStoreService")

	if (RunService:IsStudio()) then
		MessageService = MockMessagingService;
		DSS = MockDataStoreService;
	end
	
	local globalBanDataStore = DSS:GetDataStore("bans")

	local userID

	local s,e = pcall(function()
		userID = players:GetUserIdFromNameAsync(request.usernameToUnBan)
	end)

	if e then
		require(script.Parent.Components.SendResponse):Send(request, "false", e)
		return
	end

	local s2, e2 = pcall(function()
		globalBanDataStore:RemoveAsync(tostring(userID) .. "-banData")
	end)

	if e2 then
		require(script.Parent.Components.SendResponse):Send(request, "false", e2)
		return
	end

	_G.request = request

	require(script.Parent.Components.SendResponse):Send(request, "true", "I've successfully unbanned this user from the game")
end

return module