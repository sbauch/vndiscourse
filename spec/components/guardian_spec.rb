require 'spec_helper'
require 'guardian'

describe Guardian do

  let(:user) { Fabricate(:user) }
  let(:moderator) { Fabricate(:moderator) }
  let(:admin) { Fabricate(:admin) }
  let(:another_admin) { Fabricate(:another_admin) }
  let(:coding_horror) { Fabricate(:coding_horror) }

  let(:topic) { Fabricate(:topic, user: user) }
  let(:post) { Fabricate(:post, topic: topic, user: topic.user) }

  it 'can be created without a user (not logged in)' do
    lambda { Guardian.new }.should_not raise_error
  end

  it 'can be instantiaed with a user instance' do
    lambda { Guardian.new(user) }.should_not raise_error
  end

  describe 'post_can_act?' do
    let(:post) { Fabricate(:post) }
    let(:user) { Fabricate(:user) }

    it "returns false when the user is nil" do
      Guardian.new(nil).post_can_act?(post, :like).should be_false
    end

    it "returns false when the post is nil" do
      Guardian.new(user).post_can_act?(nil, :like).should be_false
    end

    it "returns false when the topic is archived" do
      post.topic.archived = true
      Guardian.new(user).post_can_act?(post, :like).should be_false
    end

    it "returns false when liking yourself" do
      Guardian.new(post.user).post_can_act?(post, :like).should be_false
    end

    it "returns false when you've already done it" do
      Guardian.new(user).post_can_act?(post, :like, taken_actions: {PostActionType.Types[:like] => 1}).should be_false
    end

    it "returns false when you already flagged a post" do 
      Guardian.new(user).post_can_act?(post, :off_topic, taken_actions: {PostActionType.Types[:spam] => 1}).should be_false
    end

    describe "trust levels" do
      it "returns true for a new user liking something" do
        user.trust_level = TrustLevel.Levels[:new]
        Guardian.new(user).post_can_act?(post, :like).should be_true
      end

      it "returns false for a new user flagging something as spam" do
        user.trust_level = TrustLevel.Levels[:new]
        Guardian.new(user).post_can_act?(post, :spam).should be_false
      end

      it "returns false for a new user flagging something as off topic" do
        user.trust_level = TrustLevel.Levels[:new]
        Guardian.new(user).post_can_act?(post, :off_topic).should be_false
      end
    end
  end


  describe "can_clear_flags" do    
    let(:post) { Fabricate(:post) }
    let(:user) { post.user }
    let(:moderator) { Fabricate(:moderator) }

    it "returns false when the user is nil" do
      Guardian.new(nil).can_clear_flags?(post).should be_false
    end

    it "returns false when the post is nil" do
      Guardian.new(moderator).can_clear_flags?(nil).should be_false
    end

    it "returns false when the user is not a moderator" do
      Guardian.new(user).can_clear_flags?(post).should be_false
    end

    it "returns true when the user is a moderator" do
      Guardian.new(moderator).can_clear_flags?(post).should be_true
    end

  end

  describe 'can_send_private_message' do
    let(:user) { Fabricate(:user) }
    let(:another_user) { Fabricate(:user) }

    it "returns false when the user is nil" do
      Guardian.new(nil).can_send_private_message?(user).should be_false
    end    

    it "returns false when the target user is nil" do
      Guardian.new(user).can_send_private_message?(nil).should be_false
    end

    it "returns false when the target is the same as the user" do
      Guardian.new(user).can_send_private_message?(user).should be_false
    end

    it "returns false when you are untrusted" do
      user.trust_level = TrustLevel.Levels[:new]
      Guardian.new(user).can_send_private_message?(another_user).should be_false
    end

    it "returns true to another user" do
      Guardian.new(user).can_send_private_message?(another_user).should be_true
    end
  end

  describe 'can_reply_as_new_topic' do
    let(:user) { Fabricate(:user) }
    let(:topic) { Fabricate(:topic) }

    it "returns false for a non logged in user" do
      Guardian.new(nil).can_reply_as_new_topic?(topic).should be_false
    end

    it "returns false for a nil topic" do
      Guardian.new(user).can_reply_as_new_topic?(nil).should be_false
    end

    it "returns false for an untrusted user" do
      user.trust_level = TrustLevel.Levels[:new]
      Guardian.new(user).can_reply_as_new_topic?(topic).should be_false
    end

    it "returns true for a trusted user" do
      Guardian.new(user).can_reply_as_new_topic?(topic).should be_true
    end
  end

  describe 'can_see_post_actors?' do

    let(:topic) { Fabricate(:topic, user: coding_horror)}

    it 'returns false when the post is nil' do
      Guardian.new(user).can_see_post_actors?(nil, PostActionType.Types[:like]).should be_false
    end

    it 'returns true for likes' do
      Guardian.new(user).can_see_post_actors?(topic, PostActionType.Types[:like]).should be_true
    end

    it 'returns false for bookmarks' do
      Guardian.new(user).can_see_post_actors?(topic, PostActionType.Types[:bookmark]).should be_false
    end

    it 'returns false for off-topic flags' do
      Guardian.new(user).can_see_post_actors?(topic, PostActionType.Types[:off_topic]).should be_false
    end

    it 'returns false for spam flags' do
      Guardian.new(user).can_see_post_actors?(topic, PostActionType.Types[:spam]).should be_false
    end

    it 'returns true for public votes' do
      Guardian.new(user).can_see_post_actors?(topic, PostActionType.Types[:vote]).should be_true
    end

    it 'returns false for private votes' do
      topic.expects(:has_meta_data_boolean?).with(:private_poll).returns(true)
      Guardian.new(user).can_see_post_actors?(topic, PostActionType.Types[:vote]).should be_false
    end

  end

  describe 'can_impersonate?' do
    it 'returns false when the target is nil' do
      Guardian.new(admin).can_impersonate?(nil).should be_false
    end

    it 'returns false when the user is nil' do
      Guardian.new.can_impersonate?(user).should be_false
    end

    it "doesn't allow a non-admin to impersonate someone" do
      Guardian.new(coding_horror).can_impersonate?(user).should be_false
    end

    it "doesn't allow an admin to impersonate themselves" do
      Guardian.new(admin).can_impersonate?(admin).should be_false
    end

    it "doesn't allow an admin to impersonate another admin" do
      Guardian.new(admin).can_impersonate?(another_admin).should be_false
    end

    it "allows an admin to impersonate a regular user" do
      Guardian.new(admin).can_impersonate?(user).should be_true
    end

    it "allows an admin to impersonate a moderator" do
      Guardian.new(admin).can_impersonate?(moderator).should be_true
    end

  end

  describe 'can_invite_to?' do
    let(:topic) { Fabricate(:topic) }
    let(:user) { topic.user }
    let(:moderator) { Fabricate(:moderator) }

    it 'returns false with a nil user' do
      Guardian.new(nil).can_invite_to?(topic).should be_false
    end

    it 'returns false with a nil object' do
      Guardian.new(moderator).can_invite_to?(nil).should be_false
    end

    it 'returns true for a moderator to invite' do
      Guardian.new(moderator).can_invite_to?(topic).should be_true
    end

    it 'returns false when the site requires approving users' do
      SiteSetting.expects(:must_approve_users?).returns(true)
      Guardian.new(moderator).can_invite_to?(topic).should be_false
    end

    it 'returns false for a regular user to invite' do
      Guardian.new(user).can_invite_to?(topic).should be_false
    end

  end

  describe 'can_see?' do

    it 'returns false with a nil object' do
      Guardian.new.can_see?(nil).should be_false
    end

    describe 'a Topic' do
      it 'allows non logged in users to view topics' do
        Guardian.new.can_see?(topic).should be_true
      end
    end
  end

  describe 'can_create?' do

    describe 'a Category' do

      it 'returns false when not logged in' do
        Guardian.new.can_create?(Category).should be_false
      end

      it 'returns false when a regular user' do
        Guardian.new(user).can_create?(Category).should be_false
      end

      it 'returns true when a moderator' do
        Guardian.new(moderator).can_create?(Category).should be_true
      end

      it 'returns true when an admin' do
        Guardian.new(admin).can_create?(Category).should be_true
      end
    end

    describe 'a Post' do

      it "is false when not logged in" do
        Guardian.new.can_create?(Post, topic).should be_false
      end

      it 'is true for a regular user' do
        Guardian.new(topic.user).can_create?(Post, topic).should be_true
      end

      it "is false when you can't see the topic" do
        Guardian.any_instance.expects(:can_see?).with(topic).returns(false)
        Guardian.new(topic.user).can_create?(Post, topic).should be_false
      end

      context 'closed topic' do
        before do
          topic.closed = true
        end

        it "doesn't allow new posts from regular users" do
          Guardian.new(topic.user).can_create?(Post, topic).should be_false
        end

        it 'allows editing of posts' do
          Guardian.new(topic.user).can_edit?(post).should be_true
        end

        it "allows new posts from moderators" do
          Guardian.new(moderator).can_create?(Post, topic).should be_true
        end

        it "allows new posts from admins" do
          Guardian.new(admin).can_create?(Post, topic).should be_true
        end
      end

      context 'archived topic' do
        before do
          topic.archived = true
        end

        context 'regular users' do

          it "doesn't allow new posts from regular users" do
            Guardian.new(coding_horror).can_create?(Post, topic).should be_false
          end

          it 'allows editing of posts' do
            Guardian.new(coding_horror).can_edit?(post).should be_false
          end

        end
  
        it "allows new posts from moderators" do
          Guardian.new(moderator).can_create?(Post, topic).should be_true
        end

        it "allows new posts from admins" do
          Guardian.new(admin).can_create?(Post, topic).should be_true
        end
      end

    end

  end

  describe 'post_can_act?' do

    it "isn't allowed on nil" do
      Guardian.new(user).post_can_act?(nil, nil).should be_false
    end

    describe 'a Post' do
      
      let (:guardian) do 
        Guardian.new(user)
      end


      it "isn't allowed when not logged in" do
        Guardian.new(nil).post_can_act?(post,:vote).should be_false
      end

      it "is allowed as a regular user" do
        guardian.post_can_act?(post,:vote).should be_true
      end

      it "doesn't allow voting if the user has an action from voting already" do
        guardian.post_can_act?(post,:vote,taken_actions: {PostActionType.Types[:vote] => 1}).should be_false
      end

      it "allows voting if the user has performed a different action" do
        guardian.post_can_act?(post,:vote,taken_actions: {PostActionType.Types[:like] => 1}).should be_true
      end      

      it "isn't allowed on archived topics" do
        topic.archived = true
        Guardian.new(user).post_can_act?(post,:like).should be_false
      end

       
      describe 'multiple voting' do

        it "isn't allowed if the user voted and the topic doesn't allow multiple votes" do
          Topic.any_instance.expects(:has_meta_data_boolean?).with(:single_vote).returns(true)
          Guardian.new(user).can_vote?(post, :voted_in_topic => true).should be_false
        end

        it "is allowed if the user voted and the topic doesn't allow multiple votes" do
          Guardian.new(user).can_vote?(post, :voted_in_topic => false).should be_true
        end
      end

    end
  end

  describe "can_recover_post?" do

    it "returns false for a nil user" do
      Guardian.new(nil).can_recover_post?(post).should be_false
    end

    it "returns false for a nil object" do
      Guardian.new(user).can_recover_post?(nil).should be_false
    end

    it "returns false for a regular user" do
      Guardian.new(user).can_recover_post?(post).should be_false
    end

    it "returns true for a moderator" do
      Guardian.new(moderator).can_recover_post?(post).should be_true
    end

  end

  describe 'can_edit?' do

    it 'returns false with a nil object' do
      Guardian.new(user).can_edit?(nil).should be_false
    end

    describe 'a Post' do

      it 'returns false when not logged in' do
        Guardian.new.can_edit?(post).should be_false
      end

      it 'returns true if you want to edit your own post' do
        Guardian.new(post.user).can_edit?(post).should be_true
      end

      it 'returns false if another regular user tries to edit your post' do
        Guardian.new(coding_horror).can_edit?(post).should be_false
      end

      it 'returns true as a moderator' do
        Guardian.new(moderator).can_edit?(post).should be_true
      end

      it 'returns true as an admin' do
        Guardian.new(admin).can_edit?(post).should be_true
      end
    end

    describe 'a Topic' do

      it 'returns false when not logged in' do
        Guardian.new.can_edit?(topic).should be_false
      end

      it 'returns true for editing your own post' do
        Guardian.new(topic.user).can_edit?(topic).should be_true
      end


      it 'returns false as a regular user' do
        Guardian.new(coding_horror).can_edit?(topic).should be_false
      end

      it 'returns true as a moderator' do
        Guardian.new(moderator).can_edit?(topic).should be_true
      end

      it 'returns true as an admin' do
        Guardian.new(admin).can_edit?(topic).should be_true
      end
    end

    describe 'a Category' do

      let(:category) { Fabricate(:category) }

      it 'returns false when not logged in' do
        Guardian.new.can_edit?(category).should be_false
      end

      it 'returns false as a regular user' do
        Guardian.new(category.user).can_edit?(category).should be_false
      end

      it 'returns true as a moderator' do
        Guardian.new(moderator).can_edit?(category).should be_true
      end

      it 'returns true as an admin' do
        Guardian.new(admin).can_edit?(category).should be_true
      end
    end

    describe 'a User' do

      it 'returns false when not logged in' do
        Guardian.new.can_edit?(user).should be_false
      end

      it 'returns false as a different user' do
        Guardian.new(coding_horror).can_edit?(user).should be_false
      end

      it 'returns true when trying to edit yourself' do
        Guardian.new(user).can_edit?(user).should be_true
      end      

      it 'returns false as a moderator' do
        Guardian.new(moderator).can_edit?(user).should be_false
      end

      it 'returns true as an admin' do
        Guardian.new(admin).can_edit?(user).should be_true
      end
    end

  end

  context 'can_moderate?' do

    it 'returns false with a nil object' do
      Guardian.new(user).can_moderate?(nil).should be_false
    end

    context 'a Topic' do

      it 'returns false when not logged in' do
        Guardian.new.can_moderate?(topic).should be_false
      end

      it 'returns false when not a moderator' do
        Guardian.new(user).can_moderate?(topic).should be_false
      end

      it 'returns true when a moderator' do
        Guardian.new(moderator).can_moderate?(topic).should be_true
      end

      it 'returns true when an admin' do
        Guardian.new(admin).can_moderate?(topic).should be_true
      end

    end    

  end

  context 'can_see_flags?' do

    it "returns false when there is no post" do
      Guardian.new(moderator).can_see_flags?(nil).should be_false
    end

    it "returns false when there is no user" do
      Guardian.new(nil).can_see_flags?(post).should be_false
    end

    it "allow regular uses to see flags" do
      Guardian.new(user).can_see_flags?(post).should be_false
    end

    it "allows moderators to see flags" do
      Guardian.new(moderator).can_see_flags?(post).should be_true
    end

    it "allows moderators to see flags" do
      Guardian.new(admin).can_see_flags?(post).should be_true
    end
  end

  context 'can_move_posts?' do

    it 'returns false with a nil object' do
      Guardian.new(user).can_move_posts?(nil).should be_false
    end

    context 'a Topic' do

      it 'returns false when not logged in' do
        Guardian.new.can_move_posts?(topic).should be_false
      end

      it 'returns false when not a moderator' do
        Guardian.new(user).can_move_posts?(topic).should be_false
      end

      it 'returns true when a moderator' do
        Guardian.new(moderator).can_move_posts?(topic).should be_true
      end

      it 'returns true when an admin' do
        Guardian.new(admin).can_move_posts?(topic).should be_true
      end

    end    

  end



  context 'can_delete?' do

    it 'returns false with a nil object' do
      Guardian.new(user).can_delete?(nil).should be_false
    end

    context 'a Topic' do

      it 'returns false when not logged in' do
        Guardian.new.can_delete?(topic).should be_false
      end

      it 'returns false when not a moderator' do
        Guardian.new(user).can_delete?(topic).should be_false
      end

      it 'returns true when a moderator' do
        Guardian.new(moderator).can_delete?(topic).should be_true
      end

      it 'returns true when an admin' do
        Guardian.new(admin).can_delete?(topic).should be_true
      end
    end

    context 'a Post' do

      before do
        post.post_number = 2
      end

      it 'returns false when not logged in' do
        Guardian.new.can_delete?(post).should be_false
      end

      it "returns false when trying to delete your own post that has already been deleted" do
        post.delete_by(user)
        post.reload
        Guardian.new(user).can_delete?(post).should be_false
      end

      it 'returns true when trying to delete your own post' do
        Guardian.new(user).can_delete?(post).should be_true
      end

      it "returns false when trying to delete another user's own post" do
        Guardian.new(Fabricate(:user)).can_delete?(post).should be_false
      end

      it "returns false when it's the OP, even as a moderator" do
        post.update_attribute :post_number, 1
        Guardian.new(moderator).can_delete?(post).should be_false
      end

      it 'returns true when a moderator' do
        Guardian.new(moderator).can_delete?(post).should be_true
      end

      it 'returns true when an admin' do
        Guardian.new(admin).can_delete?(post).should be_true
      end
    end

    context 'a Category' do

      let(:category) { Fabricate(:category, user: moderator) }

      it 'returns false when not logged in' do
        Guardian.new.can_delete?(category).should be_false
      end

      it 'returns false when a regular user' do
        Guardian.new(user).can_delete?(category).should be_false
      end

      it 'returns true when a moderator' do
        Guardian.new(moderator).can_delete?(category).should be_true
      end

      it 'returns true when an admin' do
        Guardian.new(admin).can_delete?(category).should be_true
      end

      it "can't be deleted if it has a forum topic" do
        category.topic_count = 10
        Guardian.new(moderator).can_delete?(category).should be_false
      end

    end

    context 'a PostAction' do
      let(:post_action) { PostAction.create(user_id: user.id, post_id: post.id, post_action_type_id: 1)}

      it 'returns false when not logged in' do
        Guardian.new.can_delete?(post_action).should be_false
      end

      it 'returns false when not the user who created it' do
        Guardian.new(coding_horror).can_delete?(post_action).should be_false
      end

      it "returns false if the window has expired" do
        post_action.created_at = 20.minutes.ago
        SiteSetting.expects(:post_undo_action_window_mins).returns(10)
        Guardian.new(user).can_delete?(post_action).should be_false
      end

      it "returns true if it's yours" do
        Guardian.new(user).can_delete?(post_action).should be_true
      end

    end

  end

  context 'can_approve?' do

    it "wont allow a non-logged in user to approve" do
      Guardian.new.can_approve?(user).should be_false
    end

    it "wont allow a non-admin to approve a user" do
      Guardian.new(coding_horror).can_approve?(user).should be_false
    end

    it "returns false when the user is already approved" do
      user.approved = true
      Guardian.new(admin).can_approve?(user).should be_false
    end

    it "allows an admin to approve a user" do
      Guardian.new(admin).can_approve?(user).should be_true
    end

    it "allows a moderator to approve a user" do
      Guardian.new(moderator).can_approve?(user).should be_true
    end


  end

  context 'can_grant_admin?' do
    it "wont allow a non logged in user to grant an admin's access" do
      Guardian.new.can_grant_admin?(another_admin).should be_false
    end

    it "wont allow a regular user to revoke an admin's access" do
      Guardian.new(user).can_grant_admin?(another_admin).should be_false
    end

    it 'wont allow an admin to grant their own access' do
      Guardian.new(admin).can_grant_admin?(admin).should be_false     
    end

    it "allows an admin to grant a regular user access" do
      Guardian.new(admin).can_grant_admin?(user).should be_true     
    end
  end

  context 'can_revoke_admin?' do
    it "wont allow a non logged in user to revoke an admin's access" do
      Guardian.new.can_revoke_admin?(another_admin).should be_false
    end

    it "wont allow a regular user to revoke an admin's access" do
      Guardian.new(user).can_revoke_admin?(another_admin).should be_false
    end

    it 'wont allow an admin to revoke their own access' do
      Guardian.new(admin).can_revoke_admin?(admin).should be_false     
    end

    it "allows an admin to revoke another admin's access" do
      Guardian.new(admin).can_revoke_admin?(another_admin).should be_true     
    end
  end

  context 'can_grant_moderation?' do
    it "wont allow a non logged in user to grant an moderator's access" do
      Guardian.new.can_grant_moderation?(user).should be_false
    end

    it "wont allow a regular user to revoke an modearator's access" do
      Guardian.new(user).can_grant_moderation?(moderator).should be_false
    end

    it 'wont allow an admin to grant their own access' do
      Guardian.new(admin).can_grant_moderation?(admin).should be_false     
    end

    it 'wont allow an admin to grant it to an already moderator' do
      Guardian.new(admin).can_grant_moderation?(moderator).should be_false     
    end

    it "allows an admin to grant a regular user access" do
      Guardian.new(admin).can_grant_moderation?(user).should be_true     
    end
  end

  context 'can_revoke_moderation?' do
    it "wont allow a non logged in user to revoke an moderator's access" do
      Guardian.new.can_revoke_moderation?(moderator).should be_false
    end

    it "wont allow a regular user to revoke an moderator's access" do
      Guardian.new(user).can_revoke_moderation?(moderator).should be_false
    end

    it 'wont allow an moderator to revoke their own moderator' do
      Guardian.new(moderator).can_revoke_moderation?(moderator).should be_false     
    end

    it "allows an admin to revoke a moderator's access" do
      Guardian.new(admin).can_revoke_moderation?(moderator).should be_true     
    end
  end

  context "can_see_pending_invites_from?" do

    it 'is false without a logged in user' do
      Guardian.new(nil).can_see_pending_invites_from?(user).should be_false
    end

    it 'is false without a user to look at' do
      Guardian.new(user).can_see_pending_invites_from?(nil).should be_false
    end

    it 'is true when looking at your own invites' do
      Guardian.new(user).can_see_pending_invites_from?(user).should be_true
    end

  end

end
 
