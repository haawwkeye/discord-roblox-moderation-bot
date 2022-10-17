local module = {}

function module:Send(req, suc, message)
	game:GetService("HttpService"):RequestAsync({
		Url = _G.baseReplUrl .. _G.verifyRequestEndpoint,
		Method = "POST",
		Headers = {
			["Content-Type"] = "application/json",
			["requestid"] = req.requestID,
			["success"] = suc,
			["message"] = message
		}
	})
end

return module