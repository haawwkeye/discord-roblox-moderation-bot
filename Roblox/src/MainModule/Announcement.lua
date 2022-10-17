local module = {}

function module:Run(request)
	local players = game:GetService("Players"):GetPlayers()
	local TweenService = game:GetService("TweenService")
	
	local RunService = game:GetService("RunService");
	local MockDataStoreService = require(game:GetService("ServerScriptService"):WaitForChild("MockDataStoreService"));
	local MockMessagingService = require(game:GetService("ServerScriptService"):WaitForChild("MockMessagingService"));

	local MessageService = game:GetService("MessagingService")
	local DSS = game:GetService("DataStoreService")

	if (RunService:IsStudio()) then
		MessageService = MockMessagingService;
		DSS = MockDataStoreService;
	end
	
	local info = TweenInfo.new(
		3,
		Enum.EasingStyle.Linear,
		Enum.EasingDirection.Out,
		0,
		false,
		0
	)
	
	for _,v in pairs(players) do
		local clone = script.Parent.Components["Announcement GUI"]:Clone()
		
		local mainTween = TweenService:Create(clone.Main, info, {BackgroundTransparency = 0})
		local dividerTween = TweenService:Create(clone.Main.Divider, info, {BackgroundTransparency = 0})
		local closeTween = TweenService:Create(clone.Main.Close, info, {BackgroundTransparency = 0, TextTransparency = 0})
		local authorTween = TweenService:Create(clone.Main.Author, info, {TextTransparency = 0})
		local titleTween = TweenService:Create(clone.Main.Title, info, {BackgroundTransparency = 0, TextTransparency = 0})
		local descriptionTween = TweenService:Create(clone.Main.Description, info, {BackgroundTransparency = 0, TextTransparency = 0})
		
		clone.Parent = v.PlayerGui
		clone.Main.Author.Text = "Announcement By: " .. request.author
		clone.Main.Title.Text = request.title
		clone.Main.Description.Text = request.description
		
		authorTween:Play()
		titleTween:Play()
		descriptionTween:Play()
		dividerTween:Play()
		mainTween:Play()
		closeTween:Play()
	end
	
	_G.request = request
	
	local publishData = {
		typeOfCommand = "Announcement",
		request = request
	}
	
	MessageService:PublishAsync("Info", publishData)
	
	require(script.Parent.Components.SendResponse):Send(request, "true", "I've successfully announced this to the game")
end

return module