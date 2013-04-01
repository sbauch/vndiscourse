/**
  This view is used for rendering the "share" interface for a post

  @class ShareView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/
Discourse.ShareView = Discourse.View.extend({
  templateName: 'share',
  elementId: 'share-link',
  classNameBindings: ['hasLink'],

  title: (function() {
    if (this.get('controller.type') === 'topic') return Em.String.i18n('share.topic');
    return Em.String.i18n('share.post');
  }).property('controller.type'),

  hasLink: (function() {
    if (this.present('controller.link')) return 'visible';
    return null;
  }).property('controller.link'),

  linkChanged: (function() {
    if (this.present('controller.link')) {
      var $linkInput = $('#share-link input');
      $linkInput.val(this.get('controller.link'));

      // Wait for the fade-in transition to finish before selecting the link:
      window.setTimeout(function() {
        $linkInput.select().focus();
      }, 160);
    }
  }).observes('controller.link'),

  didInsertElement: function() {
    var _this = this;
    $('html').on('mousedown.outside-share-link', function(e) {
      // Use mousedown instead of click so this event is handled before routing occurs when a
      // link is clicked (which is a click event) while the share dialog is showing.
      if (_this.$().has(e.target).length !== 0) {
        return;
      }
      _this.get('controller').close();
      return true;
    });
    $('html').on('click.discoure-share-link', '[data-share-url]', function(e) {
      var $currentTarget, url;
      e.preventDefault();
      $currentTarget = $(e.currentTarget);
      url = $currentTarget.data('share-url');
      /* Relative urls
      */

      if (url.indexOf("/") === 0) {
        url = window.location.protocol + "//" + window.location.host + url;
      }
      _this.get('controller').shareLink(e, url);
      return false;
    });
    $('html').on('keydown.share-view', function(e){
      if (e.keyCode === 27) {
        _this.get('controller').close();
      }
    });
  },

  willDestroyElement: function() {
    $('html').off('click.discoure-share-link');
    $('html').off('mousedown.outside-share-link');
    $('html').off('keydown.share-view');
  }

});


