# LCOV code coverage aggregator for Lerna monorepos

Utility which combines [LCOV] test coverage reports from multiple NPM packages
inside an [Lerna] monorepo into single file, which can be submitted to code
coverage services such as [Coveralls].

[lcov]: http://ltp.sourceforge.net/coverage/lcov.php
[lerna]: https://lerna.js.org
[coveralls]: https://coveralls.io

## Installation

```sh
$ npm install --save-dev lerna-lcov-aggregate
```

## Usage

The package provides an executable called `lerna-lcov-aggregate`. When it's run
at the root directory of Lerna monorepo, it will go through all the packages
defined in `lerna.json` configuration file and collect all `coverage/lcov.info`
files from them. It will then combine them into single file (with some
modifications done with file paths in the `lcov.info` files) and create a
single coverage report file `coverage/lcov.info` at the root directory of the
repository. This file can then be submitted to an coverage service or tool
that processes LCOV files.
