(defproject ssm "0.3.0"
  :description "interactive tool for creating directed graphs"
  :url "https://github.com/steve9000gi/ssm"
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [org.clojure/clojurescript "0.0-3308"]
                 [org.clojure/core.async "0.1.346.0-17112a-alpha"]
                 ]

  :min-lein-version "2.0.0"
  :plugins [[lein-cljsbuild "1.0.6"]
            [lein-figwheel "0.3.7"]]
  :source-paths ["src/cljs"]
  :clean-targets ^{:protect false} ["resources/public/js/compiled" "target"]

  :cljsbuild
  {:builds [{:id "dev"
             :source-paths ["src/cljs"]
             :figwheel {:on-jsload "ssm.core/on-js-reload"}
             :compiler {:main ssm.core
                        :asset-path "js/compiled/out"
                        :output-to "resources/public/js/compiled/ssm.js"
                        :output-dir "resources/public/js/compiled/out"
                        :source-map-timestamp true
                        }}

            {:id "min"
             :source-paths ["src/cljs"]
             :compiler {:output-to "resources/public/js/compiled/ssm.js"
                        :main ssm.core
                        :optimizations :advanced
                        :pretty-print false}}]}

  :figwheel {:css-dirs ["resources/public/css"]}
  )

