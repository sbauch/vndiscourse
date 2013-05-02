class TagsController < ApplicationController
  def search
    term = params[:term].to_s.strip

    results = Tag.search(term)
    render json: { tags: results.as_json(only: :term) }
  end
  
  def valid
    render json: {valid: true}
  end
end
