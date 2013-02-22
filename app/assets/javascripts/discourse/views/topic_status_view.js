(function() {

  window.Discourse.TopicStatusView = Discourse.View.extend({
    classNames: ['topic-statuses'],
    hasDisplayableStatus: (function() {
      if (this.get('topic.closed')) {
        return true;
      }
      if (this.get('topic.pinned')) {
        return true;
      }
      if (!this.get('topic.archetype.isDefault')) {
        return true;
      }
      if (!this.get('topic.visible')) {
        return true;
      }
      return false;
    }).property('topic.closed', 'topic.pinned', 'topic.visible'),
    statusChanged: (function() {
      return this.rerender();
    }).observes('topic.closed', 'topic.pinned', 'topic.visible'),
    renderIcon: function(buffer, name, key) {
      var title;
      title = Em.String.i18n("topic_statuses." + key + ".help");
      return buffer.push("<span title='" + title + "' class='topic-status'><i class='icon icon-" + name + "'></i></span>");
    },
    render: function(buffer) {
      if (!this.get('hasDisplayableStatus')) {
        return;
      }
      /* Allow a plugin to add a custom icon to a topic
      */

      this.trigger('addCustomIcon', buffer);
      if (this.get('topic.closed')) {
        this.renderIcon(buffer, 'lock', 'locked');
      }
      if (this.get('topic.pinned')) {
        this.renderIcon(buffer, 'pushpin', 'pinned');
      }
      if (!this.get('topic.visible')) {
        return this.renderIcon(buffer, 'eye-close', 'invisible');
      }
    }
  });

}).call(this);
