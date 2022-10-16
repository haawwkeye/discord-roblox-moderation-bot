--# selene: allow(global_usage, unused_variable, shadowing)
local dataStoreService = game:GetService("DataStoreService")
local playerService = game:GetService("Players")

local globalBanDataStore = dataStoreService:GetDataStore("bans")
local globalMuteDataStore = dataStoreService:GetDataStore("mutes")

playerService.PlayerAdded:Connect(function(plr)
	local userID = tostring(plr.UserId)
	local dataStoreKey = userID .. "-banData"
	
	local banData
	
	local s,e = pcall(function()
		banData = globalBanDataStore:GetAsync(dataStoreKey)
	end)
	
	if e then
		plr:Kick("Couldn't load data, please rejoin")
	end
	
	if banData == nil then
		banData = {
			isBanned = false
		}
	end
	
	if banData.isBanned == true then
		local banMessage = "You are banned from this game\nModerator: " .. banData.moderator .. "\nReason: " .. banData.reason
		plr:Kick(banMessage)
	end
end)

playerService.PlayerAdded:Connect(function(plr)
	local lockData = _G.lockData
	
	if lockData == nil then
		lockData = {
			isLocked = false
		}
	end
	
	if lockData.isLocked == true then
		local lockMessage = "This server is locked!\nModerator: " .. lockData.moderator .. "\nReason: " .. lockData.reason
		plr:Kick(lockMessage)
	end
end)

playerService.PlayerAdded:Connect(function(plr)
	local userID = tostring(plr.UserId)
	local dataStoreKey = userID .. "-muteData"
	
	local muteData

	local s,e = pcall(function()
		muteData = globalMuteDataStore:GetAsync(dataStoreKey)
	end)
	
	if e then
		plr:Kick("Couldn't load data, please rejoin")
	end
	
	if muteData == nil then
		muteData = {
			isMuted = false
		}
	end
	
	local chatService = require(game:GetService("ServerScriptService"):WaitForChild("ChatServiceRunner"):WaitForChild("ChatService"))
	local channel = chatService:GetChannel("All")
	
	if muteData.isMuted == true then
		local suc = false
		repeat
			wait()
			local s,e = pcall(function()
				channel:MuteSpeaker(plr.Name)
			end)
			
			if s then
				suc = true
			end
			wait()
		until suc == true
	end
end)
