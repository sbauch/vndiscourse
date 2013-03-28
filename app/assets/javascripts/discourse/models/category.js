/**
  A data model that represents a category

  @class Category
  @extends Discourse.Model
  @namespace Discourse
  @module Discourse
**/
Discourse.Category = Discourse.Model.extend({

  url: function() {
    return Discourse.getURL("/category/") + (this.get('slug'));
  }.property('name'),

  style: function() {
    return "background-color: #" + (this.get('category.color')) + "; color: #" + (this.get('category.text_color')) + ";";
  }.property('color', 'text_color'),

  moreTopics: function() {
    return this.get('topic_count') > Discourse.SiteSettings.category_featured_topics;
  }.property('topic_count'),

  save: function(args) {
    var url = Discourse.getURL("/categories");
    if (this.get('id')) {
      url = Discourse.getURL("/categories/") + (this.get('id'));
    }

    return this.ajax(url, {
      data: {
        name: this.get('name'),
        color: this.get('color'),
        text_color: this.get('text_color'),
        hotness: this.get('hotness')
      },
      type: this.get('id') ? 'PUT' : 'POST'
    });
  },

  destroy: function(callback) {
    return $.ajax(Discourse.getURL("/categories/") + (this.get('slug')), { type: 'DELETE' });
  }

});


