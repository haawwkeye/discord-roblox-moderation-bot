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
		userID = players:GetUserIdFromNameAsync(request.usernameToBan)
	end)
	
	if e then
		require(script.Parent.Components.SendResponse):Send(request, "false", e)
		return
	end
	
	local newBanData = {
		isBanned = true,
		reason = request.reason,
		moderator = request.author
	}
	
	local s2, e2 = pcall(function()
		globalBanDataStore:SetAsync(tostring(userID) .. "-banData", newBanData)
	end)
	
	if e2 then
		require(script.Parent.Components.SendResponse):Send(request, "false", e2)
		return
	end
	
	_G.request = request
	
	if players:FindFirstChild(request.usernameToBan) then
		players:FindFirstChild(request.usernameToBan):Kick()
	else
		
		local publishData = {
			typeOfCommand = "Ban",
			request = request
		}
		
		MessageService:PublishAsync("Info", publishData)
	end
	
	require(script.Parent.Components.SendResponse):Send(request, "true", "I've successfully banned this user from the game")
end

return module