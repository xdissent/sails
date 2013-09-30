var _ = require('lodash');

module.exports = function (models) {
  return {
    routes: {
      'get /:id?': 'find',
      'post /': 'create',
      'put /:id?': 'update',
      'delete /:id?': 'destroy'
    },
    controller: {
      find: function find (req, res, next) {
        var Model = models[req.target.controller];

        if (!Model) return next();

        if (req.param('id')) {
          return Model.findOne(req.param('id')).done(function found (err, model) {
            if (err || !model) return next(err);

            if (req.socket && !Model.silent) Model.subscribe(req.socket, model);
            res.json(model.toJSON());
          });
        }
          
        var where = req.param('where');
        try { where = JSON.parse(where); } catch (e) {}
        if (!where) {
          var omit = ['limit', 'skip', 'sort', 'callback'];
          where = _.omit(req.params.all(), function (param, name) {
            return _.isUndefined(param) || _.contains(omit, name);
          });
        }
        
        var options = {
          limit: req.param('limit') || undefined,
          skip: req.param('skip') || req.param('offset') || undefined,
          sort: req.param('sort') || req.param('order') || undefined,
          where: where || undefined
        };

        Model.find(options).done(function found (err, models) {
          if (err || !models) return next(err);

          if (req.socket && !Model.silent) {
            Model.subscribe(req.socket);
            Model.subscribe(req.socket, models);
          }

          res.json(_.map(models, function (model) {
            return model.toJSON();
          }));
        });
      }
      // find: require('../controllers/controller.find.js')(sails),
      // create: require('../controllers/controller.create.js')(sails),
      // update: require('../controllers/controller.update.js')(sails),
      // destroy: require('../controllers/controller.destroy.js')(sails)
    }
  };
};