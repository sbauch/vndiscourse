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
		      this.getAlerts();
		  },
		
	getAlerts: function() {
    var _this = this;
		var message;
    $.get(Discourse.getURL("/alerts")).then(function(result) {
      	if (result) {
	 				_this.set('alert', Discourse.Alert.create(result));
    			Discourse.currentUser.set('unread_alerts', 1);
					$('.d-header').css('top', '28px');
   				$('#main-outlet').css('padding-top', '103px');
					}
				else { 
					$('.d-header').css('top', '0');
    			$('#main-outlet').css('padding-top', '75px');
					}	
				});
				return false	
  		}.observes('Discourse.currentUser.unread_alerts'),

	closeAlert: function() {
		var id = this.get('alert').id;
		
			$.ajax({
      url: '/alerts/' + id + '?user_id=' + Discourse.currentUser.id,
      type: 'PUT',
			success: function( data ){

			},
      error: function(error) {
        var errors = $.parseJSON(error.responseText).errors;
        return bootbox.alert(errors[0]);
      	}
    	});
		Discourse.currentUser.set('unread_alerts', 0);
    }

});


