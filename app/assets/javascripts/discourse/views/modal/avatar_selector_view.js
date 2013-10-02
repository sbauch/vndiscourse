/**
  This view handles the avatar selection interface

  @class AvatarSelectorView
  @extends Discourse.ModalBodyView
  @namespace Discourse
  @module Discourse
**/
Discourse.AvatarSelectorView = Discourse.ModalBodyView.extend({
  templateName: 'modal/avatar_selector',
  classNames: ['avatar-selector'],
  title: I18n.t('user.change_avatar.title'),
  uploading: false,
  uploadProgress: 0,
  useGravatar: Em.computed.not("controller.use_uploaded_avatar"),
  canSaveAvatarSelection: Em.computed.or("useGravatar", "controller.has_uploaded_avatar"),
  saveDisabled: Em.computed.not("canSaveAvatarSelection"),

  didInsertElement: function() {
    var view = this;
    var $upload = $("#avatar-input");

    this._super();

    // simulate a click on the hidden file input when clicking on our fake file input
    $("#fake-avatar-input").on("click", function(e) {
      // do *NOT* use the cached `$upload` variable, because fileupload is cloning & replacing the input
      // cf. https://github.com/blueimp/jQuery-File-Upload/wiki/Frequently-Asked-Questions#why-is-the-file-input-field-cloned-and-replaced-after-each-selection
      $("#avatar-input").click();
      e.preventDefault();
    });

    // define the upload endpoint
    $upload.fileupload({
      url: Discourse.getURL("/users/" + this.get("controller.username") + "/preferences/avatar"),
      dataType: "json",
      timeout: 20000,
      fileInput: $upload
    });

    // when a file has been selected
    $upload.on("fileuploadadd", function (e, data) {
      view.set("uploading", true);
    });

    // when there is a progression for the upload
    $upload.on("fileuploadprogressall", function (e, data) {
      var progress = parseInt(data.loaded / data.total * 100, 10);
      view.set("uploadProgress", progress);
    });

    // when the upload is successful
    $upload.on("fileuploaddone", function (e, data) {
      // set some properties
      view.get("controller").setProperties({
        has_uploaded_avatar: true,
        use_uploaded_avatar: true,
        uploaded_avatar_template: data.result.url
      });
    });

    // when there has been an error with the upload
    $upload.on("fileuploadfail", function (e, data) {
      Discourse.Utilities.displayErrorForUpload(data);
    });

    // when the upload is done
    $upload.on("fileuploadalways", function (e, data) {
      view.setProperties({ uploading: false, uploadProgress: 0 });
    });
  },

  willDestroyElement: function() {
    $("#fake-avatar-input").off("click");
    $("#avatar-input").fileupload("destroy");
  },

  // *HACK* used to select the proper radio button
  selectedChanged: function() {
    var view = this;
    Em.run.next(function() {
      var value = view.get('controller.use_uploaded_avatar') ? 'uploaded_avatar' : 'gravatar';
      view.$('input:radio[name="avatar"]').val([value]);
    });
  }.observes('controller.use_uploaded_avatar'),

  uploadButtonText: function() {
    return this.get("uploading") ? I18n.t("uploading") : I18n.t("upload");
  }.property("uploading")

});
