import chalk from "chalk";
import fs from "fs";
import glob from "glob";
import lineByLine from "n-readlines";
import path from "path";

const printError = (err: Error) =>
  process.stderr.write(`${chalk.red(`${err}`)}\n`);

const printWarning = (message: string) =>
  process.stderr.write(`${chalk.yellow(message)}\n`);

const printInfo = (message: string) =>
  process.stdout.write(`${chalk.blue(message)}\n`);

const parseLernaConfig = (cwd: string) => {
  const lernaConfigPath = path.join(cwd, "lerna.json");

  if (!fs.existsSync(lernaConfigPath)) {
    throw new Error("Lerna configuration file `lerna.json' does not exist");
  }

  return JSON.parse(fs.readFileSync(lernaConfigPath).toString("utf-8"));
};

const getPackageName = (absolutePackagePath: string): string => {
  const packageJsonPath = path.join(absolutePackagePath, "package.json");
  let name: string | undefined;

  if (fs.existsSync(packageJsonPath)) {
    try {
      name = JSON.parse(
        fs.readFileSync(packageJsonPath).toString("utf-8")
      ).name;
    } catch (err) {
      printError(err);
      process.exit(1);
    }
  } else {
    printWarning(`No \`package.json' found in \`${absolutePackagePath}'.`);
  }

  return name ?? "unknown package";
};

const processPackage = (
  cwd: string,
  relativePackagePath: string
): string[] | undefined => {
  const absolutePackagePath = path.join(cwd, relativePackagePath);
  const packageName = getPackageName(absolutePackagePath);
  const lcovInfoPath = path.join(absolutePackagePath, "coverage", "lcov.info");
  const result: string[] = [];

  if (!fs.existsSync(lcovInfoPath)) {
    printWarning(`No \`lcov.info' found for \`${packageName}'.`);

    return undefined;
  }

  printInfo(`Processing \`${packageName}'...`);

  const lineReader = new lineByLine(lcovInfoPath);
  let lineBuffer: Buffer | false;

  while ((lineBuffer = lineReader.next())) {
    const line = lineBuffer.toString("utf-8");
    const match = /^SF:(.+)$/.exec(line);

    if (match) {
      result.push(
        `SF:${path.posix.join(
          ...relativePackagePath.split(path.sep),
          match[1]
        )}`
      );
    } else {
      result.push(line);
    }
  }

  return result;
};

const aggregateResults = (cwd: string, results: string[][]) => {
  const outputDir = path.join(cwd, "coverage");
  const outputFile = path.join(outputDir, "lcov.info");

  printInfo(`Creating \`${outputFile}'...`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  fs.open(outputFile, "w", (err, fd) => {
    if (err) {
      printError(err);
      return;
    }

    results.forEach((lines) =>
      lines.forEach((line) => fs.writeSync(fd, `${line}\n`))
    );
    fs.closeSync(fd);
  });
};

export const run = () => {
  const cwd = process.cwd();
  const { packages } = parseLernaConfig(cwd);
  const results: string[][] = [];

  if (!packages) {
    process.stderr.write(
      `${chalk.red("No packages defined in `lerna.json'.")}\n`
    );
    process.exit(1);
  }

  packages.forEach((pattern) => {
    glob.sync(pattern, { cwd }).forEach((relativePackagePath) => {
      const result = processPackage(cwd, relativePackagePath);

      if (result) {
        results.push(result);
      }
    });
  });

  aggregateResults(cwd, results);

  process.stdout.write(`${chalk.green("Done!")}\n`);
};
