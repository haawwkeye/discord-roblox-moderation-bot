--[[------------------------------------------------------------------------------
	
	Demojify: function to strip emoji-like characters from strings
	
	Written by buildthomas, 13 July 2017
	
	Provided under LGPLv3 license, meaning that if you make any improvements to
	this module, you have to open source them. You can use this code in commercial
	products. Please leave this notice intact if you use/reuse/modify this code.
	
	https://www.gnu.org/licenses/gpl-3.0.html
	
--]]------------------------------------------------------------------------------

local function lookupify(t)
	local r = {}
	for _,v in pairs(t) do
		r[v] = true
	end
	return r
end

----------------------------------------------------------------------------------

-- All emoji-like codepoint ranges in UTF8:
local blockedRanges = {
	{0x0001F601, 0x0001F64F},
	{0x00002702, 0x000027B0},
	{0x0001F680, 0x0001F6C0},
	{0x000024C2, 0x0001F251},
	{0x0001F300, 0x0001F5FF},
	{0x00002194, 0x00002199},
	{0x000023E9, 0x000023F3},
	{0x000025FB, 0x000026FD},
	{0x0001F300, 0x0001F5FF},
	{0x0001F600, 0x0001F636},
	{0x0001F681, 0x0001F6C5},
	{0x0001F30D, 0x0001F567},
}

-- Miscellaneous UTF8 codepoints that should be blocked:
local blockedSingles = lookupify {
	0x000000A9,
	0x000000AE,
	0x0000203C,
	0x00002049,
	0x000020E3,
	0x00002122,
	0x00002139,
	0x000021A9,
	0x000021AA,
	0x0000231A,
	0x0000231B,
	0x000025AA,
	0x000025AB,
	0x000025B6,
	0x000025C0,
	0x00002934,
	0x00002935,
	0x00002B05,
	0x00002B06,
	0x00002B07,
	0x00002B1B,
	0x00002B1C,
	0x00002B50,
	0x00002B55,
	0x00003030,
	0x0000303D,
	0x00003297,
	0x00003299,
	0x0001F004,
	0x0001F0CF,
}

----------------------------------------------------------------------------------

-- Demojify function:
return function(str)
	
	-- Non-emoji characters:
	local characters = {}
	
	-- Loop over characters in input:
	for _,v in utf8.codes(str) do
		
		-- Assume innocent until proven guilty:
		local insert = true
		
		-- Check if singular blocked:
		if blockedSingles[v] then
			insert = false
		else
			-- Check all ranges:
			for i,w in pairs(blockedRanges) do
				if w[1] <= v and v <= w[2] then
					-- Character is in an emoji range:
					insert = false
					break
				end
			end
		end
		
		-- Only insert into table if proven non-emoji:
		if insert then
			table.insert(characters, v)
		end
	end
	
	-- Return string without emojis:
	return utf8.char(unpack(characters))
	
end
