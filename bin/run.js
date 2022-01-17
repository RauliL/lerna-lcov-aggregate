#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

require(path.join(path.dirname(fs.realpathSync(__filename)), "..", "lib"))
  .run();
