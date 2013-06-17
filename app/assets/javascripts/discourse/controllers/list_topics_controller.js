/**
  This controller supports actions when listing topics or categories

  @class ListTopicsController
  @extends Discourse.ObjectController
  @namespace Discourse
  @module Discourse
**/
Discourse.ListTopicsController = Discourse.ObjectController.extend({
  needs: ['list', 'composer', 'modal'],
  rankDetailsVisible: false,

  // If we're changing our channel
  previousChannel: null,

  latest: Ember.computed.equal('filter', 'latest'),

  draftLoaded: function() {
    var draft = this.get('content.draft');
    if (draft) {
      return this.get('controllers.composer').open({
        draft: draft,
        draftKey: this.get('content.draft_key'),
        draftSequence: this.get('content.draft_sequence'),
        ignoreIfChanged: true
      });
    }
  }.observes('content.draft'),

  // Star a topic
  toggleStar: function(topic) {
    topic.toggleStar();
  },

  // clear a pinned topic
  clearPin: function(topic) {
    topic.clearPin();
  },

  toggleRankDetails: function() {
    this.toggleProperty('rankDetailsVisible');
  },

  createTopic: function() {
    this.get('controllers.list').createTopic();
  },

  // Show newly inserted topics
  showInserted: function(e) {
    var tracker = Discourse.TopicTrackingState.current();

    // Move inserted into topics
    this.get('content').loadBefore(tracker.get('newIncoming'));
    tracker.resetTracking();
    return false;
  },

  allLoaded: function() {
    return !this.get('loading') && !this.get('more_topics_url');
  }.property('loading', 'more_topics_url'),

  canCreateTopic: Em.computed.alias('controllers.list.canCreateTopic'),

  footerMessage: function() {
    if (!this.get('allLoaded')) return;
    var category = this.get('category');
    if( category ) {
      return Em.String.i18n('topics.bottom.category', {category: category.get('name')});
    } else {
      var split = this.get('filter').split('/');
      if (this.get('topics.length') === 0) {
        return Em.String.i18n("topics.none." + split[0], {
          category: split[1]
        });
      } else {
        return Em.String.i18n("topics.bottom." + split[0], {
          category: split[1]
        });
      }
    }
  }.property('allLoaded', 'topics.length'),

  loadMore: function() {
    this.set('loadingMore', true);
    var listTopicsController = this;
    return this.get('model').loadMoreTopics().then(function(hasMoreTopics) {
      listTopicsController.set('loadingMore', false);
      return hasMoreTopics;
    });
  }

});


