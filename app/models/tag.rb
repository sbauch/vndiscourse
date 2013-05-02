class Tag < ActiveRecord::Base
  attr_accessible :count, :term

  def self.search(term)
    sql = Tag.sql_builder("select id, term from tags
                          /*left_join*/
                          /*where*/
                          /*order_by*/")
    if term.present?
      sql.where("term like :term_like", term: term, term_like: "#{term.downcase}%")
    end
    sql.exec
  end

end
