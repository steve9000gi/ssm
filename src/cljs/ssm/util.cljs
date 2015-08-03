(ns ssm.util
  (:require
    [ssm.controls :refer [raise!]]
    ))

(defn raise-mouse-event!
  ([owner event-name js-event]
   (raise-mouse-event! owner event-name js-event {}))
  ([owner event-name js-event other-data]
   ;; Note that we have to copy what we need out of this event now, before
   ;; enqueuing on a channel, or the data will be lost, because these React
   ;; events are fairly ephemeral.
   (raise! owner [event-name
                  (merge
                    {:shift (.-shiftKey js-event)
                     :x (.-clientX js-event)
                     :y (.-clientY js-event)}
                    other-data)])
   (.stopPropagation js-event)))

