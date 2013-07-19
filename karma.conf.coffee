# Karma configuration
# Generated on Fri Jul 19 2013 09:26:09 GMT-0500 (CDT)

module.exports = (karma) ->
  karma.configure

    # base path, that will be used to resolve all patterns, eg. files, exclude
    basePath: ''

    # frameworks to use
    frameworks: ['ng-scenario']

    # list of files / patterns to load in the browser
    files: [
      'test/e2e/**/*Spec.*'
    ]

    # list of files to exclude
    exclude: [
      
    ]

    # test results reporter to use
    # possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress']

    # web server port
    port: 9876

    # cli runner port
    runnerPort: 9100

    # enable / disable colors in the output (reporters and logs)
    colors: true

    # level of logging
    # possible values: karma.LOG_DISABLE || karma.LOG_ERROR || karma.LOG_WARN || karma.LOG_INFO || karma.LOG_DEBUG
    logLevel: karma.LOG_DEBUG

    # enable / disable watching file and executing tests whenever any file changes
    autoWatch: true

    # Start these browsers, currently available:
    # - Chrome
    # - ChromeCanary
    # - Firefox
    # - Opera
    # - Safari (only Mac)
    # - PhantomJS
    # - IE (only Windows)
    browsers: ['Chrome']

    # If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000

    # Continuous Integration mode
    # if true, it capture browsers, run tests and exit
    singleRun: false

    urlRoot: '/__karma/'

    proxies:
      '/': 'http://localhost:1337/'