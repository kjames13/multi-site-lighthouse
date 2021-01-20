const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");
const fs = require("fs");
const CSVToJSON = require("csvtojson");

const config = JSON.parse(fs.readFileSync("config.json"));
const today = new Date().toISOString().substring(0, 10);

/********************* MAIN *********************/
var file = today + ".csv";
var folder;
var urls = [];
var updatedConfig;
var csv;

/* Parse CSV file with the list of URLs to be audited. */
CSVToJSON()
.fromFile(config.addressListPath)
.then((list) => {

    // Grab only the address from each object
	for (var i = config.start; i < config.start + config.numToAudit; i++) {
		urls.push(list[i]["Address"]);
	}

	// Update the starting index for future audits
	config.start = config.start + config.numToAudit;
    updatedConfig = JSON.stringify(config);
    fs.writeFileSync('config.json', updatedConfig);

    main(urls);
    
}).catch(err => console.log(err));

/* Main function that launches Chrome, runs lighthouse, converts the results to CSV and writes the results to a file. */
async function main(urls) {
    for (let address of urls) {
        var json = await launchChromeAndRunLighthouse(address, config);
        folder = config.writeTo;

        csv = JSONToCSV(json, address);

        if (config.cumulativeReport) {
            cumulativeWrite(file, folder, csv);
        }
        else {
            folder = await createFolder(folder, address);
            nonCumulativeWrite(folder + file, csv);
        }
    }
}

/********************* HELPERS *********************/
/*
 * Function that runs lighthouse on chrome.
 * 
 * @param url - page that lighthouse runs on
 * @param opts - options for lighthouse, chrome, and output config
 * @return the lighthouse report
 */
async function launchChromeAndRunLighthouse(url, opts, config = null) {
  const chrome = await chromeLauncher.launch({chromeFlags: opts.chromeFlags});

  console.log("Launching lighthouse for " + url);
  opts.lighthouseFlags.port = chrome.port;

  const results = await lighthouse(url, opts.lighthouseFlags, config);

  console.log("Parsing report for " + url);

  await chrome.kill();

  return results.report;
}

/* 
 * Function that converts the JSON results from the lighthouse audit to CSV that only contains the responsive image information.
 * 
 * @param json - the resultant JSON data from the lighthouse audit
 * @param address - URL address that lighthouse ran on
 * @return the formatted CSV data that only contains the responsive image information
 */
function JSONToCSV(json, address) {
	var details;
	var fields;
	var replacer;
	var csv;

	// Parse JSON and grab just the image details
	details = JSON.parse(json);
	details = details["audits"]["uses-responsive-images"]["details"].items;
	
	// If any images were improperly sized, convert image URLs to readable CSV
	if (details.length > 0) {
		fields = Object.keys(details[0]);
		replacer = function(key, value) { return value === null ? "" : value }
		csv = details.map(function(row) {
			return fields.map(function(fieldName) {
				return JSON.stringify(row[fieldName], replacer);
			}).join(",");
		});

		csv.unshift(fields.join(",")); // header column
		csv.unshift(address);
		csv = csv.join("\r\n");
	}
	else {
		csv = address + "\nImages are properly sized.\n";
	}

	console.log("Report converted to readable CSV for " + address);
	
	return csv;
}

/* 
 * Function that writes a single report with every URL's audit appended. This report is named by the current date in ISO format and
 * saved to the specified directory from the configuration file.
 *
 * Utilizes a writable stream to append to the report.
 * 
 * @param file - the file name
 * @param folder - the name of the folder
 * @param csv - the parsed and formatted csv data
 */
function cumulativeWrite(file, folder, csv) {
	var dest = folder + file;
	var stream = fs.createWriteStream(dest, {flags:"a"});
	
	console.log("Writing analysis to " + dest);

	stream.write(csv + "\r\n", (err) => {
		if (err) {
			console.log(error);
		}
		else {
			console.log("Analysis saved to " + dest + "\n");
		}
    });
    
    stream.close();
}

/*
 * Function that creates a folder for the non-cumulative report configuration.
 *
 * @param folder - the folder name
 * @param address - the URL address
 * @return the newly created folder to be written to
 */
async function createFolder(folder, address) {
	folder = folder + address.replace(/^https?:\/\//, "").replace(/[./]/g, "_") + "/";

	fs.mkdirSync(folder, { recursive: true }, (err) => {
		if (err) {
			console.log(err);
		}
	});

	console.log("Created folder " + folder);

	return folder;
}

/* 
 * Function that writes an individual report for each URL. These individual reports are stored in their own folder. The
 * folders are named by their respective URL and the individual reports in these folders are named by the current date in ISO format.
 * 
 * Utilizes a writable stream to write to the report.
 *
 * @param dest - the destination to be writted to
 * @param csv - the parsed and formatted CSV data
 */
function nonCumulativeWrite(dest, csv) {
    fs.writeFile(dest, csv + "\r\n", { flag: "a"}, (err) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Analysis saved to " + dest + "\n");
        }
    });
}