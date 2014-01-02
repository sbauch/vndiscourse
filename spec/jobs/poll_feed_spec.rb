require 'spec_helper'
require_dependency 'jobs/regular/process_post'

describe Jobs::PollFeed do

  let(:poller) { Jobs::PollFeed.new }

  context "execute" do
    let(:url) { "http://eviltrout.com" }
    let(:embed_by_username) { "eviltrout" }

    it "requires feed_polling_enabled?" do
      SiteSetting.stubs(:feed_polling_enabled?).returns(false)
      poller.expects(:poll_feed).never
      poller.execute({})
    end

    it "requires feed_polling_url" do
      SiteSetting.stubs(:feed_polling_url).returns(nil)
      poller.expects(:poll_feed).never
      poller.execute({})
    end

    it "requires embed_by_username" do
      SiteSetting.stubs(:embed_by_username).returns(nil)
      poller.expects(:poll_feed).never
      poller.execute({})
    end


    it "delegates to poll_feed" do
      SiteSetting.stubs(:feed_polling_enabled?).returns(true)
      SiteSetting.stubs(:feed_polling_url).returns(url)
      SiteSetting.stubs(:embed_by_username).returns(embed_by_username)
      poller.expects(:poll_feed).once
      poller.execute({})
    end
  end

end
