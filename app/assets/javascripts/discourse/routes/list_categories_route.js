/**
  The route for listing categories.

  @class ListCategoriesRoute
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/
Discourse.ListCategoriesRoute = Discourse.Route.extend({

  redirect: function() { Discourse.redirectIfLoginRequired(this); },

  events: {
    createCategory: function() {
      Discourse.Route.showModal(this, 'editCategory', Discourse.Category.create({
        color: 'AB9364', text_color: 'FFFFFF', hotness: 5, group_permissions: [{group_name: "everyone", permission_type: 1}],
        available_groups: Discourse.Site.instance().group_names
      }));
      this.controllerFor('editCategory').set('selectedTab', 'general');
    }
  },

  model: function() {
    var listTopicsController = this.controllerFor('listTopics');
    if (listTopicsController) listTopicsController.set('content', null);
    return this.controllerFor('list').load('categories');
  },

  deactivate: function() {
    this._super();
    this.controllerFor('list').set('canCreateCategory', false);
  },

  renderTemplate: function() {
    this.render('listCategories', { into: 'list', outlet: 'listView' });
  },

  afterModel: function(categoryList) {
    this.controllerFor('list').setProperties({
      canCreateCategory: categoryList.get('can_create_category'),
      canCreateTopic: categoryList.get('can_create_topic')
    });
  },

  enter: function() {
    this.controllerFor('list').setProperties({
      filterMode: 'categories',
      category: null
    });
  }

});


