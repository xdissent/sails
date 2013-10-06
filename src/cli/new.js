var Sails = require('../'),
  path = require('path'),
  fs = require('fs-extra'),
  wrench = require('wrench'),
  _ = require('lodash'),
  ejs = require('ejs'),
  pkg = require('../../package.json');

module.exports = function (program) {
  program
    .command('new [path]')
    .description('Create a new Sails app')
    .option('-c, --coffee', 'Use CoffeeScript boilerplate')
    .option('-t, --template <engine>', 'Set template engine (ejs|jade|hbs|haml)', 'ejs')
    .option('-l, --linker', 'Enable asset linker')
    .option('-I, --no-npm-install', 'Do not install NPM dependencies')
    .action(function (dest, opts) {

      dest = path.resolve(dest || '.');
      var name = path.basename(dest);

      if (!fs.existsSync(dest)) fs.mkdirsSync(dest);
      if (!isDir(dest)) throw new Error(dest + ' exists and is not a directory');

      var sails = new Sails({
        hooks: [],
        environment: program.environment,
        appPath: dest,
        log: {level: program.verbose ? 'verbose' : undefined}
      });

      sails.log.info('Building new Sails app in ' + dest + '...');

      var ext = (opts.coffee ? 'coffee' : 'js'),
        common = path.resolve(__dirname, '../../bin/boilerplates/common'),
        boilerplates = path.resolve(common, '..', ext);

      sails.log.verbose('Generating ' + (opts.linker ? 'linker' : '') + ' assets...');
      copy((opts.linker ? 'linkerAssets' : 'assets'), 'assets');
      
      sails.log.verbose('Generating api...');
      copy('api');

      sails.log.verbose('Generating config...');
      copy('config', function () {
        sails.log.verbose('Generating session config...');
        render('config/session.' + ext, {secret: 'keyboard cat'});

        sails.log.verbose('Generating views config...');
        render('config/views.' + ext, {
          engine: opts.template,
          layout: _.contains(['jade', 'haml'], opts.template) ? false : '\'layout\''
        });
      });

      sails.log.verbose('Generating views...');
      copy('views/' + opts.template, 'views');

      if (opts.linker) {
        sails.log.verbose('Generating linker layout...');
        copy('linkerLayouts/' + opts.template + '/layout.' + opts.template, 'views/layout.' + opts.template);

        if (opts.template !== 'ejs') {
          sails.log.warn('Automatic asset linking is not implemented for the `' + options.template + '` view ' +
            'engine at this time. You must modify the Gruntfile yourself for this feature to work.');
        }
      }

      sails.log.verbose('Generating app...');
      copy('app.' + ext);

      sails.log.verbose('Generating gitignore...');
      copy('gitignore', '.gitignore');

      sails.log.verbose('Generating Gruntfile...');
      copy('Gruntfile.' + ext);

      sails.log.verbose('Generating package.json...');
      copy('package.json', function () {
        render('package.json', {name: name, version: pkg.version});
      });

      sails.log.verbose('Generating README.md...');
      fs.writeFileSync(path.join(dest, 'README.md'), '# ' + name + '\n### a Sails application');

      setTimeout(function () {
        sails.log.info('New app created!');
        process.exit();
      }, 100);


      function isDir (file) {
        if (!fs.existsSync(file)) return false;
        return fs.statSync(file).isDirectory();
      }

      function render (file, data) {
        var fullPath = path.join(dest, file),
          contents = fs.readFileSync(fullPath, 'utf8'),
          rendered = ejs.render(contents, data);
        fs.writeFileSync(fullPath, rendered, 'utf8');
      }

      function copy (origFile, newFile, cb) {
        if (typeof newFile === 'function') {
          cb = newFile;
          newFile = null;
        }
        newFile = newFile || origFile;

        var commonPath = path.join(common, origFile),
          boilerplatesPath = path.join(boilerplates, origFile),
          files = [], newFiles = [];

        if (!isDir(commonPath) && !isDir(boilerplatesPath)) {
          files.push(origFile);
          newFiles.push(newFile);
        } else {
          var commonFiles = fs.existsSync(commonPath) ? wrench.readdirSyncRecursive(commonPath) : [],
            boilerplatesFiles = fs.existsSync(boilerplatesPath) ? wrench.readdirSyncRecursive(boilerplatesPath) : [];
          commonFiles = _.filter(commonFiles, function (file) {
            return !isDir(path.join(commonPath, file));
          });
          boilerplatesFiles = _.filter(boilerplatesFiles, function (file) {
            return !isDir(path.join(boilerplatesPath, file));
          });
          _.each(_.unique([].concat(commonFiles, boilerplatesFiles)), function (file) {
            if (!isDir(path.join(origFile, file))) {
              files.push(path.join(origFile, file));
              newFiles.push(path.join(newFile, file));
            }
          });
        }
        var count = files.length;
        _.each(files, function (file, i) {
          var src = path.join(boilerplates, file);
          if (!fs.existsSync(src)) src = path.join(common, file);

          var dst = path.join(dest, newFiles[i]);
          fs.mkdirsSync(path.dirname(dst));
          fs.copy(src, dst, function (err) {
            count = count - 1;
            if (count === 0 && cb) {
              cb();
            }
          });
        });
      }
    });
};