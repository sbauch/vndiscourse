require 'spec_helper'

describe ClicksController do

  context 'create' do

    context 'missing params' do
      it 'raises an error without the url param' do
        lambda { xhr :get, :track, post_id: 123 }.should raise_error(Discourse::InvalidParameters)
      end

      it "redirects to the url even without the topic_id or post_id params" do
        xhr :get, :track, url: 'http://google.com'
        response.should redirect_to("http://google.com")
      end

    end

    context 'correct params' do

      before do
        request.stubs(:remote_ip).returns('192.168.0.1')
      end

      context 'with a post_id' do
        it 'calls create_from' do
          TopicLinkClick.expects(:create_from).with(url: 'http://discourse.org', post_id: 123, ip: '192.168.0.1')
          xhr :get, :track, url: 'http://discourse.org', post_id: 123
          response.should redirect_to("http://discourse.org")
        end

        it 'redirects to the url' do
          TopicLinkClick.stubs(:create_from)
          xhr :get, :track, url: 'http://discourse.org', post_id: 123
          response.should redirect_to("http://discourse.org")
        end

        it 'will pass the user_id to create_from' do
          TopicLinkClick.expects(:create_from).with(url: 'http://discourse.org', post_id: 123, ip: '192.168.0.1')
          xhr :get, :track, url: 'http://discourse.org', post_id: 123
          response.should redirect_to("http://discourse.org")
        end

        it "doesn't redirect with the redirect=false param" do
          TopicLinkClick.expects(:create_from).with(url: 'http://discourse.org', post_id: 123, ip: '192.168.0.1')
          xhr :get, :track, url: 'http://discourse.org', post_id: 123, redirect: 'false'
          response.should_not be_redirect
        end

      end

      context 'with a topic_id' do
        it 'calls create_from' do
          TopicLinkClick.expects(:create_from).with(url: 'http://discourse.org', topic_id: 789, ip: '192.168.0.1')
          xhr :get, :track, url: 'http://discourse.org', topic_id: 789
          response.should redirect_to("http://discourse.org")
        end
      end

    end

  end

end
