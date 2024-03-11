# Contributing to this repository

## Report an Issue

If you find a bug you are welcome to report it.
We can only handle well-reported, actual bugs, so please follow the guidelines below and use forums like [StackOverflow](http://stackoverflow.com/questions/tagged/node.js) for support questions or when in doubt whether the issue is an actual bug.

Once you have familiarized with the guidelines, you can go to the [Github issue tracker](https://github.com/SAP-samples/btp-resource-consumption-monitor/issues/new) to report the issue.

### Labels and Statuses

Labels for issue categories:
 * bug: this issue is a bug in the code
 * documentation: this issue is about wrong documentation
 * enhancement: this is not a bug report, but an enhancement request

Status of open issues:
 * unconfirmed: this report needs confirmation whether it is really a bug (no label; this is the default status)
 * in progress: this issue has been triaged and is now being handled, e.g. because it looks like an actual bug
 * author action: the author is required to provide information
 * contribution welcome: this fix/enhancement is something we would like to have and you are invited to contribute it

Status/resolution of closed issues:
 * fixed: a fix for the issue was provided
 * duplicate: the issue is also reported in a different ticket and is handled there
 * invalid: for some reason or another this issue report will not be handled further (maybe lack of information or issue does not apply anymore)
 * works: not reproducible or working as expected

## Contribute Code

You are welcome to contribute code in order to fix bugs or to implement new features.

Due to legal reasons, contributors will be asked to accept a DCO when they create the first pull request to this project. This happens in an automated fashion during the submission process. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).

### How to contribute - the Process

1.  Make sure the change would be welcome (e.g. a bugfix or a useful feature); best do so by proposing it in a GitHub issue
2.  Create a branch forking the repository and do your change
3.  Commit and push your changes on that branch
    -   When you have several commits, squash them into one (see [this explanation](http://davidwalsh.name/squash-commits-git)) - this also needs to be done when additional changes are required after the code review

5.  If your change fixes an issue reported at GitHub, add the following line to the commit message:
    - ```Fixes https://github.com/SAP-samples/btp-resource-consumption-monitor/issues/(issueNumber)```
    - Do NOT add a colon after "Fixes" - this prevents automatic closing.
	- When your pull request number is known (e.g. because you enhance a pull request after a code review), you can also add the line ```Closes https://github.com/SAP-samples/btp-resource-consumption-monitor/pull/(pullRequestNumber)```
6.  Create a Pull Request to github.com/SAP-samples/btp-resource-consumption-monitor
7.  Follow the link posted by the CLA assistant to your pull request and accept the Developer Certificate of Origin, as described in detail above.
8.  Wait for our code review and approval, possibly enhancing your change on request
9.  Once the change has been approved we will inform you in a comment
10.   We will close the pull request, feel free to delete the now obsolete branch