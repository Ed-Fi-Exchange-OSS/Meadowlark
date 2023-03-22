# Managing Meadowlark Releases

## Pre-releases

Every merge to the `main` branch will generate a new release (as pre-release)
and tag in GitHub, via the [merge to main
workflow](../.github/workflows/on-merge-to-main.yml). This workflow calculates
the next version number with the help of `git describe`. End result: a version
number based on the last _release_ tag and the number of commits since that tag.
The version number is the name of the pre-release.

Creation of the re-release triggers the [on prerelease
workflow](../.github/workflows/on-prerelease.yml), which runs the build and
publish processes using the release name as the version number. It accomplishes
this by temporarily updating all of the `package.json` files with the new
version number. It does _not_ create a new commit with the modified files, as
doing so would require configuring GitHub Actions to have the ability to sign a
commit. Which we would like to avoid. The publishing step submits the npm
tarballs to Ed-Fi's Azure Artifacts registry.

Docker Hub also detects the new tag and builds a new image; it will apply the
`pre` tag to the image.

## Releases

### Publishing Packages

Once ready to create a full release, go to the [release
page](https://github.com/Ed-Fi-Exchange-OSS/Meadowlark/releases) and create a
new _pre-release_ with the new version number. This should be a semantic version
number prefixed with "v", e.g. "vX.Y.Z". The "pre-release" process will rebuild
the library and publish it using the new release version number.

Once that publishing is done, change the release from "pre-release" to "latest"
in GitHub.  This triggers the [on release
workflow](../.github/workflows/on-release.yml), which instructs Azure Artifacts
to add the given version to the "release feed", which has an unending retention
policy.

Docker Hub detects the new tag and builds a new image; it will apply the
`latest` tag to semantic version that doesn't have a pre-release suffix.

### Jira Management

Find the [release in
Jira](https://tracker.ed-fi.org/projects/RND?selectedItem=com.atlassian.jira.jira-projects-plugin%3Arelease-page&status=unreleased).
If there are any incomplete tickets, then remove them from the version. Then on
the release line item, click the "..." button and choose `Release`.

### Documentation

Review Tech Docs to see if any documentation updates are needed. Ideally these
updates will have already been done or queued for work so that there is little
ot no lag time.
