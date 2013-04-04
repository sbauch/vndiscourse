/**
  This view handles rendering of a user's preferences

  @class PreferencesView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/
Discourse.PreferencesView = Discourse.View.extend({
  templateName: 'user/preferences',
  classNames: ['user-preferences'],
	updated: false,

	upload: function(){
		var _this = this;
		var $uploadTarget = $('#custom-avatar');
		var username = Discourse.currentUser.username;
		
		$uploadTarget.fileupload({
      	url: '/users/' + username + '/custom_avatar' ,
      	dataType: 'json',
      	timeout: 20000,
      	formData: { topic_id: 1234  } // spoof requirement in Upload model
			}),
			
		$uploadTarget.on('fileuploaddone', function (e, data) {
      var upload = data.result;
			console.log(Discourse.currentUser);
      Discourse.currentUser.set('avatar_template', upload.url + '?size={size}');
    });	

		$uploadTarget.fileupload('send', { fileInput: $('#filename-input') });
		this.set('updated', true);
		return false;
		},
	
	add: function() {	
		console.log('added!');
	}

});


