/**
  This view handles rendering of the history of a post

  @class HistoryView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/
Discourse.HistoryView = Discourse.View.extend({
  templateName: 'history',
  title: Em.String.i18n('history'),
  modalClass: 'history-modal',

  loadSide: function(side) {
    if (this.get("version" + side)) {
      var orig = this.get('originalPost');
      var version = this.get("version" + side + ".number");
      if (version === orig.get('version')) {
        this.set("post" + side, orig);
      } else {
        var historyView = this;
        Discourse.Post.loadVersion(orig.get('id'), version).then(function(post) {
          historyView.set("post" + side, post);
        });
      }
    }
  },

  changedLeftVersion: function() {
    this.loadSide("Left");
  }.observes('versionLeft'),

  changedRightVersion: function() {
    this.loadSide("Right");
  }.observes('versionRight'),

  didInsertElement: function() {
    var _this = this;
    this.set('loading', true);
    this.set('postLeft', null);
    this.set('postRight', null);
    return this.get('originalPost').loadVersions(function(result) {
      result.each(function(item) {
        item.description = "v" + item.number + " - " + Date.create(item.created_at).relative() + " - " +
          Em.String.i18n("changed_by", { author: item.display_username });
      });

      _this.set('loading', false);
      _this.set('versionLeft', result.first());
      _this.set('versionRight', result.last());
      return _this.set('versions', result);
    });
  }
});


