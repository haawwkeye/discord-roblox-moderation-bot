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

local TweenService = game:GetService("TweenService")
local PlayerService = game:GetService("Players")

function isEqual(table1, table2)
	if _G.request == nil then return false end
	if type(table1) ~= "table" or type(table2) ~= "table" then return false end
	if #table1 ~= #table2 then return false end
	for i,v in pairs(table1) do
		if table1[i] ~= table2[i] then return false end
	end
	return true
end

-- TODO: Redo this whole function just realized it's all if then end
--		 Instead of if then elseif then else end etc

-- TODO: Revamp this to use the modules so we can just do commandList[commandName](args) etc

MessageService:SubscribeAsync("Info", function(res)
	local typeOfCommand = res.Data.typeOfCommand
	local data = res.Data.request

	if typeOfCommand == "Announcement" then
		if isEqual(_G.request, data) == true then return end
		-- TODO: Redo Announcement stuff (Tweens shouldn't be done on the server)
		local info = TweenInfo.new(
			3,
			Enum.EasingStyle.Linear,
			Enum.EasingDirection.Out,
			0,
			false,
			0
		)

		for _,v in pairs(PlayerService:GetPlayers()) do
			local clone = script.Parent["Announcement GUI"]:Clone()

			local mainTween = TweenService:Create(clone.Main, info, {BackgroundTransparency = 0})
			local dividerTween = TweenService:Create(clone.Main.Divider, info, {BackgroundTransparency = 0})
			local closeTween = TweenService:Create(clone.Main.Close, info, {BackgroundTransparency = 0, TextTransparency = 0})
			local authorTween = TweenService:Create(clone.Main.Author, info, {TextTransparency = 0})
			local titleTween = TweenService:Create(clone.Main.Title, info, {BackgroundTransparency = 0, TextTransparency = 0})
			local descriptionTween = TweenService:Create(clone.Main.Description, info, {BackgroundTransparency = 0, TextTransparency = 0})

			clone.Parent = v.PlayerGui
			clone.Main.Author.Text = "Announcement By: " .. data.author
			clone.Main.Title.Text = data.title
			clone.Main.Description.Text = data.description

			authorTween:Play()
			titleTween:Play()
			descriptionTween:Play()
			dividerTween:Play()
			mainTween:Play()
			closeTween:Play()
		end

		_G.request = data
	end

	if typeOfCommand == "Ban" then
		if PlayerService:FindFirstChild(data.usernameToBan) then
			PlayerService:FindFirstChild(data.usernameToBan):Kick()
		end
	end

	if typeOfCommand == "Eval" then
		local method = require(script.Parent.Loadstring)

		if _G.request == data then return end

		pcall(function()
			method(data)()
		end)

	end

	if typeOfCommand == "Kick" then
		if PlayerService:FindFirstChild(data.usernameToKick) then
			PlayerService:FindFirstChild(data.usernameToKick):Kick(data.reason)
		end
	end

	if typeOfCommand == "Lockdown" then
		local newLockData = {
			isLocked = true,
			moderator = data.author,
			reason = data.reason
		}

		_G.lockData = newLockData
	end

	if typeOfCommand == "Mute" then
		local chatService = require(game:GetService("ServerScriptService"):WaitForChild("ChatServiceRunner"):WaitForChild("ChatService"))
		local channel = chatService:GetChannel("All")

		if PlayerService:FindFirstChild(data.usernameToMute) then
			channel:MuteSpeaker(data.usernameToMute)
		end
	end

	if typeOfCommand == "Shutdown" then
		for i,v in pairs(PlayerService:GetPlayers()) do
			local kickMessage = "This server is being shut down!\nModerator: " .. data.author .. "\nReason: " .. data.reason
			v:Kick(kickMessage)
		end
	end

	if typeOfCommand == "Unlock" then
		_G.lockData = nil
	end

	if typeOfCommand == "Unmute" then
		local chatService = require(game:GetService("ServerScriptService"):WaitForChild("ChatServiceRunner"):WaitForChild("ChatService"))
		local channel = chatService:GetChannel("All")

		if PlayerService:FindFirstChild(data.usernameToUnMute) then
			channel:UnmuteSpeaker(data.usernameToUnMute)
		end
	end

	if typeOfCommand == "GetPlayerJobId" then
		if PlayerService:FindFirstChild(data.userToCheck) then
			require(script.Parent.SendResponse):Send("true", game.JobId)
		end
	end
end)