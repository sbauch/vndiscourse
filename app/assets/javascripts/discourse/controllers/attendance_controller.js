/**
  This controller supports actions related to attendance

  @class AttendanceController
  @extends Discourse.ObjectController
  @namespace Discourse
  @uses Discourse.ModalFunctionality
  @module Discourse
**/
Discourse.AttendanceController = Discourse.ObjectController.extend(Discourse.ModalFunctionality, {
	
  onShow: function() {
		console.log('showing');
		console.log(this);
		console.log(this.get('attendees'));
  }
});


