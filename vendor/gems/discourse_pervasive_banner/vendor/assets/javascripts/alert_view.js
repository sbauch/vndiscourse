/**
  This view handles rendering of the alert of the site

  @class AlertView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/
Discourse.AlertView = Discourse.View.extend( Discourse.Animate, {
  siteBinding: 'Discourse.site',
  currentUserBinding: 'Discourse.currentUser',
  categoriesBinding: 'site.categories',
  topicBinding: 'Discourse.router.topicController.content',
	templateName: 'alert',

	observeCount: function() {
		if (!Discourse.currentUser.unread_alerts == 0){
			this.getAlerts();
		}
		else{
			$('.d-header').css('top', '0');
   		$('#main-outlet').css('padding-top', '75px');
		}
		
	}.observes('Discourse.currentUser.unread_alerts'),	
		
	getAlerts: function() {
    var _this = this;
		var message;
		var alerts_count = Discourse.currentUser.unread_alerts;
    $.get(Discourse.getURL("/alerts")).then(function(result) {
      	if (result) {
	 				_this.set('alert', Discourse.Alert.create(result));
					$('.d-header').css('top', '28px');
   				$('#main-outlet').css('padding-top', '103px');
					}
				});
				return false	
  		},

	closeAlert: function() {
		var _this = this;
		var id = this.get('alert').id;
		var count = Discourse.currentUser.unread_alerts;
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
				Discourse.currentUser.set('unread_alerts', count - 1);
				_this.set('alert', null);
			  
    }

});


