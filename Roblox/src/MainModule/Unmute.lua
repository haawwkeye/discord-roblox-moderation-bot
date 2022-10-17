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

	local chatService = require(game:GetService("ServerScriptService"):WaitForChild("ChatServiceRunner"):WaitForChild("ChatService"))

	local globalMuteDataStore = DSS:GetDataStore("mutes")
	local channel = chatService:GetChannel("All")

	local userID

	local s,e = pcall(function()
		userID = players:GetUserIdFromNameAsync(request.usernameToUnMute)
	end)

	if e then
		require(script.Parent.Components.SendResponse):Send(request, "false", e)
		return
	end

	local s2, e2 = pcall(function()
		globalMuteDataStore:RemoveAsync(tostring(userID) .. "-muteData")
	end)

	if e2 then
		require(script.Parent.Components.SendResponse):Send(request, "false", e2)
		return
	end

	_G.request = request

	if players:FindFirstChild(request.usernameToUnMute) then
		channel:UnmuteSpeaker(request.usernameToUnMute)
	else

		local publishData = {
			typeOfCommand = "Unmute",
			request = request
		}

		MessageService:PublishAsync("Info", publishData)
	end

	require(script.Parent.Components.SendResponse):Send(request, "true", "I've successfully unmuted this user from the game's chat")
end

return module