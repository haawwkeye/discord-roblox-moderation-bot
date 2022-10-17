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
	
	local globalBanDataStore = DSS:GetDataStore("mutes")

	local userID

	local s,e = pcall(function()
		userID = players:GetUserIdFromNameAsync(request.userToCheck)
	end)

	if e then
		require(script.Parent.Components.SendResponse):Send(request, "false", e)
		return
	end

	local muteData

	local s2, e2 = pcall(function()
		muteData = globalBanDataStore:GetAsync(tostring(userID) .. "-muteData")
	end)

	if e2 then
		require(script.Parent.Components.SendResponse):Send(request, "false", e2)
		return
	end

	if muteData == nil or muteData.isMuted == false then
		require(script.Parent.Components.SendResponse):Send(request, "true", "This user isn't muted")
	else
		require(script.Parent.Components.SendResponse):Send(request, "true", "This user is muted")
	end
end

return module