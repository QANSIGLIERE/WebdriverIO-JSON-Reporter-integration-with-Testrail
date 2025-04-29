# WebdriverIO-JSON-Reporter-integration-with-Testrail

The main idea of ​​this library created in the JavaScript language is to provide a better way to synchronize
JSON-Reporter results with Testrail.

## Author

https://www.youtube.com/@QANSIGLIERE/

## Support the project

https://buymeacoffee.com/qansigliere

## Installation

Using npm `npm i qansigliere-json-reporter-integration-with-testrail`

## Requirements

To make the library works well, You need to complete the following steps:

1. Each test case should have at least one test case ID inside of the description and follow to the pattern like
   CXXXXXX, example:

`it("C1418 - Change Item Coursing", async () => {`

or

`it("C1419, C34, C565 - Change Item Coursing", async () => {`

2. You should have API keys for the testrail API integration
3. You need to know the project id and suite id values

## How to use it

Example:

```
let { parseJSONReporterAndSyncResultsToTestrail } = require('qansigliere-json-reporter-integration-with-testrail');

(async function Integration() {
    await parseJSONReporterAndSyncResultsToTestrail(
        '/../json-reporter-results/', // path to the folder with results
        'syncer.testrail.io', // testrail url
        'demo@gmail.com', // testrail username
        'L.WAa1j0Pb6s.D9u676J-/j6TYWBS5wIArzS5j1No', // testrail api key
        1, // project id
        1, // suite id
        null, // test run id or null
        'Demo Test Run', // test run name
    );
})();
```

## Related Videos

-   https://www.youtube.com/live/_HgPUsy8Ons?si=EOJbdfr32weeC7Wl

## Improvements & Suggestions

https://forms.gle/GZbS9hw42tSYJxKL7
