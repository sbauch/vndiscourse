/**
  Allows users to customize site content

  @class AdminSiteContentEditRoute
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/
Discourse.AdminSiteContentEditRoute = Discourse.Route.extend({

  serialize: function(model) {
    return {content_type: model.get('content_type')};
  },

  model: function(params) {
    return {content_type: params.content_type};
  },

  renderTemplate: function() {
    this.render('admin/templates/site_content_edit', {into: 'admin/templates/site_contents'});
  },

  exit: function() {
    this._super();
    this.render('admin/templates/site_contents_empty', {into: 'admin/templates/site_contents'});
  },

  setupController: function(controller, model) {
    controller.set('loaded', false);
    controller.setProperties({saving: false, saved: false});

    Discourse.SiteContent.find(Em.get(model, 'content_type')).then(function (sc) {
      controller.set('content', sc);
      controller.set('loaded', true);
    })
  }


});
