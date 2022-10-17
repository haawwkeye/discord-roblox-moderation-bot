local module = {}

function module:Run(request)
	local players = game:GetService("Players"):GetPlayers()

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

	local status = request.isGlobal

	if status == true then
		
		for i,v in pairs(players) do
			local kickMessage = "This server is being shut down!\nModerator: " .. request.author .. "\nReason: " .. request.reason
			v:Kick(kickMessage)
		end
		
		_G.request = request

		local publishData = {
			typeOfCommand = "Shutdown",
			request = request
		}

		MessageService:PublishAsync("Info", publishData)
		require(script.Parent.Components.SendResponse):Send(request, "true", "I've successfully made all the servers shutdown")
	end

	if status == false then
		local jobID = request.jobID

		if game.JobId ~= jobID then return end

		for i,v in pairs(players) do
			local kickMessage = "This server is being shut down!\nModerator: " .. request.author .. "\nReason: " .. request.reason
			v:Kick(kickMessage)
		end

		require(script.Parent.Components.SendResponse):Send(request, "true", "I've successfully made the server with the job id supplied shutdown")
	end
end

return module