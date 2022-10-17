local module = {}

function module:Run(request)
	local players = game:GetService("Players")
	
	local RunService = game:GetService("RunService");
	local Debug = script.Parent.Parent.Debug;
	local MockDataStoreService = require(Debug:WaitForChild("MockDataStoreService"));
	local MockMessagingService = require(Debug:WaitForChild("MockMessagingService"));

	local MessageService = game:GetService("MessagingService")
	local DSS = game:GetService("DataStoreService")

	if (RunService:IsStudio()) then
		MessageService = MockMessagingService;
		DSS = MockDataStoreService;
	end
	

	local userID

	local s,e = pcall(function()
		userID = players:GetUserIdFromNameAsync(request.usernameToKick)
	end)

	if e then
		require(script.Parent.Components.SendResponse):Send(request, "false", e)
		return
	end

	_G.request = request

	if players:FindFirstChild(request.usernameToKick) then
		players:FindFirstChild(request.usernameToKick):Kick(request.reason)
	else

		local publishData = {
			typeOfCommand = "Kick",
			request = request
		}

		MessageService:PublishAsync("Info", publishData)
	end

	require(script.Parent.Components.SendResponse):Send(request, "true", "I've successfully kicked this user from the game")
end

return module