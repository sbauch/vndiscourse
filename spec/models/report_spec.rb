require 'spec_helper'

describe Report do

  # describe 'visits report' do
  #   let(:report) { Report.find('visits', cache: false) }

  #   context "no visits" do
  #     it "returns an empty report" do
  #       report.data.should be_blank
  #     end
  #   end

  #   context "with visits" do
  #     let(:user) { Fabricate(:user) }

  #     before do
  #       user.user_visits.create(visited_at: 1.day.ago)
  #       user.user_visits.create(visited_at: 2.days.ago)
  #     end

  #     it "returns a report with data" do
  #       report.data.should be_present
  #     end
  #   end
  # end

  # [:signup, :topic, :post, :flag, :like, :email].each do |arg|
  #   describe "#{arg} report" do
  #     pluralized = arg.to_s.pluralize

  #     let(:report) { Report.find(pluralized, cache: false) }

  #     context "no #{pluralized}" do
  #       it 'returns an empty report' do
  #         report.data.should be_blank
  #       end
  #     end

  #     context "with #{pluralized}" do
  #       before do
  #         fabricator = case arg
  #         when :signup
  #           :user
  #         when :email
  #           :email_log
  #         else
  #           arg
  #         end
  #         Fabricate(fabricator, created_at: 25.hours.ago)
  #         Fabricate(fabricator, created_at: 1.hours.ago)
  #         Fabricate(fabricator, created_at: 1.hours.ago)
  #       end

  #       it 'returns correct data' do
  #         report.data[0][:y].should == 1
  #         report.data[1][:y].should == 2
  #       end
  #     end
  #   end
  # end

  describe 'users by trust level report' do
    let(:report) { Report.find('users_by_trust_level', cache: false) }

    context "no users" do
      it "returns an empty report" do
        report.data.should be_blank
      end
    end

    context "with users at different trust levels" do
      before do
        3.times { Fabricate(:user, trust_level: TrustLevel.levels[:visitor]) }
        2.times { Fabricate(:user, trust_level: TrustLevel.levels[:regular]) }
        Fabricate(:user, trust_level: TrustLevel.levels[:elder])
      end

      it "returns a report with data" do
        report.data.should be_present
        report.data.find {|d| d[:x] == TrustLevel.levels[:visitor]} [:y].should == 3
        report.data.find {|d| d[:x] == TrustLevel.levels[:regular]}[:y].should == 2
        report.data.find {|d| d[:x] == TrustLevel.levels[:elder]}[:y].should == 1
      end
    end
  end

end