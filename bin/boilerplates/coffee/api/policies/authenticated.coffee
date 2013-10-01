#
# Allow any authenticated user.
#
module.exports = (req, res, ok) ->

  # User is allowed, proceed to controller
  return ok() if req.session.authenticated

  # User is not allowed
  res.send "You are not permitted to perform this action.", 403