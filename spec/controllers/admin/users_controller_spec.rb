require 'spec_helper'

describe Admin::UsersController do

  it 'is a subclass of AdminController' do
    (Admin::UsersController < Admin::AdminController).should be_true
  end

  context 'while logged in as an admin' do
    before do
      @user = log_in(:admin)
    end

    context '.index' do
      it 'returns success' do
        xhr :get, :index
        response.should be_success
      end

      it 'returns JSON' do
        xhr :get, :index
        ::JSON.parse(response.body).should be_present
      end
    end

    describe '.show' do
      context 'an existing user' do
        it 'returns success' do
          xhr :get, :show, id: @user.username
          response.should be_success
        end
      end

      context 'an existing user' do
        it 'returns success' do
          xhr :get, :show, id: 'foobar'
          response.should_not be_success
        end
      end
    end

    context '.approve_bulk' do

      let(:evil_trout) { Fabricate(:evil_trout) }

      it "does nothing without uesrs" do
        User.any_instance.expects(:approve).never
        xhr :put, :approve_bulk
      end

      it "won't approve the user when not allowed" do
        Guardian.any_instance.expects(:can_approve?).with(evil_trout).returns(false)
        User.any_instance.expects(:approve).never
        xhr :put, :approve_bulk, users: [evil_trout.id]
      end

      it "approves the user when permitted" do
        Guardian.any_instance.expects(:can_approve?).with(evil_trout).returns(true)
        User.any_instance.expects(:approve).once
        xhr :put, :approve_bulk, users: [evil_trout.id]
      end

    end

    context '.generate_api_key' do
      let(:evil_trout) { Fabricate(:evil_trout) }

      it 'calls generate_api_key' do
        User.any_instance.expects(:generate_api_key).with(@user)
        xhr :post, :generate_api_key, user_id: evil_trout.id
      end
    end

    context '.revoke_api_key' do

      let(:evil_trout) { Fabricate(:evil_trout) }

      it 'calls revoke_api_key' do
        User.any_instance.expects(:revoke_api_key)
        xhr :delete, :revoke_api_key, user_id: evil_trout.id
      end

    end

    context '.approve' do

      let(:evil_trout) { Fabricate(:evil_trout) }

      it "raises an error when the user doesn't have permission" do
        Guardian.any_instance.expects(:can_approve?).with(evil_trout).returns(false)
        xhr :put, :approve, user_id: evil_trout.id
        response.should be_forbidden
      end

      it 'calls approve' do
        User.any_instance.expects(:approve).with(@user)
        xhr :put, :approve, user_id: evil_trout.id
      end

    end

    context '.revoke_admin' do
      before do
        @another_admin = Fabricate(:admin)
      end

      it 'raises an error unless the user can revoke access' do
        Guardian.any_instance.expects(:can_revoke_admin?).with(@another_admin).returns(false)
        xhr :put, :revoke_admin, user_id: @another_admin.id
        response.should be_forbidden
      end

      it 'updates the admin flag' do
        xhr :put, :revoke_admin, user_id: @another_admin.id
        @another_admin.reload
        @another_admin.should_not be_admin
      end
    end

    context '.grant_admin' do
      before do
        @another_user = Fabricate(:coding_horror)
      end

      it "raises an error when the user doesn't have permission" do
        Guardian.any_instance.expects(:can_grant_admin?).with(@another_user).returns(false)
        xhr :put, :grant_admin, user_id: @another_user.id
        response.should be_forbidden
      end

      it "returns a 404 if the username doesn't exist" do
        xhr :put, :grant_admin, user_id: 123123
        response.should be_forbidden
      end

      it 'updates the admin flag' do
        xhr :put, :grant_admin, user_id: @another_user.id
        @another_user.reload
        @another_user.should be_admin
      end
    end

    context '.trust_level' do
      before do
        @another_user = Fabricate(:coding_horror)
      end

      it "raises an error when the user doesn't have permission" do
        Guardian.any_instance.expects(:can_change_trust_level?).with(@another_user).returns(false)
        xhr :put, :trust_level, user_id: @another_user.id
        response.should be_forbidden
      end

      it "returns a 404 if the username doesn't exist" do
        xhr :put, :trust_level, user_id: 123123
        response.should be_forbidden
      end

      it "upgrades the user's trust level" do
        StaffActionLogger.any_instance.expects(:log_trust_level_change).with(@another_user, @another_user.trust_level, 2).once
        xhr :put, :trust_level, user_id: @another_user.id, level: 2
        @another_user.reload
        @another_user.trust_level.should == 2
      end

      it "raises an error when demoting a user below their current trust level" do
        StaffActionLogger.any_instance.expects(:log_trust_level_change).never
        stat = @another_user.user_stat
        stat.topics_entered = SiteSetting.basic_requires_topics_entered + 1
        stat.posts_read_count = SiteSetting.basic_requires_read_posts + 1
        stat.time_read = SiteSetting.basic_requires_time_spent_mins * 60
        stat.save!
        @another_user.update_attributes(trust_level: TrustLevel.levels[:basic])
        xhr :put, :trust_level, user_id: @another_user.id, level: TrustLevel.levels[:newuser]
        response.should be_forbidden
      end
    end

    describe '.revoke_moderation' do
      before do
        @moderator = Fabricate(:moderator)
      end

      it 'raises an error unless the user can revoke access' do
        Guardian.any_instance.expects(:can_revoke_moderation?).with(@moderator).returns(false)
        xhr :put, :revoke_moderation, user_id: @moderator.id
        response.should be_forbidden
      end

      it 'updates the moderator flag' do
        xhr :put, :revoke_moderation, user_id: @moderator.id
        @moderator.reload
        @moderator.moderator.should_not be_true
      end
    end

    context '.grant_moderation' do
      before do
        @another_user = Fabricate(:coding_horror)
      end

      it "raises an error when the user doesn't have permission" do
        Guardian.any_instance.expects(:can_grant_moderation?).with(@another_user).returns(false)
        xhr :put, :grant_moderation, user_id: @another_user.id
        response.should be_forbidden
      end

      it "returns a 404 if the username doesn't exist" do
        xhr :put, :grant_moderation, user_id: 123123
        response.should be_forbidden
      end

      it 'updates the moderator flag' do
        xhr :put, :grant_moderation, user_id: @another_user.id
        @another_user.reload
        @another_user.moderator.should be_true
      end
    end

    context '.reject_bulk' do
      let(:reject_me)     { Fabricate(:user) }
      let(:reject_me_too) { Fabricate(:user) }

      it 'does nothing without users' do
        UserDestroyer.any_instance.expects(:destroy).never
        xhr :delete, :reject_bulk
      end

      it "won't delete users if not allowed" do
        Guardian.any_instance.stubs(:can_delete_user?).returns(false)
        UserDestroyer.any_instance.expects(:destroy).never
        xhr :delete, :reject_bulk, users: [reject_me.id]
      end

      it "reports successes" do
        Guardian.any_instance.stubs(:can_delete_user?).returns(true)
        UserDestroyer.any_instance.stubs(:destroy).returns(true)
        xhr :delete, :reject_bulk, users: [reject_me.id, reject_me_too.id]
        response.should be_success
        json = ::JSON.parse(response.body)
        json['success'].to_i.should == 2
        json['failed'].to_i.should == 0
      end

      context 'failures' do
        before do
          Guardian.any_instance.stubs(:can_delete_user?).returns(true)
        end

        it 'can handle some successes and some failures' do
          UserDestroyer.any_instance.stubs(:destroy).with(reject_me, anything).returns(false)
          UserDestroyer.any_instance.stubs(:destroy).with(reject_me_too, anything).returns(true)
          xhr :delete, :reject_bulk, users: [reject_me.id, reject_me_too.id]
          response.should be_success
          json = ::JSON.parse(response.body)
          json['success'].to_i.should == 1
          json['failed'].to_i.should == 1
        end

        it 'reports failure due to a user still having posts' do
          UserDestroyer.any_instance.expects(:destroy).with(reject_me, anything).raises(UserDestroyer::PostsExistError)
          xhr :delete, :reject_bulk, users: [reject_me.id]
          response.should be_success
          json = ::JSON.parse(response.body)
          json['success'].to_i.should == 0
          json['failed'].to_i.should == 1
        end
      end
    end

    context '.destroy' do
      before do
        @delete_me = Fabricate(:user)
      end

      it "raises an error when the user doesn't have permission" do
        Guardian.any_instance.expects(:can_delete_user?).with(@delete_me).returns(false)
        xhr :delete, :destroy, id: @delete_me.id
        response.should be_forbidden
      end

      it "returns a 403 if the user doesn't exist" do
        xhr :delete, :destroy, id: 123123
        response.should be_forbidden
      end

      it "returns an error if the user has posts" do
        Fabricate(:post, user: @delete_me)
        xhr :delete, :destroy, id: @delete_me.id
        response.should be_forbidden
      end

      it "doesn't return an error if the user has posts and delete_posts == true" do
        Fabricate(:post, user: @delete_me)
        UserDestroyer.any_instance.expects(:destroy).with(@delete_me, has_entry('delete_posts' => true)).returns(true)
        xhr :delete, :destroy, id: @delete_me.id, delete_posts: true
        response.should be_success
      end

      it "deletes the user record" do
        UserDestroyer.any_instance.expects(:destroy).returns(true)
        xhr :delete, :destroy, id: @delete_me.id
      end
    end

    context 'block' do
      before do
        @reg_user = Fabricate(:user)
      end

      it "raises an error when the user doesn't have permission" do
        Guardian.any_instance.expects(:can_block_user?).with(@reg_user).returns(false)
        UserBlocker.expects(:block).never
        xhr :put, :block, user_id: @reg_user.id
        response.should be_forbidden
      end

      it "returns a 403 if the user doesn't exist" do
        xhr :put, :block, user_id: 123123
        response.should be_forbidden
      end

      it "punishes the user for spamming" do
        UserBlocker.expects(:block).with(@reg_user, @user, anything)
        xhr :put, :block, user_id: @reg_user.id
      end
    end

    context 'unblock' do
      before do
        @reg_user = Fabricate(:user)
      end

      it "raises an error when the user doesn't have permission" do
        Guardian.any_instance.expects(:can_unblock_user?).with(@reg_user).returns(false)
        xhr :put, :unblock, user_id: @reg_user.id
        response.should be_forbidden
      end

      it "returns a 403 if the user doesn't exist" do
        xhr :put, :unblock, user_id: 123123
        response.should be_forbidden
      end

      it "punishes the user for spamming" do
        UserBlocker.expects(:unblock).with(@reg_user, @user, anything)
        xhr :put, :unblock, user_id: @reg_user.id
      end
    end

  end

end
