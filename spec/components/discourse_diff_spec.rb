require 'spec_helper'
require 'discourse_diff'

describe DiscourseDiff do

  describe "inline_html" do

    it "returns an empty div when no content is diffed" do
      DiscourseDiff.new("", "").inline_html.should == "<div class=\"inline-diff\"></div>"
    end

    it "returns the diffed content when there is no difference" do
      before = after = "<p>this is a paragraph</p>"
      DiscourseDiff.new(before, after).inline_html.should == "<div class=\"inline-diff\"><p>this is a paragraph</p></div>"
    end

    it "adds <ins> tags around added text" do
      before = "<p>this is a paragraph</p>"
      after = "<p>this is a great paragraph</p>"
      DiscourseDiff.new(before, after).inline_html.should == "<div class=\"inline-diff\"><p>this is a <ins>great </ins>paragraph</p></div>"
    end

    it "adds <del> tags around removed text" do
      before = "<p>this is a great paragraph</p>"
      after = "<p>this is a paragraph</p>"
      DiscourseDiff.new(before, after).inline_html.should == "<div class=\"inline-diff\"><p>this is a <del>great </del>paragraph</p></div>"
    end

    it "adds .diff-ins class when a paragraph is added" do
      before = "<p>this is the first paragraph</p>"
      after = "<p>this is the first paragraph</p><p>this is the second paragraph</p>"
      DiscourseDiff.new(before, after).inline_html.should == "<div class=\"inline-diff\"><p>this is the first paragraph</p><p class=\"diff-ins\">this is the second paragraph</p></div>"
    end

    it "adds .diff-del class when a paragraph is removed" do
      before = "<p>this is the first paragraph</p><p>this is the second paragraph</p>"
      after = "<p>this is the second paragraph</p>"
      DiscourseDiff.new(before, after).inline_html.should == "<div class=\"inline-diff\"><p class=\"diff-del\">this is the first paragraph</p><p>this is the second paragraph</p></div>"
    end

  end

  describe "side_by_side_html" do

    it "returns two empty divs when no content is diffed" do
      DiscourseDiff.new("", "").side_by_side_html.should == "<div class=\"span8\"></div><div class=\"span8 offset1\"></div>"
    end

    it "returns the diffed content on both sides when there is no difference" do
      before = after = "<p>this is a paragraph</p>"
      DiscourseDiff.new(before, after).side_by_side_html.should == "<div class=\"span8\"><p>this is a paragraph</p></div><div class=\"span8 offset1\"><p>this is a paragraph</p></div>"
    end

    it "adds <ins> tags around added text on the right div" do
      before = "<p>this is a paragraph</p>"
      after = "<p>this is a great paragraph</p>"
      DiscourseDiff.new(before, after).side_by_side_html.should == "<div class=\"span8\"><p>this is a paragraph</p></div><div class=\"span8 offset1\"><p>this is a <ins>great </ins>paragraph</p></div>"
    end

    it "adds <del> tags around removed text on the left div" do
      before = "<p>this is a great paragraph</p>"
      after = "<p>this is a paragraph</p>"
      DiscourseDiff.new(before, after).side_by_side_html.should == "<div class=\"span8\"><p>this is a <del>great </del>paragraph</p></div><div class=\"span8 offset1\"><p>this is a paragraph</p></div>"
    end

    it "adds .diff-ins class when a paragraph is added" do
      before = "<p>this is the first paragraph</p>"
      after = "<p>this is the first paragraph</p><p>this is the second paragraph</p>"
      DiscourseDiff.new(before, after).side_by_side_html.should == "<div class=\"span8\"><p>this is the first paragraph</p></div><div class=\"span8 offset1\"><p>this is the first paragraph</p><p class=\"diff-ins\">this is the second paragraph</p></div>"
    end

    it "adds .diff-del class when a paragraph is removed" do
      before = "<p>this is the first paragraph</p><p>this is the second paragraph</p>"
      after = "<p>this is the second paragraph</p>"
      DiscourseDiff.new(before, after).side_by_side_html.should == "<div class=\"span8\"><p class=\"diff-del\">this is the first paragraph</p><p>this is the second paragraph</p></div><div class=\"span8 offset1\"><p>this is the second paragraph</p></div>"
    end

  end

  describe "side_by_side_markdown" do

    it "returns an empty table when no content is diffed" do
      DiscourseDiff.new("", "").side_by_side_markdown.should == "<table class=\"markdown\"></table>"
    end

    it "properly escape html tags" do
      before = ""
      after = "<img src=\"//domain.com/image.png>\""
      DiscourseDiff.new(before, after).side_by_side_markdown.should == "<table class=\"markdown\"><tr><td></td><td class=\"diff-ins\">&lt;img src=&quot;//domain.com/image.png&gt;&quot;</td></tr></table>"
    end

    it "returns the diffed content on both columns when there is no difference" do
      before = after = "this is a paragraph"
      DiscourseDiff.new(before, after).side_by_side_markdown.should == "<table class=\"markdown\"><tr><td>this is a paragraph</td><td>this is a paragraph</td></tr></table>"
    end

    it "adds <ins> tags around added text on the second column" do
      before = "this is a paragraph"
      after = "this is a great paragraph"
      DiscourseDiff.new(before, after).side_by_side_markdown.should == "<table class=\"markdown\"><tr><td class=\"diff-del\">this is a paragraph</td><td class=\"diff-ins\">this is a <ins>great </ins>paragraph</td></tr></table>"
    end

    it "adds <del> tags around removed text on the first column" do
      before = "this is a great paragraph"
      after = "this is a paragraph"
      DiscourseDiff.new(before, after).side_by_side_markdown.should == "<table class=\"markdown\"><tr><td class=\"diff-del\">this is a <del>great </del>paragraph</td><td class=\"diff-ins\">this is a paragraph</td></tr></table>"
    end

    it "adds .diff-ins class when a paragraph is added" do
      before = "this is the first paragraph"
      after = "this is the first paragraph\nthis is the second paragraph"
      DiscourseDiff.new(before, after).side_by_side_markdown.should == "<table class=\"markdown\"><tr><td class=\"diff-del\">this is the first paragraph</td><td class=\"diff-ins\">this is the first paragraph<ins>\nthis is the second paragraph</ins></td></tr></table>"
    end

    it "adds .diff-del class when a paragraph is removed" do
      before = "this is the first paragraph\nthis is the second paragraph"
      after = "this is the second paragraph"
      DiscourseDiff.new(before, after).side_by_side_markdown.should == "<table class=\"markdown\"><tr><td class=\"diff-del\">this is the first paragraph\n</td><td></td></tr><tr><td>this is the second paragraph</td><td>this is the second paragraph</td></tr></table>"
    end

  end

end

