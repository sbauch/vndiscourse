/**
  This route handles requests for topics

  @class TopicRoute
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/
Discourse.TopicRoute = Discourse.Route.extend({

  redirect: function() { Discourse.redirectIfLoginRequired(this); },

  events: {
    // Modals that can pop up within a topic

    showFlags: function(post) {
      Discourse.Route.showModal(this, 'flag', post);
      this.controllerFor('flag').setProperties({ selected: null });
    },

    showAutoClose: function() {
      Discourse.Route.showModal(this, 'editTopicAutoClose', this.modelFor('topic'));
      this.controllerFor('modal').set('modalClass', 'edit-auto-close-modal');
    },

    showInvite: function() {
      Discourse.Route.showModal(this, 'invite', this.modelFor('topic'));
      this.controllerFor('invite').setProperties({
        email: null,
        error: false,
        saving: false,
        finished: false
      });
    },

    showPrivateInvite: function() {
      Discourse.Route.showModal(this, 'invitePrivate', this.modelFor('topic'));
      this.controllerFor('invitePrivate').setProperties({
        email: null,
        error: false,
        saving: false,
        finished: false
      });
    },

    showHistory: function(post) {
      Discourse.Route.showModal(this, 'history', post);
      this.controllerFor('history').refresh();
      this.controllerFor('modal').set('modalClass', 'history-modal');
    },

    mergeTopic: function() {
      Discourse.Route.showModal(this, 'mergeTopic', this.modelFor('topic'));
    },

    splitTopic: function() {
      Discourse.Route.showModal(this, 'splitTopic', this.modelFor('topic'));
    }

  },

  model: function(params) {
    var currentModel = this.modelFor('topic');
    if (currentModel && (currentModel.get('id') === parseInt(params.id, 10))) {
      return currentModel;
    }
    return Discourse.Topic.create(params);
  },

  activate: function() {
    this._super();

    var topic = this.modelFor('topic');
    Discourse.set('transient.lastTopicIdViewed', parseInt(topic.get('id'), 10));

    // Set the search context
    this.controllerFor('search').set('searchContext', topic.get('searchContext'));
  },

  deactivate: function() {
    this._super();

    // Clear the search context
    this.controllerFor('search').set('searchContext', null);

    var topicController = this.controllerFor('topic');
    var postStream = topicController.get('postStream');
    postStream.cancelFilter();

    topicController.set('multiSelect', false);
    topicController.unsubscribe();
    this.controllerFor('composer').set('topic', null);
    Discourse.ScreenTrack.instance().stop();

    var headerController;
    if (headerController = this.controllerFor('header')) {
      headerController.set('topic', null);
      headerController.set('showExtraInfo', false);
    }

    // Clear any filters when we leave the route
    Discourse.URL.set('queryParams', null);
  },

  setupController: function(controller, model) {
    controller.set('model', model);

    this.controllerFor('header').setProperties({
      topic: model,
      showExtraInfo: false
    });
    this.controllerFor('composer').set('topic', model);
    Discourse.TopicTrackingState.current().trackIncoming('all');
    controller.subscribe();

    // We reset screen tracking every time a topic is entered
    Discourse.ScreenTrack.instance().start(model.get('id'));
  }

});


