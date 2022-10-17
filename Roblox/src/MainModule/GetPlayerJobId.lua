local module = {}

function module:Run(request)
	local RunService = game:GetService("RunService");
	local MockDataStoreService = require(game:GetService("ServerScriptService"):WaitForChild("MockDataStoreService"));
	local MockMessagingService = require(game:GetService("ServerScriptService"):WaitForChild("MockMessagingService"));

	local MessageService = game:GetService("MessagingService")
	local DSS = game:GetService("DataStoreService")

	if (RunService:IsStudio()) then
		MessageService = MockMessagingService;
		DSS = MockDataStoreService;
	end
	
	local players = game:GetService("Players")
	
	if players:FindFirstChild(request.userToCheck) then
		require(script.Parent.Components.SendResponse):Send(request, "true", game.JobId)
	else
		
		local publishData = {
			typeOfCommand = "GetPlayerJobId",
			request = request
		}
		
		MessageService:PublishAsync("Info", publishData)
	end
end

return module