(ns backend.user
  (:require
    [clojure.java.jdbc :as jdbc]
    [cemerick.friend.credentials :as creds]
    [reloaded.repl :refer [system]]
    [ring.util.http-response :as resp]
    [backend.postgres :refer [insert! query]]
    [clojure.string :as str]
    )
  (:import org.postgresql.util.PSQLException))

(def password-work-factor 10)
(def email-re #"^[\w\.\+-]+@[\w\.-]+\.[A-Za-z]+$")
(def a-long-time (* 60 60 24 365 10))

(defn- valid-email?
  [email]
  (and (some? email)
       (string? email)
       (re-matches email-re email)))

(defn- valid-password?
  [password]
  (and (some? password)
       (string? password)
       (not-empty password)))

(defn- uuid?
  [uuid?]
  (when (string? uuid?)
    (re-matches #"\w+-\w+-\w+-\w+-\w+" uuid?)))

(defn- check-conflict
  [exception]
  (let [re (re-pattern
             (str "(?s)" ;; let `.` match newline character
                  "^ERROR: duplicate key value violates unique constraint "
                  "\"users_email_key\".*$"))]
    (if (re-matches re (.getMessage exception))
      (resp/conflict {:message "email already exists"})
      (do
        (println "PSQLException" exception)
        (.printStackTrace exception)
        (resp/bad-request {:message (.getMessage exception)})))))

(defn- validate-password
  [encrypted given]
  (creds/bcrypt-verify given encrypted))

(defn- internal-fetch
  [user-id]
  (first
    (query (:db system)
           [(str "SELECT *"
                 "  FROM ssm.users"
                 "  WHERE id = ?")
            user-id])))

(defn- add-session
  [user response]
  (assoc response
         :cookies
         {:auth_token {:value (:auth_token user)
                       :max-age a-long-time}
          :user_id {:value (str (:id user))
                    :max-age a-long-time}}))

(defn- remove-session
  [response]
  (assoc response
         :cookies
         {:auth_token {:value "", :max-age a-long-time}
          :user_id    {:value "", :max-age a-long-time}}))

(defn is-admin?
  [user-id]
  {:pre [(integer? user-id)
         (pos? user-id)]}
  (-> user-id internal-fetch :is_admin))

(defn valid-auth-token
  [user-id given-token]
  (when (and (string? user-id)
             (uuid? given-token))
    (let [user-id (Integer/parseInt user-id)
          user (first
                 (query (:db system)
                        [(str "SELECT auth_token"
                              "  FROM ssm.users"
                              "  WHERE id=?")
                         user-id]))]
      (= (str (:auth_token user)) given-token))))

(defn create
  [email password name state reason
   affil_self_advocate
   affil_family_member
   affil_health_provider
   affil_education_provider
   affil_smcha_staff
   affil_local_org_staff]

  (prn 'user/create
       email name state reason affil_self_advocate affil_family_member
       affil_health_provider affil_education_provider affil_smcha_staff
       affil_local_org_staff)

  (if-not (valid-email? email)
    (resp/bad-request {:message "invalid email"})
    (if-not (valid-password? password)
      (resp/bad-request {:message "invalid password"})
      (if (some empty? [name state reason])
        (resp/bad-request {:message "name/state/reason are required"})

        (try
          (let [user-map
                {:email email
                 :password (creds/hash-bcrypt
                            password
                            :work-factor password-work-factor)
                 :name name
                 :state state
                 :reason reason
                 :affil_self_advocate (= "on" affil_self_advocate)
                 :affil_family_member (= "on" affil_family_member)
                 :affil_health_provider (= "on" affil_health_provider)
                 :affil_education_provider (= "on" affil_education_provider)
                 :affil_smcha_staff (= "on" affil_smcha_staff)
                 :affil_local_org_staff (= "on" affil_local_org_staff)}
                new-user (first (insert! (:db system) "ssm.users" user-map))]
            (if new-user
              (resp/ok (select-keys new-user [:id :email]))
              (resp/bad-request {:message "unknown error"
                                 :data new-user})))

          (catch PSQLException e
            (check-conflict e))
          (catch Exception e
            (println "Exception" e)
            (.printStackTrace e)
            (resp/internal-server-error {:message (.getMessage e)})))))))

(defn login
  [email password]
  (prn 'user/login email)
  (if-not (valid-email? email)
    (resp/bad-request {:message "invalid email"})
    (if-not (valid-password? password)
      (resp/bad-request {:message "invalid password"})
      (try
        (let [user (first
                     (query
                       (:db system)
                       [(str "SELECT id, password, auth_token"
                             "  FROM ssm.users"
                             "  WHERE email=?")
                        email]))]
          (if-not user
            (resp/forbidden {:message "invalid email"})
            (if (validate-password (:password user) password)
              (add-session user (resp/ok (select-keys user [:auth_token])))
              (resp/forbidden {:message "wrong password"}))))))))

(defn logout
  []
  (prn 'user/logout)
  (remove-session (resp/ok {:message "ok"})))
