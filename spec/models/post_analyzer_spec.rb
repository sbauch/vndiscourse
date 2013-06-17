require 'spec_helper'

describe PostAnalyzer do

  let(:topic) { Fabricate(:topic) }
  let(:default_topic_id) { topic.id }
  let(:post_args) do
    {user: topic.user, topic: topic}
  end

  context "links" do
    let(:raw_no_links) { "hello world my name is evil trout" }
    let(:raw_one_link_md) { "[jlawr](http://www.imdb.com/name/nm2225369)" }
    let(:raw_two_links_html) { "<a href='http://disneyland.disney.go.com/'>disney</a> <a href='http://reddit.com'>reddit</a>"}
    let(:raw_three_links) { "http://discourse.org and http://discourse.org/another_url and http://www.imdb.com/name/nm2225369"}

    describe "raw_links" do
      it "returns a blank collection for a post with no links" do
        post_analyzer = PostAnalyzer.new(raw_no_links, default_topic_id)
        post_analyzer.raw_links.should be_blank
      end

      it "finds a link within markdown" do
        post_analyzer = PostAnalyzer.new(raw_one_link_md, default_topic_id)
        post_analyzer.raw_links.should == ["http://www.imdb.com/name/nm2225369"]
      end

      it "can find two links from html" do
        post_analyzer = PostAnalyzer.new(raw_two_links_html, default_topic_id)
        post_analyzer.raw_links.should == ["http://disneyland.disney.go.com/", "http://reddit.com"]
      end

      it "can find three links without markup" do
        post_analyzer = PostAnalyzer.new(raw_three_links, default_topic_id)
        post_analyzer.raw_links.should == ["http://discourse.org", "http://discourse.org/another_url", "http://www.imdb.com/name/nm2225369"]
      end
    end

    describe "linked_hosts" do
      it "returns blank with no links" do
        post_analyzer = PostAnalyzer.new(raw_no_links, default_topic_id)
        post_analyzer.linked_hosts.should be_blank
      end

      it "returns the host and a count for links" do
        post_analyzer = PostAnalyzer.new(raw_two_links_html, default_topic_id)
        post_analyzer.linked_hosts.should == {"disneyland.disney.go.com" => 1, "reddit.com" => 1}
      end

      it "it counts properly with more than one link on the same host" do
        post_analyzer = PostAnalyzer.new(raw_three_links, default_topic_id)
        post_analyzer.linked_hosts.should == {"discourse.org" => 1, "www.imdb.com" => 1}
      end
    end
  end

  describe "image_count" do
    let(:raw_post_one_image_md) { "![sherlock](http://bbc.co.uk/sherlock.jpg)" }
    let(:raw_post_two_images_html) { "<img src='http://discourse.org/logo.png'> <img src='http://bbc.co.uk/sherlock.jpg'>" }
    let(:raw_post_with_avatars) { '<img alt="smiley" title=":smiley:" src="/assets/emoji/smiley.png" class="avatar"> <img alt="wink" title=":wink:" src="/assets/emoji/wink.png" class="avatar">' }
    let(:raw_post_with_favicon) { '<img src="/assets/favicons/wikipedia.png" class="favicon">' }
    let(:raw_post_with_thumbnail) { '<img src="/assets/emoji/smiley.png" class="thumbnail">' }
    let(:raw_post_with_two_classy_images) { "<img src='http://discourse.org/logo.png' class='classy'> <img src='http://bbc.co.uk/sherlock.jpg' class='classy'>" }

    it "returns 0 images for an empty post" do
      post_analyzer = PostAnalyzer.new("Hello world", nil)
      post_analyzer.image_count.should == 0
    end

    it "finds images from markdown" do
      post_analyzer = PostAnalyzer.new(raw_post_one_image_md, default_topic_id)
      post_analyzer.image_count.should == 1
    end

    it "finds images from HTML" do
      post_analyzer = PostAnalyzer.new(raw_post_two_images_html, default_topic_id)
      post_analyzer.image_count.should == 2
    end

    it "doesn't count avatars as images" do
      post_analyzer = PostAnalyzer.new(raw_post_with_avatars, default_topic_id)
      post_analyzer.image_count.should == 0
    end

    it "doesn't count favicons as images" do
      post_analyzer = PostAnalyzer.new(raw_post_with_favicon, default_topic_id)
      post_analyzer.image_count.should == 0
    end

    it "doesn't count thumbnails as images" do
      post_analyzer = PostAnalyzer.new(raw_post_with_thumbnail, default_topic_id)
      post_analyzer.image_count.should == 0
    end

    it "doesn't count whitelisted images" do
      Post.stubs(:white_listed_image_classes).returns(["classy"])
      post_analyzer = PostAnalyzer.new(raw_post_with_two_classy_images, default_topic_id)
      post_analyzer.image_count.should == 0
    end
  end

  describe "link_count" do
    let(:raw_post_one_link_md) { "[sherlock](http://www.bbc.co.uk/programmes/b018ttws)" }
    let(:raw_post_two_links_html) { "<a href='http://discourse.org'>discourse</a> <a href='http://twitter.com'>twitter</a>" }
    let(:raw_post_with_mentions) { "hello @novemberkilo how are you doing?" }

    it "returns 0 links for an empty post" do
      post_analyzer = PostAnalyzer.new("Hello world", nil)
      post_analyzer.link_count.should == 0
    end

    it "returns 0 links for a post with mentions" do
      post_analyzer = PostAnalyzer.new(raw_post_with_mentions, default_topic_id)
      post_analyzer.link_count.should == 0
    end

    it "finds links from markdown" do
      post_analyzer = PostAnalyzer.new(raw_post_one_link_md, default_topic_id)
      post_analyzer.link_count.should == 1
    end

    it "finds links from HTML" do
      post_analyzer = PostAnalyzer.new(raw_post_two_links_html, default_topic_id)
      post_analyzer.link_count.should == 2
    end
  end


  describe "raw_mentions" do

    it "returns an empty array with no matches" do
      post_analyzer = PostAnalyzer.new("Hello Jake and Finn!", default_topic_id)
      post_analyzer.raw_mentions.should == []
    end

    it "returns lowercase unique versions of the mentions" do
      post_analyzer = PostAnalyzer.new("@Jake @Finn @Jake", default_topic_id)
      post_analyzer.raw_mentions.should == ['jake', 'finn']
    end

    it "ignores pre" do
      post_analyzer = PostAnalyzer.new("<pre>@Jake</pre> @Finn", default_topic_id)
      post_analyzer.raw_mentions.should == ['finn']
    end

    it "catches content between pre tags" do
      post_analyzer = PostAnalyzer.new("<pre>hello</pre> @Finn <pre></pre>", default_topic_id)
      post_analyzer.raw_mentions.should == ['finn']
    end

    it "ignores code" do
      post_analyzer = PostAnalyzer.new("@Jake <code>@Finn</code>", default_topic_id)
      post_analyzer.raw_mentions.should == ['jake']
    end

    it "ignores quotes" do
      post_analyzer = PostAnalyzer.new("[quote=\"Evil Trout\"]@Jake[/quote] @Finn", default_topic_id)
      post_analyzer.raw_mentions.should == ['finn']
    end

    it "handles underscore in username" do
      post_analyzer = PostAnalyzer.new("@Jake @Finn @Jake_Old", default_topic_id)
      post_analyzer.raw_mentions.should == ['jake', 'finn', 'jake_old']
    end
  end
end
