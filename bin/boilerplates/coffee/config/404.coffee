###
Default 404 (Not Found) handler

If no route matches are found for a request, Sails will respond using this handler.

This middleware can also be invoked manually from a controller or policy:
Usage: res.notFound()
###
module.exports[404] = pageNotFound = (req, res) ->
  
  #
  #   * NOTE: This function is Sails middleware-- that means that not only do `req` and `res`
  #   * work just like their Express equivalents to handle HTTP requests, they also simulate
  #   * the same interface for receiving socket messages.
  #   
  statusCode = 404
  result = status: statusCode
  
  # If the user-agent wants a JSON response, send json
  return res.json(result, result.status)  if req.wantsJSON
  viewFilePath = "404"
  res.status(result.status).render viewFilePath, result, (err) ->
    
    # If the view doesn't exist, or an error occured, send json
    return res.json(result, result.status)  if err
    
    # Otherwise, serve the `views/404.*` page
    res.render viewFilePath
