###
Default 403 (Forbidden) middleware

This middleware can be invoked from a controller or policy:
res.forbidden( [message] )


@param {String|Object|Array} message
optional message to inject into view locals or JSON response
###
module.exports[403] = badRequest = (message, req, res) ->
  
  #
  #   * NOTE: This function is Sails middleware-- that means that not only do `req` and `res`
  #   * work just like their Express equivalents to handle HTTP requests, they also simulate
  #   * the same interface for receiving socket messages.
  #   
  viewFilePath = "403"
  statusCode = 403
  result = status: statusCode
  
  # Optional message
  result.message = message  if message
  
  # If the user-agent wants a JSON response, send json
  return res.json(result, result.status)  if req.wantsJSON
  res.status(result.status).render viewFilePath, result, (err) ->
    
    # If the view doesn't exist, or an error occured, send json
    return res.json(result, result.status)  if err
    
    # Otherwise, serve the `views/403.*` page
    res.render viewFilePath
