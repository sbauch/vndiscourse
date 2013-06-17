/**
  This view handles rendering of the history of a post

  @class HistoryView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/
Discourse.HistoryView = Discourse.ModalBodyView.extend({
  templateName: 'modal/history',
  title: Em.String.i18n('history')
});
