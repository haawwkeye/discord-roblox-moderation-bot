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
	
	local httpsService = game:GetService("HttpService")
	local dataStore = DSS:GetDataStore(request.dataStore)
	
	local function startsWith(str, start)
		return string.sub(str, 1, string.len(start)) == start
	end
	
	local value
	local s, e = pcall(function()
		value = dataStore:GetAsync(request.value)
	end)
	
	if e then
		require(script.Parent.Components.SendResponse):Send(request, "false", e)
		return
	end
	
	if value == nil then
		require(script.Parent.Components.SendResponse):Send(request, "true", "There's no value for the settings supplied")
		return
	end
	
	pcall(function()
		value = httpsService:JSONEncode(value)
	end)
	
	if type(value) == "string" and startsWith(value, "{") then
		value = string.sub(value, 2, string.len(value) - 1)
	end
	
	local newValue = require(script.Parent.Components.Demojify)(value)
	
	local s2,e2 = pcall(function()
		require(script.Parent.Components.SendResponse):Send(request, "true", newValue)
		return
	end)
	
	if e2 then
		require(script.Parent.Components.SendResponse):Send(request, "false", e2)
		return
	end
end

return module