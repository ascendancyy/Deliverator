process.env.NODE_ENV = 'production';

const rimraf = require('rimraf');
const path = require('path');

const webpack = require('webpack');
const RequestShortener = require('webpack/lib/RequestShortener');
const config = require('../config/webpack.prod.js');

const ora = require('ora');
const chalk = require('chalk');

const spinner = ora({
  color: 'green',
  text: chalk`{bgGreen.black  Building } {green for ${process.env.NODE_ENV}...}`,
});

const requestShortener = new RequestShortener(process.cwd());

function getFile(e) {
  if (e.file) {
    return e.file;
  } else if (e.module && e.module.readableIdentifier && typeof e.module.readableIdentifier === 'function') {
    return e.module.readableIdentifier(requestShortener);
  }
  return undefined;
}

function getOrigin(e) {
  let origin = '';
  if (e.dependencies && e.origin) {
    origin += `\n @ ${e.origin.readableIdentifier(requestShortener)}`;
    e.dependencies.forEach((dep) => {
      if (
        !dep.loc ||
        typeof dep.loc === 'string' ||
        !dep.loc.start ||
        !dep.loc.end
      ) {
        return;
      }

      const end = dep.loc.start.line !== dep.loc.end.line ? `${dep.loc.end.line}:` : '';
      origin += ` ${dep.loc.start.line}:${dep.loc.start.column}-${end}${dep.loc.end.column}`;
    });
    let current = e.origin;
    while (current.issuer && typeof current.issuer.readableIdentifier === 'function') {
      current = current.issuer;
      origin += `\n @ ${e.origin.readableIdentifier(requestShortener)}`;
    }
  }
  return origin;
}

function removeLoaders(file) {
  if (!file) {
    return '';
  }
  const split = file.split('!');
  const filePath = split[split.length - 1];
  return `in ${filePath}`;
}

const dist = path.resolve(__dirname, '../dist');
rimraf(dist, (rimrafError) => {
  spinner.start();
  if (rimrafError) {
    spinner.fail(chalk`{bgRed.black  rimraf } ${rimrafError}\n`);
    return;
  }

  webpack(config, (webpackError, stats) => {
    if (webpackError) {
      spinner.fail(`{bgRed.black  webpack } ${webpackError.stack || webpackError}\n`);
      return;
    }

    const hasErrors = stats.hasErrors();
    const hasWarnings = stats.hasWarnings();

    if (!hasErrors && !hasWarnings) {
      spinner.succeed(chalk`{bgGreen.black  DONE } {green Build complete}\n`);
      process.stdout.write(`${stats.toString({
        colors: true,

        errors: false,
        warnings: false,

        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
      })}\n\n`);
    }

    if (hasErrors) {
      const { errors } = stats.compilation;
      spinner.fail(chalk`{bgRed.black  ERROR } {red Build failed with ${errors.length} error(s)}\n`);
      const processedErrors = errors.map((error) => {
        const processedError = {
          severity: 0,
          file: getFile(error),
          origin: getOrigin(error) || '',
        };

        if (
          error.name === 'ModuleBuildError' &&
          error.message.indexOf('SyntaxError') >= 0
        ) {
          const cleanMessage = `${error.message.replace(/^Module build failed.*:\s/, 'Syntax Error: ')}\n`;
          processedError.message = cleanMessage.replace(/^\s*at\s.*:\d+:\d+[\s)]*\n/gm, '');
        } else if (
          error.dependencies &&
          error.dependencies.length > 0 &&
          error.name === 'ModuleNotFoundError' &&
          error.message.indexOf('Module not found') === 0
        ) {
          const module = error.dependencies[0].request;
          processedError.type = error.name;
          processedError.severity = 2;
          processedError.module = module;
        } else {
          console.log(error);
          if (error.originalStack.some(stackframe => stackframe.fileName && stackframe.fileName.indexOf('eslint-loader') > 0)) {
            processedError.type = 'ESLintError';
            processedError.severity = 1;
          }

          processedError.message = error.message;
        }

        return {
          ...error,
          ...processedError,
        };
      });

      const missingModuleErrors = processedErrors.filter(error => error.type === 'ModuleNotFoundError');
      const otherErrors = processedErrors.filter(error => error.type !== 'ModuleNotFoundError');
      const sortedOtherErrors = [...otherErrors].sort((e1, e2) => {
        if (e1.severity < e2.severity) {
          return 1;
        } else if (e1.severity > e2.severity) {
          return -1;
        }

        return 0;
      });

      sortedOtherErrors.forEach(({
        type,
        file,
        message,
        origin,
      }) => {
        switch (type) {
          case 'ESLintError':
            console.log();
            break;
          default:
            console.log(chalk`{bgRed.black  error } ${removeLoaders(file)}\n${message}\n${origin}`);
        }
      });

      const modules = new Map();
      missingModuleErrors.forEach((error) => {
        const { module } = error;

        if (!modules.has(module)) {
          modules.set(module, {
            module,
            errors: [],
            isRelative: module.startsWith('./') || module.startsWith('../'),
          });
        }
        modules.get(module).errors.push(error);
      });

      console.log(chalk`{bgRed.black  error } Missing dependencies\n`);
      [...modules.values()].forEach(({ module, errors: moduleErrors }) => {
        console.log(chalk`{red ${module}} not ${module.isRelative ? 'found' : 'installed'}:`);
        moduleErrors.forEach((error) => { console.log(` found ${removeLoaders(error.file)}`); });
        process.stdout.write('\n');
      });

      return;
    }

    if (hasWarnings) {
      const { warnings } = stats.compilation;
      spinner.warn(chalk`{bgYellow.black  WARNING } {yellow Build completed with ${warnings.length} warning(s)}\n`);

      warnings.forEach((warning) => { process.stdout.write(`${warning.message}\n`); });
    }
  });
});
