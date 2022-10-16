local wait = task.wait;

local DataStore = {}
DataStore.__index = DataStore;

DataStore.Store = {};

function DataStore:GetAsync(key)
	return self.Store[key];
end

function DataStore:SetAsync(key, value)
	self.Store[key] = value;
	return self.Store[key];
end

function DataStore.new()
	return setmetatable({new = nil}, DataStore);
end

local DataStores = {}
local module = {}

function module:GetDataStore(dataStoreName)
	local datastore = DataStores[dataStoreName];
	if datastore == nil then datastore = DataStore.new() end;
	return datastore;
end

return module
