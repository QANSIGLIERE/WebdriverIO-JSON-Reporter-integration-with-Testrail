var { TestRail_API } = require('qansigliere-testrail-api-integration');
const fs = require('fs');
const path = require('path');
var { createFileFromString } = require('qansigliere-fs-utils');

function extractTestCaseIDs(fullTitle) {
    return Array.from(fullTitle.matchAll(/C\d+/g), m => m[0]);
}

function parseJSONReporterFolder(pathToFolder) {
    let files = fs.readdirSync(__dirname + pathToFolder).filter(function (file) {
        return path.extname(file) == '.json';
    });
    let results = [];

    for (let jsonFile of files) {
        let data = require(__dirname + pathToFolder + jsonFile);

        for (let suite of data.suites) {
            for (let testCase of suite.tests) {
                for (let testCaseResult of extractTestCaseIDs(testCase.name)) {
                    results.push({
                        id: testCaseResult.replace('C', ''),
                        state: testCase.state,
                        err: testCase.error ? testCase.error.stack : '',
                    });
                }
            }
        }
    }

    return results;
}

function parseJSONReporterFolderAndGenerateCSVFile(pathToFolder) {
    let files = fs.readdirSync(__dirname + pathToFolder).filter(function (file) {
        return path.extname(file) == '.json';
    });

    let csvReport = 'SPEC FILE; TEST CASE ID; STATUS; ERROR MESSAGE;\n';

    for (let jsonFile of files) {
        let data = require(__dirname + pathToFolder + jsonFile);

        let newLine = `${data.specs};;;;\n`;
        for (let suite of data.suites) {
            for (let testCase of suite.tests) {
                for (let testCaseResult of extractTestCaseIDs(testCase.name)) {
                    csvReport += `${data.specs};${testCaseResult.replace('C', '')};${testCase.state};${JSON.stringify(
                        testCase.error ? testCase.error.stack : '',
                    )};\n`;
                }
            }
        }
        csvReport += newLine;
    }

    return createFileFromString(__dirname + pathToFolder + '/results.csv', csvReport);
}

async function syncResultsToTestrail(reportResults, url, username, apiKey, projectID, suiteID, testRunID, testRunName) {
    let testrailAPI = new TestRail_API(url, username, apiKey);

    let runID;

    if (testRunID) {
        runID = testRunID;
    } else {
        let newTestRun = await testrailAPI.add_run(projectID, {
            suite_id: suiteID,
            name: testRunName ? testRunName : new Date().toISOString(),
            include_all: false,
            case_ids: [],
        });

        runID = newTestRun.id;
    }

    // Get information about existing test cases inside of the testrun
    let testRunTests = await testrailAPI.get_tests(runID);

    // Collect included test cases
    let testCaseArray = testRunTests.map(x => x.case_id);

    // Update the test run
    await testrailAPI.update_run(runID, {
        include_all: false,
        case_ids: [...testCaseArray, ...reportResults.map(x => x.id)],
    });

    // Get tests from the updated run
    testRunTests = await testrailAPI.get_tests(runID);

    // Generate results file
    let resultsJSON = [];

    for (let testCaseResult of reportResults) {
        resultsJSON.push({
            test_id: testRunTests.filter(x => x.case_id == testCaseResult.id)[0].id,
            status_id: testCaseResult.state == 'passed' ? 1 : 5,
            comment: testCaseResult.err,
        });
    }

    console.log(
        JSON.stringify(
            await testrailAPI.add_results(runID, {
                results: resultsJSON,
            }),
        ),
    );
}

async function parseJSONReporterAndSyncResultsToTestrail(
    pathToFolderWithJSONResults,
    url,
    username,
    apiKey,
    projectID,
    suiteID,
    testRunID,
    testRunName,
) {
    if (pathToFolderWithJSONResults && url && username && apiKey && projectID && suiteID) {
        // Parse Mochawesome report
        let reportResults = parseJSONReporterFolder(pathToFolderWithJSONResults);

        // Testrail Integration
        await syncResultsToTestrail(reportResults, url, username, apiKey, projectID, suiteID, testRunID, testRunName);
    } else {
        console.log(`
One of the following parameters is missing:
Path to the folder with JSON results: ${pathToFolderWithJSONResults}
URL: ${url}
Username: ${username}
API Key: ${apiKey}
Project ID: ${projectID}
Suite ID: ${suiteID}`);
    }
}

module.exports.parseJSONReporterFolderAndGenerateCSVFile = parseJSONReporterFolderAndGenerateCSVFile;
module.exports.parseJSONReporterAndSyncResultsToTestrail = parseJSONReporterAndSyncResultsToTestrail;
