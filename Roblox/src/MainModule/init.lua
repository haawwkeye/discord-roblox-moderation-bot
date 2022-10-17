local module = {}

function module:CheckHTTP()
	local HttpsService = game:GetService("HttpService")

	local s, e = pcall(function()
		HttpsService:GetAsync("https://google.com")
	end)

	if e then
		return false
	end

	return true
end

function module:Destroy()
	script:Destroy()
end

--TODO: Make command list instead of doing require over and over

function module:Run(command, req)
	for _,v in pairs(script:GetChildren()) do
		if v.Name == command and v:IsA("ModuleScript") then
			return require(v):Run(req)
		end
	end
end

return module