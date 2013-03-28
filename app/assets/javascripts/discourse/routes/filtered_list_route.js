/**
  A class used to handle filtering routes such as latest, hot, read, etc.

  @class FilteredListRoute
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/
Discourse.FilteredListRoute = Discourse.Route.extend({

  exit: function() {
    this._super();

    var listController = this.controllerFor('list');
    listController.set('canCreateTopic', false);
    listController.set('filterMode', '');
  },

  renderTemplate: function() {
    this.render('listTopics', {
      into: 'list',
      outlet: 'listView',
      controller: 'listTopics'
    });
  },

  setupController: function() {
    var listController = this.controllerFor('list');
    var listTopicsController = this.controllerFor('listTopics');
    listController.set('filterMode', this.filter);

    var listContent = listTopicsController.get('content');
    if (listContent) {
      listContent.set('loaded', false);
    }

    listController.load(this.filter).then(function(topicList) {
      listController.set('category', null);
      listController.set('canCreateTopic', topicList.get('can_create_topic'));
      listTopicsController.set('content', topicList);
    });
  }
});

Discourse.ListController.filters.each(function(filter) {
  Discourse["List" + (filter.capitalize()) + "Route"] = Discourse.FilteredListRoute.extend({ filter: filter });
});


