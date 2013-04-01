/**
  This controller supports the admin menu on topics

  @class TopicAdminMenuController
  @extends Discourse.ObjectController
  @namespace Discourse
  @module Discourse
**/
Discourse.EventHostMenuController = Discourse.ObjectController.extend({
	 	needs: ['modal', 'composer'],
		visible: false,
		
		show: function() {
    	this.set('visible', true);
			var _this = this;
			var message;
    	$.get("" + (this.get('url')) + '/attendees').then(function(result) {
     		_this.set('attendees',  result.map(function(a) {
					return Discourse.Attendee.create(a);
      		}));
    		});
  	},

  	hide: function() {
    	this.set('visible', false);
  	},
  
		takeAttendance: function() {
			var modal = Discourse.AttendanceModalView.create({
      			topic: this.get('content'),
						attendees: this.get('attendees')
    			});

    var modalController = this.get('controllers.modal');
    if (modalController) {
      modalController.show(modal);
    }
  	},
	
		composePrivateMessage: function() {
	    var composerController,usernames;
	    composerController = this.get('controllers.composer');
			usernames = this.get('attendees').mapProperty('username');
	    return composerController.open({
	      action: Discourse.Composer.PRIVATE_MESSAGE,
	      archetypeId: 'private_message',
	      draftKey: 'new_private_message',
				usernames: usernames
	    });
	  }
}); 

