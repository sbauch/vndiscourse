/*global Markdown:true*/

/**
  A control to support embedding a post as a parent of the current post (in reply to)

  @class ParentView
  @extends Ember.ContainerView
  @namespace Discourse
  @module Discourse
**/
Discourse.ParentView = Discourse.EmbeddedPostView.extend({
  previousPost: true,

  // Nice animation for when the replies appear
  didInsertElement: function() {
    var $parentPost;
    this._super();
    $parentPost = this.get('postView').$('section.parent-post');

    // Animate unless we're on a touch device
    if (Discourse.get('touch')) {
      $parentPost.show();
    } else {
      $parentPost.slideDown();
    }
  }
});


