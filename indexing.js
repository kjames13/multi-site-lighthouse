const fs = require("fs");
const CSVToJSON = require("csvtojson");

const configJson = JSON.parse(fs.readFileSync("config.json"));

var urls = [];
var updatedConfig;

CSVToJSON()
.fromFile(configJson.addressListPath)
.then((json) => {

    // Grab only the address from each object
    var i;
    console.log(configJson.start);
	for (i = configJson.start; i < configJson.start + configJson.numToAudit; i++) {
		urls.push(json[i]["Address"]);
	}

    console.log(urls);
    
    configJson.start = configJson.start + configJson.numToAudit;
    updatedConfig = JSON.stringify(configJson);
    fs.writeFileSync('config.json', updatedConfig);

}).catch(err => console.log(err));