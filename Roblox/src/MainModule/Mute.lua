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
	
	
	local chatService = require(game:GetService("ServerScriptService"):WaitForChild("ChatServiceRunner"):WaitForChild("ChatService"))
	
	local globalMuteDataStore = DSS:GetDataStore("mutes")
	local channel = chatService:GetChannel("All")
	
	local userID

	local s,e = pcall(function()
		userID = players:GetUserIdFromNameAsync(request.usernameToMute)
	end)

	if e then
		require(script.Parent.Components.SendResponse):Send(request, "false", e)
		return
	end
	
	local newMuteData = {
		isMuted = true
	}
	
	local s2, e2 = pcall(function()
		globalMuteDataStore:SetAsync(tostring(userID) .. "-muteData", newMuteData)
	end)

	if e2 then
		require(script.Parent.Components.SendResponse):Send(request, "false", e2)
		return
	end
	
	_G.request = request
	
	print(players:FindFirstChild(request.usernameToMute))
	
	if players:FindFirstChild(request.usernameToMute) then
		channel:MuteSpeaker(request.usernameToMute)
	else

		local publishData = {
			typeOfCommand = "Mute",
			request = request
		}

		MessageService:PublishAsync("Info", publishData)
	end

	require(script.Parent.Components.SendResponse):Send(request, "true", "I've successfully muted this user from the game's chat")
end

return module