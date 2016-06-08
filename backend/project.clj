(defproject backend "0.5.1"
  :description "Backend persistence layer for SSM tool"
  :url "http://syssci.renci.org/ssm/"
  :dependencies [[org.clojure/clojure "1.8.0"]
                 [com.stuartsierra/component "0.3.1"]
                 [reloaded.repl "0.2.1"]
                 [http-kit "2.1.19"]
                 [compojure "1.5.0"
                  :exclusions [commons-codec]]
                 [metosin/ring-http-response "0.6.5"]
                 [ring-middleware-format "0.7.0"
                  :exclusions [org.clojure/tools.reader]]
                 [ring-cors "0.1.7"]
                 [com.cemerick/friend "0.2.1"
                  :exclusions [org.clojure/core.cache
                               commons-codec]]
                 [org.postgresql/postgresql "9.4.1208"]
                 [org.clojure/java.jdbc "0.4.2"]
                 [com.jolbox/bonecp "0.8.0.RELEASE"]
                 [cheshire "5.5.0"]
                 [ragtime "0.5.2"]]

  :profiles {:uberjar {:aot :all
                       :main backend.main}
             :dev {:dependencies [[org.clojure/tools.namespace "0.2.11"]]
                   :source-paths ["dev"]}}

  :aliases {"migrate"  ["run" "-m" "backend.migrate/migrate"]
            "rollback" ["run" "-m" "backend.migrate/rollback"]}

  :jvm-opts ~(mapv (fn [[p v]] (str "-D" (name p) "=" v))
                   {:DB_HOST "localhost"
                    :DB_PORT 5432
                    :DB_NAME "ssm"
                    :DB_USER "jeff"
                    :DB_PASS ""}))
