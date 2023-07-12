// action that will create a comment whenever PR is opened and add labels based on file types changed

const core = require('@actions/core');
const github = require('@actions/github');

const main = async () => {
    try {
        //get inputs provided to action, store in variables

        const owner = core.getInput('owner', { required: true });
        const repo = core.getInput('repo', { required: true });
        const pr_number = core.getInput('pr_number', { required: true });
        const token = core.getInput('token', { required: true });

        //Create instance of Octokit to call GitHub restAPI endpoints
        const octokit = new github.getOctokit(token);

        //Get list of files changed in PR, store in variable
        const { data: changedFiles } = await octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: pr_number,
        });

        //Contains sum of all additions, deletions, and file changes in PR
        let diffData = {
            additions: 0,
            deletions: 0,
            changes: 0,
        };

        diffData = changedFiles.reduce((acc, file) => {
            acc.additions += file.additions;
            acc.deletions += file.deletions;
            acc.changes += file.changes;
            return acc;
        }, diffData);

        //Loop over all files changed in PR and add labels according to file types
        for (const file of changedFiles) {
            //Add labels by file types
            const fileExtension = file.filename.split('.').pop();
            switch (fileExtension) {
                case 'md':
                    await octokit.rest.issues.addLabels({
                        owner,
                        repo,
                        issue_number: pr_number,
                        labels: ['markdown'],
                    });
                case 'js':
                    await octokit.rest.issues.addLabels({
                        owner,
                        repo,
                        issue_number: pr_number,
                        labels: ['javascript'],
                    });
                case 'yml':
                    await octokit.rest.issues.addLabels({
                        owner,
                        repo,
                        issue_number: pr_number,
                        labels: ['yaml'],
                    });
                case 'yaml':
                    await octokit.rest.issues.addLabels({
                        owner,
                        repo,
                        issue_number: pr_number,
                        labels: ['yaml'],
                    });
            }
        }

        //Create a comment on the PR with the info we compiled from list of changed files
        await octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: pr_number,
            body: `
                Pull Request #${pr_number} has been updated with: \n
                - ${diffData.changes} changes \n
                - ${diffData.additions} additions \n
                - ${diffData.deletions} deletions \n
            `
        });
    } catch (error) {
        core.setFailed(error.message);
    }
}

//Call main function to run the action
main();