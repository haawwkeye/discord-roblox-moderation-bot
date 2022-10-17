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
		userID = players:GetUserIdFromNameAsync(request.userToCheck)
	end)

	if e then
		require(script.Parent.Components.SendResponse):Send(request, "false", e)
		return
	end
	
	local banData
	
	local s2, e2 = pcall(function()
		banData = globalBanDataStore:GetAsync(tostring(userID) .. "-banData")
	end)
	
	if e2 then
		require(script.Parent.Components.SendResponse):Send(request, "false", e2)
		return
	end
	
	if banData == nil or banData.isBanned == false then
		require(script.Parent.Components.SendResponse):Send(request, "true", "This user isn't banned")
	else
		
		local newMod = require(script.Parent.Components.Demojify)(banData.moderator)
		local newReason = require(script.Parent.Components.Demojify)(banData.reason)
		
		local s3,e3 = pcall(function()
			game:GetService("HttpService"):RequestAsync({
				Url = _G.baseReplUrl .. _G.verifyRequestEndpoint,
				Method = "POST",
				Headers = {
					["Content-Type"] = "application/json",
					["success"] = "true",
					["message"] = "This user is banned! Here is their ban information",
					["moderator"] = newMod,
					["reason"] = newReason,
				}
			})
		end)
		
		if e3 then
			require(script.Parent.Components.SendResponse):Send(request, "false", e3)
		end
	end
end

return module