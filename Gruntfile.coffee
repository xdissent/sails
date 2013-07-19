module.exports = (grunt) ->
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-shell'
  grunt.loadNpmTasks 'grunt-karma'

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    copy:
      e2e:
        files: [
          expand: true
          cwd: 'test/e2e/fixtures'
          src: ['**/*']
          dest: 'e2eApp'
        ]

    clean:
      e2e: ['e2eApp']

    shell:
      e2eApp:
        command: 'bin/sails.js new e2eApp --linker'
      e2eNpm:
        command: 'npm install forever'
        options: execOptions: cwd: 'e2eApp'
      e2eStart:
        command: 'node_modules/forever/bin/forever start app.js && sleep 5'
        options: execOptions: cwd: 'e2eApp'
      e2eStop:
        command: 'node_modules/forever/bin/forever stop app.js'
        options: execOptions: cwd: 'e2eApp'

    karma:
      e2e:
        configFile: 'karma.conf.coffee'
        singleRun: false

    grunt.registerTask 'e2e', [
      'clean'
      'shell:e2eApp'
      'copy:e2e'
      'shell:e2eNpm'
      'shell:e2eStart'
      'karma:e2e'
      'shell:e2eStop'
    ]