resource "kubernetes_env" "ml-env" {
  container = "meadowlark-api"
  metadata {
    name = "meadowlark-api"
  }

  api_version = "apps/v1"
  kind        = "Deployment"

  env {
    name  = "ALLOW_OVERPOSTING"
    value = "false"
  }

  env {
    name  = "ALLOW_TYPE_COERCION"
    value = "true"
  }

  env {
    name  = "ALLOW__EXT_PROPERTY"
    value = "true"
  }

  env {
    name  = "AUTHORIZATION_STORE_PLUGIN"
    value = var.auth-plugin
  }

  env {
    name  = "DOCUMENT_STORE_PLUGIN"
    value = var.document-store-plugin
  }

  env {
    name  = "LISTENER1_PLUGIN"
    value = var.listener-plugin
  }

  env {
    name  = "QUERY_HANDLER_PLUGIN"
    value = var.query-handler-plugin
  }

  env {
    name  = "BEGIN_ALLOWED_SCHOOL_YEAR"
    value = "2022"
  }

  env {
    name  = "END_ALLOWED_SCHOOL_YEAR"
    value = "2034"
  }

  env {
    name  = "FASTIFY_NUM_THREADS"
    value = "10"
  }

  env {
    name  = "FASTIFY_PORT"
    value = "3000"
  }

  env {
    name  = "FASTIFY_RATE_LIMIT"
    value = "false"
  }

  env {
    name  = "LOG_LEVEL"
    value = "info"
  }

  env {
    name  = "LOG_PRETTY_PRINT"
    value = "true"
  }

  env {
    name  = "LOG_TO_FILE"
    value = "true"
  }

  env {
    name  = "MEADOWLARK_STAGE"
    value = "local"
  }

  env {
    name  = "OAUTH_HARD_CODED_CREDENTIALS_ENABLEDs"
    value = "true"
  }

  env {
    name  = "OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST"
    value = "http://localhost:3000/local/oauth/token"
  }

  env {
    name  = "OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION"
    value = "http://localhost:3000/local/oauth/verify"
  }

  env {
    name  = "OAUTH_SIGNING_KEY"
    value = var.signing-key
  }

  env {
    name  = "OPENSEARCH_ENDPOINT"
    value = var.opensearch-endpoint
  }

  env {
    name  = "OPENSEARCH_USERNAME"
    value = var.opensearch-user
  }

  env {
    name  = "OPENSEARCH_PASSWORD"
    value = var.opensearch-password
  }

  env {
    name  = "OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH"
    value = var.oauth-key
  }

  env {
    name  = "OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH"
    value = var.oauth-secret
  }

  env {
    name  = "OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH"
    value = var.oauth-secret
  }

  env {
    name  = "POSTGRES_USER"
    value = var.pg-user
  }

  env {
    name  = "POSTGRES_PASSWORD"
    value = var.pg-pass
  }

  env {
    name  = "POSTGRES_HOST"
    value = var.pg-host
  }

  env {
    name  = "MEADOWLARK_DATABASE_NAME"
    value = var.dbname
  }

  env {
    name  = "POSTGRES_PORT"
    value = var.pg-port
  }
}
