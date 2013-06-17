Discourse.SeeAllButtonView = window.Discourse.View.extend({
  classNames: ['delete-tier-view'],
  tagName: 'button',
  click: function () {
    var tier = this.get('content');
    var controller = this.getPath('contentView.content');
    controller.get('content').removeObject(tier);
  }
});
