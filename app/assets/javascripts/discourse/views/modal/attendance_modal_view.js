/**
  @class AttendanceModalView
  @extends Discourse.ModalBodyView
  @namespace Discourse
  @module Discourse
**/
Discourse.AttendanceModalView = Discourse.View.extend({
  templateName: 'modal/attendance',
  title: 'Take Attendance',

	init: function() {
		console.log(this.get("attendees"));
			this._super();
			if ( this.get("attendees") == null){
				this.getAttendees();
				}	
	  	}, 

	getAttendees: function() {
    var _this = this;
		var message;
    $.get("" + (this.get('url')) + '/attendees').then(function(result) {
     _this.set('attendees',  result.map(function(a) {
				console.log(Discourse.Attendee.create(a));
				return Discourse.Attendee.create(a);
      }));
    });
		return false	
  },
	
	didAttend: function(event) {
    return $.ajax({
      url: "" + (this.get('url')) + event.username + "/attended",
      type: 'PUT',
      data: { present: true },
			success: function( data ){
				event.set('attended', 'present');
			},
      error: function(error) {
        // topic.toggleProperty('starred');
        var errors = $.parseJSON(error.responseText).errors;
        return bootbox.alert(errors[0]);
      }
    });
	},
	
	absent: function(event) {
		  return $.ajax({
      url: (this.get('url')) + event.username + "/attended",
      type: 'PUT',
      data: { present: false },
			success: function( data ){
				event.set('attended', 'absent');

			},
      error: function(error) {
        // topic.toggleProperty('starred');
        var errors = $.parseJSON(error.responseText).errors;
        return bootbox.alert(errors[0]);
      }
    });
	}
});