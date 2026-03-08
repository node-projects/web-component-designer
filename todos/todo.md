DesignItem.SetProperty should use a service?
DesitnItem should know if a Control should be recreated (when property or attribute is set)
This should be removed from property service

We recreate a Control somewhere inside (via parser etc), but do not use Instanceservice, should be changed