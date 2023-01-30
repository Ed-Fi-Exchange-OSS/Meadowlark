# Contributing to the Meadowlark Project <!-- omit in toc -->

You are here, so presumably you are thinking about making contributions to this
project. Thank you! You are on the first step to being a member of our open
source project.

Are you already a registered member of the Ed-Fi community? If not, please read
our [Code of Conduct](https://techdocs.ed-fi.org/x/44BmAQ), and consider joining
the community by [creating an Ed-Fi account
today](https://www.ed-fi.org/create-an-account/). Pull requests from
recognizable community members will receive priority.

This guide will give you an overview of the contribution workflow, including use
of Ed-Fi Tracker for issue management, creating a pull request, reviewing code,
and merging the pull request.

## New Contributor Guide

Please read the project [README](../README.md) for an overview of the project.
The Ed-Fi Alliance manages all of its source code using
[Git](https://docs.github.com/en/get-started/quickstart/set-up-git), shared via
[GitHub](https://github.com). Outside contributors should use the Forking
Workflow. We use pull requests for reviewing and collaborating on proposed code
changes; all pull requests will be reviewed by one or more member of the
project's core development team.

## Getting Started

💡 Please see Ed-Fi's [Code Contribution
Guidelines](https://techdocs.ed-fi.org/x/uYGu) for a detailed overview. Below is
a TL;DR version.

### Issue Management

All pull requests must be associated with a ticket in [Ed-Fi
Tracker](https://tracker.ed-fi.org). If you are not a member of the Ed-Fi
Community, please consider signing up. Otherwise, the development team will have
to create the ticket for you, and the pull request will likely be seen as a low
priority.

### Pull Request Requirements

Create pull requests from a branch in your own
[fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo) - only
core development team members are granted write access.

All code contributions require [signed commits](https://techdocs.ed-fi.org/x/1AXDB).

The first time you submit a pull request, you will be required to review and
accept the [Ed-Fi Individual Contributors License
Agreement](https://gist.github.com/EdFiBuildAgent/d68fa602d07505c3682e8258b7dc6fbc).
We track acceptance via a git signature; using a signed signature helps prove
the identity of the person submitting the code commit.

Make sure that all checks and test are passing.

On your first commit, please give yourself credit by editing the
[CONTRIBUTORS](../CONTRIBUTORS.md) file.

### Release Management

For the most part, the Ed-Fi Alliance releases any given software product only a
few times per year. We attempt to maintain the `main` branch of code in a
release-able state at all times. However, in general our community has asked us
to keep the frequency of updates low. Except in the case of critical bug fixes
or security patches, your contribution will not be published in a binary package
until the [next scheduled release](https://techdocs.ed-fi.org/x/TYWtBQ).
