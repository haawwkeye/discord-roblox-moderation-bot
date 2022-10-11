-- Yes this code was taken from the db visualizer I was using
-- Is this good code? idk maybe /shrug

--TODO: find out how to do a ranking system since we can add more then one game to the settings
--      Example: {"UniverseId1": 1, "UniverseId2": 2}
--      permission level will still outrank this but if you have it set to the default you should be fine
--      This would basicully replace the permission system and have a rank system instead
--      of course we can still just have an "overall" system still
--      but would be nice to have when lets say you're a studio and want to keep mods seperate
--      I also still need to look into .env tables so we can have more then one roblox open cloud key
--      This way we can define something in the settings like {"key1": {"UniverseId": "x"}} or something
--      tho idk yet this might be too big of an idea /shrug

-- AdminPanel.Users definition

CREATE TABLE `Users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `isAdmin` tinyint(1) NOT NULL DEFAULT '0',
  `permissionLevel` int NOT NULL DEFAULT '-1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;