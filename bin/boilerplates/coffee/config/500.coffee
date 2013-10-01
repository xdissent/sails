###
Default 500 (Server Error) middleware

If an error is thrown in a policy or controller,
Sails will respond using this default error handler

This middleware can also be invoked manually from a controller or policy:
res.serverError( [errors] )


@param {Array|Object|String} errors
optional errors
###
module.exports[500] = serverErrorOccurred = (errors, req, res) ->
  
  #
  #   * NOTE: This function is Sails middleware-- that means that not only do `req` and `res`
  #   * work just like their Express equivalents to handle HTTP requests, they also simulate
  #   * the same interface for receiving socket messages.
  #   
  viewFilePath = "500"
  statusCode = 500
  result = status: statusCode
  
  # Normalize a {String|Object|Error} or array of {String|Object|Error} 
  # into an array of proper, readable {Error}
  errorsToDisplay = sails.util.normalizeErrors(errors)
  
  # Log error(s)
  sails.log.error errorsToDisplay
  
  # Only include errors if application environment is set to 'development'
  # In production, don't display any identifying information about the error(s)
  result.errors = errorsToDisplay  if sails.config.environment is "development"
  
  # If the user-agent wants JSON, respond with JSON
  return res.json(result, result.status)  if req.wantsJSON
  res.status(result.status).render viewFilePath, result, (err) ->
    
    # If the view doesn't exist, or an error occured, just send JSON
    return res.json(result, result.status)  if err
    
    # Otherwise, if it can be rendered, the `views/500.*` page is rendered
    res.render viewFilePath, result
