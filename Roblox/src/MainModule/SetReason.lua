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
	
	local globalBanDataStore = DSS:GetDataStore("bans")
	
	local userID

	local s,e = pcall(function()
		userID = players:GetUserIdFromNameAsync(request.userBanned)
	end)

	if e then
		require(script.Parent.Components.SendResponse):Send(request, "false", e)
		return
	end
	
	local banData
	
	local s2,e2 = pcall(function()
		banData = globalBanDataStore:GetAsync(tostring(userID) .. "-banData")
	end)
	
	if e2 then
		require(script.Parent.Components.SendResponse):Send(request, "false", e2)
		return
	end
	
	if banData == nil then
		banData = {
			isBanned = false
		}
	end
	
	if banData.isBanned == false then
		require(script.Parent.Components.SendResponse):Send(request, "false", "This user isn't banned")
	end
	
	banData.reason = request.newReason
	
	
	local s3, e3 = pcall(function()
		globalBanDataStore:SetAsync(tostring(userID) .. "-banData", banData)
	end)

	if e3 then
		require(script.Parent.Components.SendResponse):Send(request, "false", e3)
		return
	end
	
	require(script.Parent.Components.SendResponse):Send(request, "true", "I have successfully updated this user's ban reason")
end

return module