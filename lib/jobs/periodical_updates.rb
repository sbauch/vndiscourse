require_dependency 'score_calculator'

module Jobs

  # This job will run on a regular basis to update statistics and denormalized data.
  # If it does not run, the site will not function properly.
  class PeriodicalUpdates < Jobs::Base

    def execute(args)

      # Update the average times
      Post.calculate_avg_time
      Topic.calculate_avg_time

      # Feature topics in categories
      CategoryFeaturedTopic.feature_topics

      # Update view counts for users
      User.update_view_counts

      # Update the scores of posts
      ScoreCalculator.new.calculate

      # Refresh Hot Topics
      HotTopic.refresh!

    end

  end

end
