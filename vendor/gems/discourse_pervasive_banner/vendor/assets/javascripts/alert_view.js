/**
  This view handles rendering of the alert of the site

  @class AlertView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/
Discourse.AlertView = Discourse.View.extend({
  siteBinding: 'Discourse.site',
  currentUserBinding: 'Discourse.currentUser',
  categoriesBinding: 'site.categories',
  topicBinding: 'Discourse.router.topicController.content',
	templateName: 'alert',
	init: function() {
    this._super();
    if ( this.get("alerts") == null){
      this.getAlerts();
    }
  }, 

	getAlerts: function() {
    var _this = this;
		var message;
    $.get(Discourse.getURL("/alerts")).then(function(result) {
      _this.set('alerts',  result.map(function(a) {
        return Discourse.Alert.create(a);
      }));
    });
		return false	
  },

	closeAlert: function() {
    var _this = this;
    _this.set('currentUser.unread_alerts', 0);
 		$('.d-header').css('top', '0');
    $('#main-outlet').css('padding-top', '75px');
    return false;
    }

});


