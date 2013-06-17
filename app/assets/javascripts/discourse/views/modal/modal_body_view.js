/**
  A base class for helping us display modal content

  @class ModalBodyView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/
Discourse.ModalBodyView = Discourse.View.extend({

  // Focus on first element
  didInsertElement: function() {
    $('#discourse-modal').modal('show');

    var controller = this.get('controller');
    $('#discourse-modal').on('hide.discourse', function() {
      controller.send('closeModal');
    });

    $('#modal-alert').hide();

    var modalBodyView = this;
    Em.run.schedule('afterRender', function() {
      modalBodyView.$('input:first').focus();
    });

    var title = this.get('title');
    if (title) {
      this.set('controller.controllers.modal.title', title);
    }
  },

  willDestroyElement: function() {
    $('#discourse-modal').off('hide.discourse');
  },

  // Pass the errors to our errors view
  displayErrors: function(errors, callback) {
    this.set('parentView.parentView.modalErrorsView.errors', errors);
    if (typeof callback === "function") callback();
  },

  flashMessageChanged: function() {
    var flashMessage = this.get('controller.flashMessage');
    if (flashMessage) {
      var messageClass = flashMessage.get('messageClass') || 'success';
      var $alert = $('#modal-alert').hide().removeClass('alert-error', 'alert-success');
      $alert.addClass("alert alert-" + messageClass).html(flashMessage.get('message'));
      $alert.fadeIn();
    }
  }.observes('controller.flashMessage')

});


