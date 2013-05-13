require 'spec_helper'
require_dependency 'post_destroyer'

describe PostAction do

  before do
    ImageSorcery.any_instance.stubs(:convert).returns(false)
  end

  it { should belong_to :user }
  it { should belong_to :post }
  it { should belong_to :post_action_type }
  it { should rate_limit }

  let(:moderator) { Fabricate(:moderator) }
  let(:codinghorror) { Fabricate(:coding_horror) }
  let(:post) { Fabricate(:post) }
  let(:bookmark) { PostAction.new(user_id: post.user_id, post_action_type_id: PostActionType.types[:bookmark] , post_id: post.id) }

  describe "messaging" do

    it "notify moderators integration test" do
      mod = moderator
      action = PostAction.act(codinghorror, post, PostActionType.types[:notify_moderators], "this is my special long message");

      posts = Post.joins(:topic)
                  .select('posts.id, topics.subtype')
                  .where('topics.archetype' => Archetype.private_message)
                  .to_a

      posts.count.should == 1
      action.related_post_id.should == posts[0].id.to_i
      posts[0].subtype.should == TopicSubtype.notify_moderators

    end

    describe 'notify_moderators' do
      before do
        PostAction.stubs(:create)
        PostAction.expects(:target_moderators).returns("moderators")
      end

      it "sends an email to all moderators if selected" do
        post = build(:post, id: 1000)
        PostCreator.any_instance.expects(:create).returns(post)
        PostAction.act(build(:user), build(:post), PostActionType.types[:notify_moderators], "this is my special message");
      end
    end

    describe "notify_user" do
      before do
        PostAction.stubs(:create)
        post = build(:post)
        post.user = build(:user)
      end

      it "sends an email to user if selected" do
        PostCreator.any_instance.expects(:create).returns(build(:post))
        PostAction.act(build(:user), post, PostActionType.types[:notify_user], "this is my special message");
      end
    end
  end

  describe "flag counts" do
    before do
      PostAction.update_flagged_posts_count
    end

    it "increments the numbers correctly" do
      PostAction.flagged_posts_count.should == 0

      PostAction.act(codinghorror, post, PostActionType.types[:off_topic])
      PostAction.flagged_posts_count.should == 1

      PostAction.clear_flags!(post, -1)
      PostAction.flagged_posts_count.should == 0
    end

    it "should reset counts when a topic is deleted" do
      PostAction.act(codinghorror, post, PostActionType.types[:off_topic])
      post.topic.trash!
      PostAction.flagged_posts_count.should == 0
    end

  end

  describe "when a user bookmarks something" do
    it "increases the post's bookmark count when saved" do
      lambda { bookmark.save; post.reload }.should change(post, :bookmark_count).by(1)
    end

    it "increases the forum topic's bookmark count when saved" do
      lambda { bookmark.save; post.topic.reload }.should change(post.topic, :bookmark_count).by(1)
    end

    describe 'when deleted' do

      before do
        bookmark.save
        post.reload
        @topic = post.topic
        @topic.reload
        bookmark.deleted_at = DateTime.now
        bookmark.save
      end

      it 'reduces the bookmark count of the post' do
        lambda { post.reload }.should change(post, :bookmark_count).by(-1)
      end

      it 'reduces the bookmark count of the forum topic' do
        lambda { @topic.reload }.should change(post.topic, :bookmark_count).by(-1)
      end
    end
  end

  describe 'when a user likes something' do
    it 'should increase the post counts when a user likes' do
      lambda {
        PostAction.act(codinghorror, post, PostActionType.types[:like])
        post.reload
      }.should change(post, :like_count).by(1)
    end

    it 'should increase the forum topic like count when a user likes' do
      lambda {
        PostAction.act(codinghorror, post, PostActionType.types[:like])
        post.topic.reload
      }.should change(post.topic, :like_count).by(1)
    end
  end

  describe 'when a user votes for something' do
    it 'should increase the vote counts when a user votes' do
      lambda {
        PostAction.act(codinghorror, post, PostActionType.types[:vote])
        post.reload
      }.should change(post, :vote_count).by(1)
    end

    it 'should increase the forum topic vote count when a user votes' do
      lambda {
        PostAction.act(codinghorror, post, PostActionType.types[:vote])
        post.topic.reload
      }.should change(post.topic, :vote_count).by(1)
    end
  end

  describe 'flagging' do

    it 'does not allow you to flag stuff with 2 reasons' do
      post = Fabricate(:post)
      u1 = Fabricate(:evil_trout)
      PostAction.act(u1, post, PostActionType.types[:spam])
      lambda { PostAction.act(u1, post, PostActionType.types[:off_topic]) }.should raise_error(PostAction::AlreadyActed)
    end

    it 'allows you to flag stuff with another reason' do
      post = Fabricate(:post)
      u1 = Fabricate(:evil_trout)
      PostAction.act(u1, post, PostActionType.types[:spam])
      PostAction.remove_act(u1, post, PostActionType.types[:spam])
      lambda { PostAction.act(u1, post, PostActionType.types[:off_topic]) }.should_not raise_error(PostAction::AlreadyActed)
    end

    it 'should update counts when you clear flags' do
      post = Fabricate(:post)
      u1 = Fabricate(:evil_trout)
      PostAction.act(u1, post, PostActionType.types[:spam])

      post.reload
      post.spam_count.should == 1

      PostAction.clear_flags!(post, -1)
      post.reload

      post.spam_count.should == 0
    end

    it 'should follow the rules for automatic hiding workflow' do
      post = Fabricate(:post)
      u1 = Fabricate(:evil_trout)
      u2 = Fabricate(:walter_white)
      admin = Fabricate(:admin) # we need an admin for the messages

      SiteSetting.flags_required_to_hide_post = 2

      PostAction.act(u1, post, PostActionType.types[:spam])
      PostAction.act(u2, post, PostActionType.types[:spam])

      post.reload

      post.hidden.should.should be_true
      post.hidden_reason_id.should == Post.hidden_reasons[:flag_threshold_reached]
      post.topic.visible.should be_false

      post.revise(post.user, post.raw + " ha I edited it ")
      post.reload

      post.hidden.should be_false
      post.hidden_reason_id.should be_nil
      post.topic.visible.should be_true

      PostAction.act(u1, post, PostActionType.types[:spam])
      PostAction.act(u2, post, PostActionType.types[:off_topic])

      post.reload

      post.hidden.should be_true
      post.hidden_reason_id.should == Post.hidden_reasons[:flag_threshold_reached_again]

      post.revise(post.user, post.raw + " ha I edited it again ")

      post.reload

      post.hidden.should be_true
      post.hidden_reason_id.should == Post.hidden_reasons[:flag_threshold_reached_again]
    end
  end

  it "prevents user to act twice at the same time" do
    post = Fabricate(:post)
    user = Fabricate(:evil_trout)

    # flags are already being tested
    all_types_except_flags = PostActionType.types.except(PostActionType.flag_types)
    all_types_except_flags.values.each do |action|
      lambda do
        PostAction.act(user, post, action)
        PostAction.act(user, post, action)
      end.should raise_error(PostAction::AlreadyActed)
    end
  end

end
