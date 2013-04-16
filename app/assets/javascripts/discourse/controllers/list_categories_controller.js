/**
  This controller supports actions when listing categories

  @class ListCategoriesController 
  @extends Discourse.ObjectController
  @namespace Discourse
  @module Discourse
**/
Discourse.ListCategoriesController = Discourse.ObjectController.extend({
  needs: ['modal'],

  categoriesEven: (function() {
    if (this.blank('categories')) {
      return Em.A();
    }
    return this.get('categories').filter(function(item, index) {
      return (index % 2) === 0;
    });
  }).property('categories.@each'),

  categoriesOdd: (function() {
    if (this.blank('categories')) {
      return Em.A();
    }
    return this.get('categories').filter(function(item, index) {
      return (index % 2) === 1;
    });
  }).property('categories.@each'),

  editCategory: function(category) {
    this.get('controllers.modal').show(Discourse.EditCategoryView.create({ category: category }));
    return false;
  },

  canEdit: (function() {
    var u;
    u = Discourse.get('currentUser');
    return u && u.admin;
  }).property()

});


