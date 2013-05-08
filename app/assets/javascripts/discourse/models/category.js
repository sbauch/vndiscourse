/**
  A data model that represents a category

  @class Category
  @extends Discourse.Model
  @namespace Discourse
  @module Discourse
**/
Discourse.Category = Discourse.Model.extend({

  init: function() {
    this._super();
    if (!this.get('id') && this.get('name')) {
      this.set('is_uncategorized', true);
      if (!this.get('color'))      this.set('color',      Discourse.SiteSettings.uncategorized_color);
      if (!this.get('text_color')) this.set('text_color', Discourse.SiteSettings.uncategorized_text_color);
    }
  },

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
    var url = "/categories";
    if (this.get('id')) {
      url = "/categories/" + (this.get('id'));
    }

    return Discourse.ajax(url, {
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
    return Discourse.ajax("/categories/" + (this.get('slug') || this.get('id')), { type: 'DELETE' });
  }

});

Discourse.Category.reopenClass({
  findBySlugOrId: function(slugOrId) {
    return Discourse.ajax("/categories/" + slugOrId + ".json").then(function (result) {
      return Discourse.Category.create(result.category);
    });
  }
});
