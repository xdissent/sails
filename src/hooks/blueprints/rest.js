var _ = require('lodash');

module.exports = function (params, models) {
  return {
    routes: function (controller) {
      return {
        'get /:id?': {
          controller: controller.identity,
          action: 'find',
          name: controller.identity + '_find'
        },
        'post /': {
          controller: controller.identity,
          action: 'create',
          name: controller.identity + '_create'
        },
        'put /:id?': {
          controller: controller.identity,
          action: 'update',
          name: controller.identity + '_update'
        },
        'delete /:id?': {
          controller: controller.identity,
          action: 'destroy',
          name: controller.identity + '_destroy'
        }
      };
    },

    controller: {
      find: function find (req, res, next) {
        var Model = models[req.target.controller];

        if (!Model) return next();

        if (req.param('id')) {
          return Model.findOne(req.param('id')).done(function found (err, model) {
            if (err || !model) return next(err);

            if (false && req.socket && !Model.silent) Model.subscribe(req.socket, model);
            res.json(200, model.toJSON());
          });
        }
          
        var where = req.param('where');
        try { where = JSON.parse(where); } catch (e) {}
        if (!where) {
          var omit = ['limit', 'skip', 'sort', 'callback'];
          where = _.omit(req.params.all, function (param, name) {
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

          if (false && req.socket && !Model.silent) {
            Model.subscribe(req.socket);
            Model.subscribe(req.socket, models);
          }

          res.json(200, _.map(models, function (model) {
            return model.toJSON();
          }));
        });
      },

      create: function (req, res, next) {
        var Model = models[req.target.controller];

        if (!Model) return next();

        Model.create(req.params.all, function (err, model) {
          if (err) {
            if (err.ValidationError) {
              err.status = 400;
              err.message = 'Bad Request';
            }
            return next(err);
          }

          if (false && req.socket && !Model.silent) Model.publishCreate(model);

          res.json(201, model.toJSON());
        });
      },

      update: function (req, res, next) {
        var Model = models[req.target.controller];

        if (!Model) return next();

        Model.update(req.params.id, req.params.all, function (err, models) {
          if (err) {
            if (err.ValidationError) {
              err.status = 400;
              err.message = 'Bad Request';
            }
            return next(err);
          }

          if (!models || models.length === 0) return next();

          var model = models[0];

          if (false && req.socket && !Model.silent) Model.publishCreate(model);

          res.json(200, model.toJSON());
        });
      },

      destroy: function (req, res, next) {
        var Model = models[req.target.controller];

        if (!Model) return next();

        Model.findOne(req.params.id).done(function (err, model) {
          if (err || !model) return next(err);

          Model.destroy(req.params.id, function (err) {
            if (err) return next(err);

            if (false && req.socket && !Model.silent) Model.publishDestroy(req.params.id);

            res.json(200, model.toJSON);
          });
        });
      }
    }
  };
};