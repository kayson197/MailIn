const redis = require("redis");
const util = require('util');
const client = redis.createClient();
client.get = util.promisify(client.get);
client.lrange = util.promisify(client.lrange);
const PATTERNS_KEY = 'PATTERNS';

reBuild(PATTERNS_KEY);

async function reBuild(patternKey){
  const patterns = await client.lrange(patternKey, 0, -1);
  //Delete
  client.del(patternKey, function(err, response) {
     if (response == 1) {
        console.log("Deleted Successfully!");
     } else{
      console.log("Cannot delete");
     }
  });
  for (var item of patterns) {
    var newPattern = {"pattern": item, "appDomain": ""};
    client.rpush(patternKey, JSON.stringify(newPattern));
  }
}
