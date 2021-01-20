# lighthouse-scaled-images-checker

Uses Google's lighthouse (https://github.com/GoogleChrome/lighthouse) to build a set of reports from the URL list you pass into the configuration file. The current configuration reports only images that are not properly sized.

It's a Node.JS script, so you need Node / NPM installed on your machine.

# Setup

After cloning the repo, run 

`npm install`

to install the dependencies.

In `config.json`, edit the following fields:

| Field | Example | Description |
|-------|---------|-------------|
| `addressListPath` | `"./www-pages-10-08-2020.csv"` | Path to a CSV file that contains the list of URL addresses to be audited. |
| `lighthouseFlags` | `{"output": "csv", "disableDeviceEmulation": true, "onlyAudits": ["uses-responsive-images"]}` | List of flags to pass to lighthouse. Full list available here: https://github.com/GoogleChrome/lighthouse/blob/8f500e00243e07ef0a80b39334bedcc8ddc8d3d0/typings/externs.d.ts#L52 |
| `chromeFlags` | `["--headless"]` | List of flags to pass to the Chrome launcher. Full list available here: https://peter.sh/experiments/chromium-command-line-switches/ |
| `writeTo` | `"results/"` | The path where to write the reports - the tool will create the path if it doesn't exist. Remember the trailing slash in the end. |
| `cumulativeReport` | `false` | If `true`, generates a single report with every URL's audit appended. This report is named by the current date in ISO format. If `false`, generates an individual report for each URL. These individual reports are stored in their own folder. The folders are named by their respective URL and the individual reports in these folders are named by the current date in ISO format. |
| `start` | `0` | The starting index of the list of URLs to be audited. |
| `numToAudit` | `20` | The number of URLs to be audited. For example, this configuration would run lighthouse for URLs indexed 0 to 19 from the list. The script will automatically update the configuration so that the next run will start at index 20. |

# Run

Once you've set it up, you can run the audit tool with

`node script.js`

The process will be logged into the console. 

The reports will be written to a CSV file in the `cumulativeReport` format and in the `writeTo` destination you specified in the configuration file.
