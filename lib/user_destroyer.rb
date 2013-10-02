# Responsible for destroying a User record
class UserDestroyer

  class PostsExistError < RuntimeError; end

  def initialize(staff)
    @staff = staff
    raise Discourse::InvalidParameters.new('staff user is nil') unless @staff and @staff.is_a?(User)
    raise Discourse::InvalidAccess unless @staff.staff?
  end

  # Returns false if the user failed to be deleted.
  # Returns a frozen instance of the User if the delete succeeded.
  def destroy(user, opts={})
    raise Discourse::InvalidParameters.new('user is nil') unless user and user.is_a?(User)
    raise PostsExistError if !opts[:delete_posts] && user.post_count != 0
    User.transaction do
      if opts[:delete_posts]
        user.posts.each do |post|
          if opts[:block_urls]
            post.topic_links.each do |link|
              unless link.internal or Oneboxer.oneboxer_exists_for_url?(link.url)
                ScreenedUrl.watch(link.url, link.domain).try(:record_match!)
              end
            end
          end
          PostDestroyer.new(@staff, post).destroy
        end
        raise PostsExistError if user.reload.post_count != 0
      end
      user.destroy.tap do |u|
        if u
          if opts[:block_email]
            b = ScreenedEmail.block(u.email)
            b.record_match! if b
          end
          Post.with_deleted.where(user_id: user.id).update_all("nuked_user = true")
          StaffActionLogger.new(@staff).log_user_deletion(user, opts.slice(:context))
          DiscourseHub.unregister_nickname(user.username) if SiteSetting.call_discourse_hub?
          MessageBus.publish "/file-change", ["refresh"], user_ids: [user.id]
        end
      end
    end
  end

end