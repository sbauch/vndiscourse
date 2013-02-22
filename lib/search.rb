module Search

  def self.min_search_term_length
    3
  end

  def self.per_facet
    5
  end

  def self.facets
    %w(topic category user)
  end

  def self.user_query_sql
    "SELECT 'user' AS type,
                  u.username_lower AS id,
                  '/users/' || u.username_lower AS url,
                  u.username AS title,
                  u.email,
                  NULL AS color
          FROM users AS u
          JOIN users_search s on s.id = u.id
          WHERE s.search_data @@ TO_TSQUERY('english', :query)
          ORDER BY last_posted_at desc
    "
  end

  def self.topic_query_sql
    "SELECT 'topic' AS type,
            CAST(ft.id AS VARCHAR),
            '/t/slug/' || ft.id AS url,
            ft.title,
            NULL AS email,
            NULL AS color
    FROM topics AS ft
      JOIN posts AS p ON p.topic_id = ft.id AND p.post_number = 1
      JOIN posts_search s on s.id = p.id
    WHERE s.search_data @@ TO_TSQUERY('english', :query)
      AND ft.deleted_at IS NULL
      AND ft.visible
      AND ft.archetype <> '#{Archetype.private_message}'
    ORDER BY 
            TS_RANK_CD(TO_TSVECTOR('english', ft.title), TO_TSQUERY('english', :query)) desc,
            TS_RANK_CD(search_data, TO_TSQUERY('english', :query)) desc,
            bumped_at desc"
  end  

  
  def self.post_query_sql
    "SELECT cast('topic' as varchar) AS type,
            CAST(ft.id AS VARCHAR),
            '/t/slug/' || ft.id || '/' || p.post_number AS url,
            ft.title,
            NULL AS email,
            NULL AS color
    FROM topics AS ft
      JOIN posts AS p ON p.topic_id = ft.id AND p.post_number <> 1
      JOIN posts_search s on s.id = p.id
    WHERE s.search_data @@ TO_TSQUERY('english', :query)
      AND ft.deleted_at IS NULL and p.deleted_at IS NULL
      AND ft.visible
      AND ft.archetype <> '#{Archetype.private_message}'
    ORDER BY 
            TS_RANK_CD(TO_TSVECTOR('english', ft.title), TO_TSQUERY('english', :query)) desc,
            TS_RANK_CD(search_data, TO_TSQUERY('english', :query)) desc,
            bumped_at desc" 
  end  

  def self.category_query_sql
    "SELECT 'category' AS type,
            c.name AS id,
            '/category/' || c.slug AS url,
            c.name AS title,
            NULL AS email,
            c.color
    FROM categories AS c
    JOIN categories_search s on s.id = c.id
    WHERE s.search_data @@ TO_TSQUERY('english', :query)
    ORDER BY topics_month desc
    "
  end

  def self.query(term, type_filter=nil)    

    return nil if term.blank?
    sanitized_term = term.gsub(/[^0-9a-zA-Z_ ]/, '')

    # really short terms are totally pointless
    return nil if sanitized_term.blank? || sanitized_term.length < self.min_search_term_length

    terms = sanitized_term.split
    terms.map! {|t| "#{t}:*"}

    if type_filter.present?      
      raise Discourse::InvalidAccess.new("invalid type filter") unless Search.facets.include?(type_filter)
      sql = Search.send("#{type_filter}_query_sql") << " LIMIT #{Search.per_facet * Search.facets.size}"
      db_result = ActiveRecord::Base.exec_sql(sql , query: terms.join(" & "))
    else

      db_result = []
      [user_query_sql, category_query_sql, topic_query_sql].each do |sql|
        sql << " LIMIT " << (Search.per_facet + 1).to_s
        db_result += ActiveRecord::Base.exec_sql(sql , query: terms.join(" & ")).to_a
      end
    end

    db_result = db_result.to_a
    
    expected_topics = 0
    expected_topics = Search.facets.size unless type_filter.present?
    expected_topics = Search.per_facet * Search.facets.size if type_filter == 'topic'
    
    if expected_topics > 0 
      db_result.each do |row|
        expected_topics -= 1 if row['type'] == 'topic'
      end
    end
    
    if expected_topics > 0 
      tmp = ActiveRecord::Base.exec_sql "#{post_query_sql} limit :per_facet", 
        query: terms.join(" & "), per_facet: expected_topics * 3

      topic_ids = Set.new db_result.map{|r| r["id"]}

      tmp = tmp.to_a
      tmp = tmp.reject{ |i|
        if topic_ids.include? i["id"] 
          true
        else
          topic_ids << i["id"]
          false
        end
      }

      db_result += tmp[0..expected_topics-1]
    end

    # Group the results by type
    grouped = {}
    db_result.each do |row|
      type = row.delete('type')

      # Add the slug for topics
      row['url'].gsub!('slug', Slug.for(row['title'])) if type == 'topic'

      # Remove attributes when we know they don't matter
      row.delete('id')
      if type == 'user'
        row['avatar_template'] = User.avatar_template(row['email'])
      end
      row.delete('email') 
      row.delete('color') unless type == 'category'

      grouped[type] ||= []
      grouped[type] << row
    end

    result = grouped.map do |type, results|
      more = type_filter.blank? && (results.size > Search.per_facet)
      results = results[0..([results.length, Search.per_facet].min - 1)] if type_filter.blank?
    
      {type: type, 
       name: I18n.t("search.types.#{type}"),
       more: more,
       results: results}
    end
    result
  end

end
