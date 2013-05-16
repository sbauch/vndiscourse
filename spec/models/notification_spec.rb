require 'spec_helper'

describe Notification do
  before do
    ActiveRecord::Base.observers.enable :all
  end

  it { should validate_presence_of :notification_type }
  it { should validate_presence_of :data }

  it { should belong_to :user }
  it { should belong_to :topic }

  describe 'post' do
    let(:topic) { Fabricate(:topic) }
    let(:post_args) do
      {user: topic.user, topic: topic}
    end

    let(:coding_horror) { Fabricate(:coding_horror) }

    describe 'replies' do

      let(:post) { Fabricate(:post, post_args.merge(raw: "Hello @CodingHorror")) }

      it 'notifies the poster on reply' do
        lambda {
          @reply = Fabricate(:basic_reply, user: coding_horror, topic: post.topic)
        }.should change(post.user.notifications, :count).by(1)
      end

      it "doesn't notify the poster when they reply to their own post" do
        lambda {
          @reply = Fabricate(:basic_reply, user: post.user, topic: post.topic)
        }.should_not change(post.user.notifications, :count).by(1)
      end
    end

    describe 'watching' do
      it "does notify watching users of new posts" do
        post = Fabricate(:post, post_args)
        user2 = Fabricate(:coding_horror)
        post_args[:topic].notify_watch!(user2)
        lambda {
          Fabricate(:post, user: post.user, topic: post.topic)
        }.should change(user2.notifications, :count).by(1)
      end
    end

    describe 'muting' do
      it "does not notify users of new posts" do
        post = Fabricate(:post, post_args)
        user = post_args[:user]
        user2 = Fabricate(:coding_horror)

        post_args[:topic].notify_muted!(user)
        lambda {
          Fabricate(:post, user: user2, topic: post.topic, raw: 'hello @' + user.username)
        }.should change(user.notifications, :count).by(0)
      end
    end

  end
  describe 'unread counts' do

    let(:user) { Fabricate(:user) }

    context 'a regular notification' do
      it 'increases unread_notifications' do
        lambda { Fabricate(:notification, user: user); user.reload }.should change(user, :unread_notifications)
      end

      it "doesn't increase unread_private_messages" do
        lambda { Fabricate(:notification, user: user); user.reload }.should_not change(user, :unread_private_messages)
      end
    end

    context 'a private message' do
      it "doesn't increase unread_notifications" do
        lambda { Fabricate(:private_message_notification, user: user); user.reload }.should_not change(user, :unread_notifications)
      end

      it "increases unread_private_messages" do
        lambda { Fabricate(:private_message_notification, user: user); user.reload }.should change(user, :unread_private_messages)
      end
    end

  end

  describe 'message bus' do

    it 'updates the notification count on create' do
      Notification.any_instance.expects(:refresh_notification_count).returns(nil)
      Fabricate(:notification)
    end

    context 'destroy' do

      let!(:notification) { Fabricate(:notification) }

      it 'updates the notification count on destroy' do
        Notification.any_instance.expects(:refresh_notification_count).returns(nil)
        notification.destroy
      end

    end
  end

  describe '@mention' do

    it "calls email_user_mentioned on creating a notification" do
      UserEmailObserver.any_instance.expects(:email_user_mentioned).with(instance_of(Notification))
      Fabricate(:notification)
    end

  end

  describe '@mention' do
    it "calls email_user_quoted on creating a quote notification" do
      UserEmailObserver.any_instance.expects(:email_user_quoted).with(instance_of(Notification))
      Fabricate(:quote_notification)
    end
  end

  describe 'private message' do
    before do
      @topic = Fabricate(:private_message_topic)
      @post = Fabricate(:post, topic: @topic, user: @topic.user)
      @target = @post.topic.topic_allowed_users.reject{|a| a.user_id == @post.user_id}[0].user
    end

    it 'should create a private message notification' do
      @target.notifications.first.notification_type.should == Notification.types[:private_message]
    end

    it 'should not add a pm notification for the creator' do
      @post.user.unread_notifications.should == 0
    end
  end

  describe '.post' do

    let(:post) { Fabricate(:post) }
    let!(:notification) { Fabricate(:notification, user: post.user, topic: post.topic, post_number: post.post_number) }

    it 'returns the post' do
      notification.post.should == post
    end

  end

  describe 'data' do
    let(:notification) { Fabricate.build(:notification) }

    it 'should have a data hash' do
      notification.data_hash.should be_present
    end

    it 'should have the data within the json' do
      notification.data_hash[:poison].should == 'ivy'
    end
  end

  describe 'saw_regular_notification_id' do
    it 'correctly updates the read state' do
      user = Fabricate(:user)

      pm = Notification.create!(read: false,
                           user_id: user.id,
                           topic_id: 2,
                           post_number: 1,
                           data: '[]',
                           notification_type: Notification.types[:private_message])

      other = Notification.create!(read: false,
                           user_id: user.id,
                           topic_id: 2,
                           post_number: 1,
                           data: '[]',
                           notification_type: Notification.types[:mentioned])


      user.saw_notification_id(other.id)
      user.reload

      user.unread_notifications.should == 0
      user.unread_private_messages.should == 1
    end
  end

  describe 'mark_posts_read' do
    it "marks multiple posts as read if needed" do
      user = Fabricate(:user)

      notifications = (1..3).map do |i|
        Notification.create!(read: false, user_id: user.id, topic_id: 2, post_number: i, data: '[]', notification_type: 1)
      end
      Notification.create!(read: true, user_id: user.id, topic_id: 2, post_number: 4, data: '[]', notification_type: 1)

      Notification.mark_posts_read(user,2,[1,2,3,4]).should == 3
    end
  end

  describe 'ensure consistency' do
    it 'deletes notifications if post is missing or deleted' do

      ActiveRecord::Base.observers.disable :all
      p = Fabricate(:post)
      p2 = Fabricate(:post)

      Notification.create!(read: false, user_id: p.user_id, topic_id: p.topic_id, post_number: p.post_number, data: '[]',
                           notification_type: Notification.types[:private_message])
      Notification.create!(read: false, user_id: p2.user_id, topic_id: p2.topic_id, post_number: p2.post_number, data: '[]',
                           notification_type: Notification.types[:private_message])

      Notification.create!(read: false, user_id: p2.user_id, topic_id: p2.topic_id, post_number: p2.post_number, data: '[]',
                           notification_type: Notification.types[:liked])
      p2.trash!

      # we may want to make notification "trashable" but for now we nuke pm notifications from deleted topics/posts
      Notification.ensure_consistency!

      Notification.count.should == 2
    end
  end

end
