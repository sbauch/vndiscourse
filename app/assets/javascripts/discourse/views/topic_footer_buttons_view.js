/**
  This view is used for rendering the buttons at the footer of the topic

  @class TopicFooterButtonsView
  @extends Discourse.ContainerView
  @namespace Discourse
  @module Discourse
**/
Discourse.TopicFooterButtonsView = Discourse.ContainerView.extend({
  elementId: 'topic-footer-buttons',
  topicBinding: 'controller.content',
	
  init: function() {
    this._super();
<<<<<<< HEAD

    this.createButtons();

=======
    this.createButtons();
>>>>>>> 4de0c58b834664c3220deb58202d1ccd14053fef
  },

  // Add the buttons below a topic
  createButtons: function() {
<<<<<<< HEAD
		var topic = this.get('topic');
		
    if (Discourse.User.current()) {
			if (topic.get('archetype') == 'event'){
          this.addObject(Discourse.ButtonView.createWithMixins({
            helpKey: 'topic.rsvp.' + this.get('controller.content.user_rsvp_status') + '.help',
						classNames: ['btn', 'btn-primary'],
						
          	rsvpChanged: (function() {
							topic.set('gcal', null)
            	this.rerender();
							if (this.get('controller.content.user_rsvp_status') == 'registered'){
								var starts = topic.get('starts_at');
								var ends = topic.get('ends_at');
								var location = topic.get('location');
								var title = topic.get('title');
								
								var url = "http://www.google.com/calendar/event?action=TEMPLATE&text=" + escape(title) + '&dates=' + starts + '/' + ends + '&location=' + location + '&trp=true&sprop=net.vaynermedia.com&sprop=name:Vaynernet';
								var prints = "You're registered! <a href='" + url + "' target='_blank'>Add to your Google Calendar</a>"
								topic.set('gcal', new Handlebars.SafeString(prints));
								}
          	}).observes('controller.content.user_rsvp_status'),
						
						textKey: (function() {
	          	return 'topic.rsvp.' + this.get('controller.content.user_rsvp_status') + '.text';
	        	}).property('controller.content.user_rsvp_status'),

            renderIcon: function(buffer) {
							// return = (function() {
							switch (this.get('controller.content.user_rsvp_status')) {
                case 'open':
                  buffer.push("<i class='icon icon-check'></i>");
									break;
                case 'waitlist':
                  buffer.push("<i class='icon icon-group'></i>");
									break;
								case 'registered':
                  buffer.push("<i class='icon icon-remove'></i>");
                	break;
								case 'waitlisted':
                  buffer.push("<i class='icon icon-remove'></i>");
              		break;
								}
							return false
						},

            click: function() {
            	this.get('controller').toggleRsvp();
						}
          }));

        this.addObject(Discourse.ButtonView.createWithMixins({
          textKey: 'favorite.title',
          helpKeyBinding: 'controller.content.favoriteTooltipKey',

          favoriteChanged: (function() {
            this.rerender();
          }).observes('controller.content.starred'),

          click: function() {
            this.get('controller').toggleStar();
          },

          renderIcon: function(buffer) {
            var extraClass;
            if (this.get('controller.content.starred')) {
              extraClass = 'starred';
            }
            return buffer.push("<i class='icon-star " + extraClass + "'></i>");
          }
        }));

        // this.addObject(Discourse.ButtonView.create({
        //   textKey: 'topic.share.title',
        //   helpKey: 'topic.share.help',
        //   'data-share-url': topic.get('shareUrl'),
        // 
        //   renderIcon: function(buffer) {
        //     buffer.push("<i class='icon icon-share'></i>");
        //   }
        // }));


        // Add our clear pin button
        this.addObject(Discourse.ButtonView.createWithMixins({
          textKey: 'topic.clear_pin.title',
          helpKey: 'topic.clear_pin.help',
          classNameBindings: ['unpinned'],

          // Hide the button if it becomes unpinned
          unpinned: function() {
            // When not logged in don't show the button
            if (!Discourse.get('currentUser')) return 'hidden'

            return this.get('controller.pinned') ? null : 'hidden';
          }.property('controller.pinned'),

          click: function(buffer) {
            this.get('controller').clearPin();
          },

          renderIcon: function(buffer) {
            buffer.push("<i class='icon icon-pushpin'></i>");
          }
        }));

=======
    var topic = this.get('topic');
    if (Discourse.User.current()) {
      if (!topic.get('isPrivateMessage')) {

        // We hide some controls from private messages
        if (this.get('topic.can_invite_to')) {
          this.attachViewClass(Discourse.InviteReplyButton);
        }
        this.attachViewClass(Discourse.FavoriteButton);
        this.attachViewWithArgs({topic: topic}, Discourse.ShareButton);
        this.attachViewClass(Discourse.ClearPinButton);
>>>>>>> 4de0c58b834664c3220deb58202d1ccd14053fef
      }
      this.attachViewClass(Discourse.ReplyButton);

      if (!topic.get('isPrivateMessage')) {
        this.attachViewWithArgs({topic: topic}, Discourse.NotificationsButton);
      }
      this.trigger('additionalButtons', this);
    } else {
      // If not logged in give them a login control
      this.attachViewClass(Discourse.LoginReplyButton);
    }
  }
});


