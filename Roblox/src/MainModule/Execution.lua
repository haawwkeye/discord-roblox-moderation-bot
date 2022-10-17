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
	
	local method = require(script.Parent.Components.Loadstring)
	
	local status = request.isGlobal
	
	if status == true then
		pcall(function()
			method(request.code)()
		end)
		
		local publishData = {
			typeOfCommand = "Eval",
			request = request.code
		}
		
		_G.request = request.code
		MessageService:PublishAsync("Info", publishData)
		require(script.Parent.Components.SendResponse):Send(request, "true", "I've successfully executed this code to the game")
	end
	
	if status == false then
		local jobID = request.jobID
		
		if game.JobId ~= jobID then return end
		
		local s, e = pcall(function()
			method(request.code)()
		end)
		
		if e then
			require(script.Parent.Components.SendResponse):Send(request, "false", e)
			return
		end
		
		require(script.Parent.Components.SendResponse):Send(request, "true", "I've successfully executed this code to the game")
	end
end

return module