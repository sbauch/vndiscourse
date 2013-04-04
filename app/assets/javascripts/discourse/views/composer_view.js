/*global Markdown:true assetPath:true */

/**
  This view handles rendering of the composer

  @class ComposerView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/
Discourse.ComposerView = Discourse.View.extend({
  templateName: 'composer',
  elementId: 'reply-control',
  classNameBindings: ['content.creatingPrivateMessage:private-message',
                      'composeState',
                      'content.loading',
                      'content.editTitle',
                      'postMade',
                      'content.creatingTopic:topic',
                      'content.showPreview',
                      'content.hidePreview'],

  composeState: function() {
    var state = this.get('content.composeState');
    if (state) return state;
    return Discourse.Composer.CLOSED;
  }.property('content.composeState'),

  draftStatus: function() {
    this.$('.saving-draft').text(this.get('content.draftStatus') || "");
  }.observes('content.draftStatus'),

  // Disable fields when we're loading
  loadingChanged: function() {
    if (this.get('loading')) {
      $('#wmd-input, #reply-title').prop('disabled', 'disabled');
    } else {
      $('#wmd-input, #reply-title').prop('disabled', '');
    }
  }.observes('loading'),

  postMade: function() {
    if (this.present('controller.createdPost')) return 'created-post';
    return null;
  }.property('content.createdPost'),

  observeReplyChanges: function() {
    var _this = this;
    if (this.get('content.hidePreview')) return;
    Ember.run.next(null, function() {
      var $wmdPreview, caretPosition;
      if (_this.editor) {
        _this.editor.refreshPreview();
        // if the caret is on the last line ensure preview scrolled to bottom
        caretPosition = Discourse.Utilities.caretPosition(_this.wmdInput[0]);
        if (!_this.wmdInput.val().substring(caretPosition).match(/\n/)) {
          $wmdPreview = $('#wmd-preview:visible');
          if ($wmdPreview.length > 0) {
            return $wmdPreview.scrollTop($wmdPreview[0].scrollHeight);
          }
        }
      }
    });
  }.observes('content.reply', 'content.hidePreview'),

  newUserEducationVisibilityChanged: function() {
    var $panel = $('#new-user-education');
    if (this.get('controller.newUserEducationVisible')) {
      $panel.slideDown('fast');
    } else {
      $panel.slideUp('fast');
    }
  }.observes('controller.newUserEducationVisible'),

  similarVisibilityChanged: function() {
    var $panel = $('#similar-topics');
    if (this.get('controller.similarVisible')) {
      $panel.slideDown('fast');
    } else {
      $panel.slideUp('fast');
    }
  }.observes('controller.similarVisible'),

  movePanels: function(sizePx) {
    $('.composer-popup').css('bottom', sizePx);
  },

  focusIn: function() {
    var controller = this.get('controller');
    if(controller) controller.resetDraftStatus();
  },

  resize: function() {
    // this still needs to wait on animations, need a clean way to do that
    return Em.run.next(null, function() {
      var replyControl = $('#reply-control');
      var h = replyControl.height() || 0;
      var sizePx = "" + h + "px";
      $('.topic-area').css('padding-bottom', sizePx);
      $('.composer-popup').css('bottom', sizePx);
    });
  }.observes('content.composeState'),

  keyUp: function(e) {
    var controller = this.get('controller');
    controller.checkReplyLength();

    var lastKeyUp = new Date();
    this.set('lastKeyUp', lastKeyUp);

    // One second from now, check to see if the last key was hit when
    // we recorded it. If it was, the user paused typing.
    var composerView = this;
    Em.run.later(function() {
      if (lastKeyUp !== composerView.get('lastKeyUp')) return;

      // Search for similar topics if the user pauses typing
      controller.findSimilarTopics();
    }, 1000);

    // If the user hit ESC
    if (e.which === 27) controller.hitEsc();
  },

  didInsertElement: function() {
    var replyControl = $('#reply-control');
    replyControl.DivResizer({ resize: this.resize, onDrag: this.movePanels });
    Discourse.TransitionHelper.after(replyControl, this.resize);
  },

  click: function() {
    this.get('controller').openIfDraft();
  },

  // Called after the preview renders. Debounced for performance
  afterRender: Discourse.debounce(function() {
    var $wmdPreview = $('#wmd-preview');
    if ($wmdPreview.length === 0) return;

    Discourse.SyntaxHighlighting.apply($wmdPreview);

    var post = this.get('controller.content.post');
    var refresh = false;

    // If we are editing a post, we'll refresh its contents once. This is a feature that
    // allows a user to refresh its contents once.
    if (post && post.blank('refreshedPost')) {
      refresh = true;
      post.set('refreshedPost', true);
    }

    // Load the post processing effects
    $('a.onebox', $wmdPreview).each(function(i, e) {
      Discourse.Onebox.load(e, refresh);
    });
    $('span.mention', $wmdPreview).each(function(i, e) {
      Discourse.Mention.load(e, refresh);
    });
  }, 100),

  initEditor: function() {
    // not quite right, need a callback to pass in, meaning this gets called once,
    // but if you start replying to another topic it will get the avatars wrong
    var $uploadTarget, $wmdInput, editor, saveDraft, selected, template, topic, transformTemplate,
      _this = this;
    this.wmdInput = $wmdInput = $('#wmd-input');
    if ($wmdInput.length === 0 || $wmdInput.data('init') === true) return;

    $LAB.script(assetPath('defer/html-sanitizer-bundle'));
    Discourse.ComposerView.trigger("initWmdEditor");
    template = Handlebars.compile("<div class='autocomplete'>" +
                                    "<ul>" +
                                    "{{#each options}}" +
                                      "<li>" +
                                          "<a href='#'>{{avatar this imageSize=\"tiny\"}} " +
                                          "<span class='username'>{{this.username}}</span> " +
                                          "<span class='name'>{{this.name}}</span></a>" +
                                      "</li>" +
                                      "{{/each}}" +
                                    "</ul>" +
                                  "</div>");

    transformTemplate = Handlebars.compile("{{avatar this imageSize=\"tiny\"}} {{this.username}}");
    $wmdInput.data('init', true);
    $wmdInput.autocomplete({
      template: template,
      dataSource: function(term, callback) {
        return Discourse.UserSearch.search({
          term: term,
          callback: callback,
          topicId: _this.get('controller.controllers.topic.content.id')
        });
      },
      key: "@",
      transformComplete: function(v) { return v.username; }
    });

    selected = [];
    $('#private-message-users').val(this.get('content.targetUsernames')).autocomplete({
      template: template,

      dataSource: function(term, callback) {
        return Discourse.UserSearch.search({
          term: term,
          callback: callback,
          exclude: selected.concat([Discourse.get('currentUser.username')])
        });
      },
      onChangeItems: function(items) {
        items = $.map(items, function(i) {
          if (i.username) {
            return i.username;
          } else {
            return i;
          }
        });
        _this.set('content.targetUsernames', items.join(","));
				console.log(items.join(","));
        selected = items;
      },

      transformComplete: transformTemplate,

      reverseTransform: function(i) {
        return { username: i };
      }

    });

    topic = this.get('topic');
    this.editor = editor = Discourse.Markdown.createEditor({
      lookupAvatar: function(username) {
        return Discourse.Utilities.avatarImg({ username: username, size: 'tiny' });
      }
    });

    $uploadTarget = $('#reply-control');
    this.editor.hooks.insertImageDialog = function(callback) {
      callback(null);
      _this.get('controller.controllers.modal').show(Discourse.ImageSelectorView.create({
        composer: _this,
        uploadTarget: $uploadTarget
      }));
      return true;
    };

    this.editor.hooks.onPreviewRefresh = function() {
      return _this.afterRender();
    };

    this.editor.run();
    this.set('editor', this.editor);
    this.loadingChanged();

    saveDraft = Discourse.debounce((function() {
      return _this.get('controller').saveDraft();
    }), 2000);

    $wmdInput.keyup(function() {
      saveDraft();
      return true;
    });

    $('#reply-title').keyup(function() {
      saveDraft();
      return true;
    });

    // In case it's still bound somehow
    $uploadTarget.fileupload('destroy');
    $uploadTarget.off();

    $uploadTarget.fileupload({
        url: '/uploads',
        dataType: 'json',
        timeout: 20000,
        formData: { topic_id: 1234 }
    });

    var addFiles = function (e, data) {
      // can only upload one file at a time
      if (data.files.length > 1) {
        bootbox.alert(Em.String.i18n('post.errors.upload_too_many_images'));
        return false;
      } else if (data.files.length > 0) {
        // check file size
        var fileSizeInKB = data.files[0].size / 1024;
        if (fileSizeInKB > Discourse.SiteSettings.max_upload_size_kb) {
          bootbox.alert(Em.String.i18n('post.errors.upload_too_large', { max_size_kb: Discourse.SiteSettings.max_upload_size_kb }));
          return false;
        }
        // check that the uploaded file is an image
        // TODO: we should provide support for other types of file
        if (data.files[0].type.indexOf('image/') !== 0) {
          bootbox.alert(Em.String.i18n('post.errors.only_images_are_supported'));
          return false; 
        }
        // everything is fine, reset upload status
        _this.setProperties({
          uploadProgress: 0,
          loadingImage: true
        });
        return true;
      }
      // we need to return true here, otherwise it prevents the default paste behavior
      return true;
    };

    // paste
    $uploadTarget.on('fileuploadpaste', addFiles);

    // drop
    $uploadTarget.on('fileuploaddrop', addFiles);

    // send
    $uploadTarget.on('fileuploadsend', function (e, data) {
      // cf. https://github.com/blueimp/jQuery-File-Upload/wiki/API#how-to-cancel-an-upload
      var jqXHR = data.xhr();
      // need to wait for the link to show up in the DOM
      Em.run.next(function() {
        // bind on the click event on the cancel link
        $('#cancel-image-upload').on('click', function() {
          // cancel the upload
          // NOTE: this will trigger a 'fileuploadfail' event with status = 0
          if (jqXHR) jqXHR.abort();
          // unbind
          $(this).off('click');
        });
      });
    });

    // progress all
    $uploadTarget.on('fileuploadprogressall', function (e, data) {
      var progress = parseInt(data.loaded / data.total * 100, 10);
      _this.set('uploadProgress', progress);
    });

    // done
    $uploadTarget.on('fileuploaddone', function (e, data) {
      var upload = data.result;
      var html = "<img src=\"" + upload.url + "\" width=\"" + upload.width + "\" height=\"" + upload.height + "\">";
      _this.addMarkdown(html);
      _this.set('loadingImage', false);
    });

    // fail
    $uploadTarget.on('fileuploadfail', function (e, data) {
      // hide upload status
      _this.set('loadingImage', false);
      // deal with meaningful errors first
      if (data.jqXHR) {
        switch (data.jqXHR.status) {
          // 0 == cancel from the user
          case 0: return;
          // 413 == entity too large, returned usually from nginx
          case 413:
            bootbox.alert(Em.String.i18n('post.errors.upload_too_large', {max_size_kb: Discourse.SiteSettings.max_upload_size_kb}));
            return;
        }
      }
      // otherwise, display a generic error message
      bootbox.alert(Em.String.i18n('post.errors.upload'));
    });

    // I hate to use Em.run.later, but I don't think there's a way of waiting for a CSS transition
    // to finish.
    return Em.run.later(jQuery, (function() {
      var replyTitle = $('#reply-title');
      _this.resize();
      if (replyTitle.length) {
        return replyTitle.putCursorAtEnd();
      } else {
        return $wmdInput.putCursorAtEnd();
      }
    }), 300);
  },

  addMarkdown: function(text) {
    var ctrl = $('#wmd-input').get(0),
        caretPosition = Discourse.Utilities.caretPosition(ctrl),
        current = this.get('content.reply');
    this.set('content.reply', current.substring(0, caretPosition) + text + current.substring(caretPosition, current.length));
    return Em.run.next(function() {
      return Discourse.Utilities.setCaretPosition(ctrl, caretPosition + text.length);
    });
  },

  // Uses javascript to get the image sizes from the preview, if present
  imageSizes: function() {
    var result = {};
    $('#wmd-preview img').each(function(i, e) {
      var $img = $(e);
      result[$img.prop('src')] = {
        width: $img.width(),
        height: $img.height()
      };
    });
    return result;
  },

  childDidInsertElement: function(e) {
    return this.initEditor();
  }
});

// not sure if this is the right way, keeping here for now, we could use a mixin perhaps
Discourse.NotifyingTextArea = Ember.TextArea.extend({
  placeholder: function() {
    return Em.String.i18n(this.get('placeholderKey'));
  }.property('placeholderKey'),

  didInsertElement: function() {
    return this.get('parent').childDidInsertElement(this);
  }
});

RSVP.EventTarget.mixin(Discourse.ComposerView);
