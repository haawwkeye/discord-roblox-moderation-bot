local wait = task.wait;

function InstanceNew(class, parent)
    local child = Instance.new(class);
    if (parent) then child.Parent = parent end;
    return child;
end

local module = {}

--warn("Mock Messaging Service in use...")

-- Github doesn't really like empty folders so kinda have to add this just incase
if script:FindFirstChild("Topics") == nil then InstanceNew("Folder", "Topics") end;

local Topics = script.Topics:GetChildren();

script.Topics.ChildAdded:Connect(function()
	Topics = script.Topics:GetChildren()
end)

script.Topics.ChildRemoved:Connect(function()
	Topics = script.Topics:GetChildren()
end)

function module:SubscribeAsync(topic : string, callback : any): RBXScriptConnection
	if Topics[topic] then return Topics[topic] end

	local evnt = InstanceNew("BindableEvent", script.Topics)
	Topics[topic] = evnt;

	return callback and evnt.Event:Connect(callback) or nil
end

function module:PublishAsync(topic : string, message : any)
	warn(topic, message)

	Topics[topic]:Fire({Data = message, Sent = tick()})
end

return module
