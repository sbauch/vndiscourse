desc "walk all posts updating cooked with latest markdown"
task "posts:rebake" => :environment do
  RailsMultisite::ConnectionManagement.each_connection do |db|
    puts "Re baking post markdown for #{db} , changes are denoted with # , no change with ."
    i = 0
    Post.select([:id, :cooked, :raw, :topic_id]).each do |p|
      i += 1
      cooked = p.cook(p.raw, topic_id: p.topic_id)
      if cooked != p.cooked
        Post.exec_sql('update posts set cooked = ? where id = ?', cooked, p.id)
        putc "#"
      else
        putc "."
      end
    end
    puts
    puts
    puts "#{i} posts done!"
    puts "-----------------------------------------------"
    puts

  end
end
