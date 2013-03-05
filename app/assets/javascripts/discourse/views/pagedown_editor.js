/*global Markdown:true*/

/**
  A control to support using PageDown as an Ember view.

  @class PagedownEditor
  @extends Ember.ContainerView
  @namespace Discourse
  @module Discourse
**/
Discourse.PagedownEditor = Ember.ContainerView.extend({
  elementId: 'pagedown-editor',

  init: function() {
    this._super();

    // Add a button bar
    this.pushObject(Em.View.create({ elementId: 'wmd-button-bar' }));
    this.pushObject(Em.TextArea.create({
      valueBinding: 'parentView.value',
      elementId: 'wmd-input'
    }));

    this.pushObject(Em.View.createWithMixins(Discourse.Presence, {
      elementId: 'wmd-preview',
      classNameBindings: [':preview', 'hidden'],
      hidden: (function() {
        return this.blank('parentView.value');
      }).property('parentView.value')
    }));
  },

  didInsertElement: function() {
    var $wmdInput;
    $wmdInput = $('#wmd-input');
    $wmdInput.data('init', true);
    this.editor = new Markdown.Editor(Discourse.Utilities.markdownConverter({
      sanitize: true
    }));
    return this.editor.run();
  }

});


