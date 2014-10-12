module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                // define a string to put between each file in the concatenated output
                separator: ';'
            },
            dist: {
                // the files to concatenate
                src: ['bookkit/js/*.js'],
                // the location of the resulting JS file
                dest: 'dist/js/<%= pkg.name %>.js'
            },
        },
        bower_concat: {
            all: {
                dest: 'dist/js/bower_deps.js',
                cssDest: 'dist/css/bower_deps.css',
                exclude: [
                ],
                dependencies: {
                },
                bowerOptions: {
                    relative: false
                }
            }
        },
        uglify: {
            options: {
                // the banner is inserted at the top of the output
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/js/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },
        copy: {
            main: {
                expand: true, 
                cwd: 'bookkit/', 
                src: ['**'], 
                dest: 'dist/',
            },
        },

        clean: ["dist"]
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-bower-concat');

    grunt.registerTask('test', ['qunit']);
    grunt.registerTask('default', ['clean', 'copy', 'concat', 'uglify']);
}

