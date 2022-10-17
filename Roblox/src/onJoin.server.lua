local wait = task.wait;

local RunService = game:GetService("RunService");
local Debug = script.Parent.Debug;
local MockDataStoreService = require(Debug:WaitForChild("MockDataStoreService"));
local MockMessagingService = require(Debug:WaitForChild("MockMessagingService"));

local MessageService = game:GetService("MessagingService")
local DSS = game:GetService("DataStoreService")

if (RunService:IsStudio()) then
	MessageService = MockMessagingService;
	DSS = MockDataStoreService;
end

local playerService = game:GetService("Players")

-- TODO: Use one DataStore for data instead of two?
-- Example: DATA[uid] = {BanData, MuteData} etc

local globalBanDataStore = DSS:GetDataStore("bans")
local globalMuteDataStore = DSS:GetDataStore("mutes")

function plrAdded(plr)
	-- Server Locked

	local lockData = _G.lockData

	if lockData == nil then
		lockData = {
			isLocked = false
		}
	end

	if lockData.isLocked == true then
		local lockMessage = "This server is locked!\nModerator: " .. lockData.moderator .. "\nReason: " .. lockData.reason
		return plr:Kick(lockMessage);
	end

	-- Ban Data

	local userID = tostring(plr.UserId)
	local dataStoreKey = userID .. "-banData"

	local banData

	local s,e = pcall(function()
		banData = globalBanDataStore:GetAsync(dataStoreKey)
	end)

	if e then
		return plr:Kick("Couldn't load data, please rejoin")
	end

	if banData == nil then
		banData = {
			isBanned = false
		}
	end

	if banData.isBanned == true then
		local banMessage = "You are banned from this game\nModerator: " .. banData.moderator .. "\nReason: " .. banData.reason
		return plr:Kick(banMessage)
	end

	-- Mute Data

	local userID = tostring(plr.UserId)
	local dataStoreKey = userID .. "-muteData"

	local muteData

	local s,e = pcall(function()
		muteData = globalMuteDataStore:GetAsync(dataStoreKey)
	end)

	if e then
		return plr:Kick("Couldn't load data, please rejoin")
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
end

for _, plr in pairs(game:GetService("Players"):GetPlayers()) do
	plrAdded(plr);
end

playerService.PlayerAdded:Connect(plrAdded);
