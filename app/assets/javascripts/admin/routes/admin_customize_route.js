(function() {

  /**
    Handles routes related to customization

    @class AdminCustomizeRoute    
    @extends Discourse.Route
    @namespace Discourse
    @module Discourse
  **/ 
  Discourse.AdminCustomizeRoute = Discourse.Route.extend({
    model: function() {
      return Discourse.SiteCustomization.findAll();
    },

    renderTemplate: function() {    
      this.render({into: 'admin/templates/admin'});
    }
  });

}).call(this);
