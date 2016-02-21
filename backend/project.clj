(defproject backend "0.5.0"
  :description "Backend persistence layer for SSM tool"
  :url "http://syssci.renci.org/ssm/"
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [com.stuartsierra/component "0.2.3"]
                 [reloaded.repl "0.1.0"]
                 [http-kit "2.1.19"]
                 [compojure "1.4.0"]
                 [metosin/ring-http-response "0.6.3"]
                 [ring-middleware-format "0.5.0"]
                 [ring-cors "0.1.7"]
                 [com.cemerick/friend "0.2.1"
                  :exclusions [org.clojure/core.cache]]
                 [org.postgresql/postgresql "9.4-1201-jdbc4"]
                 [org.clojure/java.jdbc "0.4.1"]
                 [com.jolbox/bonecp "0.8.0.RELEASE"]
                 [cheshire "5.5.0"]
                 [ragtime "0.5.2"]]

  :profiles {:uberjar {:aot :all
                       :main backend.main}
             :dev {:dependencies [[org.clojure/tools.namespace "0.2.11"]]
                   :source-paths ["dev"]}}

  :aliases {"migrate"  ["run" "-m" "user/migrate"]
            "rollback" ["run" "-m" "user/rollback"]}

  :jvm-opts ~(mapv (fn [[p v]] (str "-D" (name p) "=" v))
                   {:DB_HOST "localhost"
                    :DB_PORT 5432
                    :DB_NAME "ssm"
                    :DB_USER "jeff"
                    :DB_PASS ""}))
