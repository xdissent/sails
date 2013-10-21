###
HTTP Flat-File Cache

These settings are for Express' static middleware- your "public" folder.
In Sails, this is more or less your app's `assets directory.

The HTTP static cache is only active in a 'production' environment,
since that's the only time Express will cache flat-files.

For more information on configuration, check out:
http://sailsjs.org/#documentation
###

# The number of seconds to cache files being served from disk
# (only works in production mode)
module.exports["static"] = cache:
  maxAge: 31557600000