/**
  This view handles the modal for when a user forgets their password

  @class ForgotPasswordView
  @extends Discourse.ModalBodyView
  @namespace Discourse
  @module Discourse
**/
Discourse.ForgotPasswordView = Discourse.ModalBodyView.extend({
  templateName: 'modal/forgot_password',
  title: Em.String.i18n('forgot_password.title'),

  // You need a value in the field to submit it.
  submitDisabled: (function() {
    return this.blank('accountEmailOrUsername');
  }).property('accountEmailOrUsername'),

  submit: function() {

    Discourse.ajax("/session/forgot_password", {
      data: { login: this.get('accountEmailOrUsername') },
      type: 'POST'
    });

    // don't tell people what happened, this keeps it more secure (ensure same on server)
    this.flash(Em.String.i18n('forgot_password.complete'));
    return false;
  }

});


