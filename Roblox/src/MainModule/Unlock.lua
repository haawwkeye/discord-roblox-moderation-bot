local module = {}

function module:Run(request)
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

		_G.lockData = nil
		_G.request = request

		local publishData = {
			typeOfCommand = "Unlock",
			request = request
		}

		MessageService:PublishAsync("Info", publishData)
		require(script.Parent.Components.SendResponse):Send(request, "true", "I've successfully unlocked all the servers in the game")
	end

	if status == false then
		local jobID = request.jobID

		if game.JobId ~= jobID then return end

		_G.lockData = nil

		require(script.Parent.Components.SendResponse):Send(request, "true", "I've successfully unlocked the server with the job id supplied")
	end
end

return module