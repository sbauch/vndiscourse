class Admin::FlagsController < Admin::AdminController
  def index

    # we may get out of sync, fix it here
    PostAction.update_flagged_posts_count
    posts, users = PostAction.flagged_posts_report(params[:filter])

    if posts.blank?
      render json: {users: [], posts: []}
    else
      render json: MultiJson.dump({users: serialize_data(users, BasicUserSerializer), posts: posts})
    end
  end

  def clear
    p = Post.find(params[:id])
    PostAction.clear_flags!(p, current_user.id)
    p.reload
    p.unhide!
    render nothing: true
  end
end
