require 'spec_helper'
require 'jobs'

describe Jobs::UserEmail do

  before do
    SiteSetting.stubs(:email_time_window_mins).returns(10)
  end

  let(:user) { Fabricate(:user, last_seen_at: 11.minutes.ago ) }
  let(:mailer) { Mail::Message.new(to: user.email) }

  it "raises an error when there is no user" do
    lambda { Jobs::UserEmail.new.execute(type: :digest) }.should raise_error(Discourse::InvalidParameters)
  end

  it "raises an error when there is no type" do
    lambda { Jobs::UserEmail.new.execute(user_id: user.id) }.should raise_error(Discourse::InvalidParameters)
  end

  it "raises an error when the type doesn't exist" do
    lambda { Jobs::UserEmail.new.execute(type: :no_method, user_id: user.id) }.should raise_error(Discourse::InvalidParameters)
  end

  it "doesn't call the mailer when the user is missing" do
    UserNotifications.expects(:digest).never
    Jobs::UserEmail.new.execute(type: :digest, user_id: 1234)
  end


  context 'to_address' do
    it 'overwrites a to_address when present' do
      UserNotifications.expects(:authorize_email).returns(mailer)
      EmailSender.any_instance.expects(:send)
      Jobs::UserEmail.new.execute(type: :authorize_email, user_id: user.id, to_address: 'jake@adventuretime.ooo')
      mailer.to.should == ['jake@adventuretime.ooo']
    end
  end

  context "recently seen" do
    let(:post) { Fabricate(:post, user: user) }

    it "doesn't send an email to a user that's been recently seen" do
      user.update_column(:last_seen_at, 9.minutes.ago)
      EmailSender.any_instance.expects(:send).never
      Jobs::UserEmail.new.execute(type: :private_message, user_id: user.id, post_id: post.id)
    end
  end

  context 'args' do

    it 'passes a token as an argument when a token is present' do
      UserNotifications.expects(:forgot_password).with(user, {email_token: 'asdfasdf'}).returns(mailer)
      EmailSender.any_instance.expects(:send)
      Jobs::UserEmail.new.execute(type: :forgot_password, user_id: user.id, email_token: 'asdfasdf')
    end

    context "post" do
      let(:post) { Fabricate(:post, user: user) }

      it 'passes a post as an argument when a post_id is present' do
        UserNotifications.expects(:private_message).with(user, {post: post}).returns(mailer)
        EmailSender.any_instance.expects(:send)
        Jobs::UserEmail.new.execute(type: :private_message, user_id: user.id, post_id: post.id)
      end

      it "doesn't send the email if you've seen the post" do
        EmailSender.any_instance.expects(:send).never
        PostTiming.record_timing(topic_id: post.topic_id, user_id: user.id, post_number: post.post_number, msecs: 6666)
        Jobs::UserEmail.new.execute(type: :private_message, user_id: user.id, post_id: post.id)
      end

      it "doesn't send the email if the user deleted the post" do
        EmailSender.any_instance.expects(:send).never
        post.update_column(:user_deleted, true)
        Jobs::UserEmail.new.execute(type: :private_message, user_id: user.id, post_id: post.id)
      end

    end


    context 'notification' do
      let!(:notification) { Fabricate(:notification, user: user)}

      it 'passes a notification as an argument when a notification_id is present' do
        EmailSender.any_instance.expects(:send)
        UserNotifications.expects(:user_mentioned).with(user, notification: notification).returns(mailer)
        Jobs::UserEmail.new.execute(type: :user_mentioned, user_id: user.id, notification_id: notification.id)
      end

      it "doesn't send the email if the notification has been seen" do
        EmailSender.any_instance.expects(:send).never
        notification.update_column(:read, true)
        Jobs::UserEmail.new.execute(type: :user_mentioned, user_id: user.id, notification_id: notification.id)
      end

    end

  end


end

