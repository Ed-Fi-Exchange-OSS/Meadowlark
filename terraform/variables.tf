variable "pg-user" {
  description = "PostgreSQL user"
  type = string
  default = "postgres"
}

variable "pg-pass" {
  description = "PostgreSQL Password"
  type = string
}

variable "pg-host" {
  description = "PostgreSQL user"
  type = string
  default = "postgres-service"
}

variable "pg-port" {
  description = "PostgreSQL Port"
  type = number
  default = 5432
}

variable "pg-dbname" {
  description = "PostgreSQL Database Name"
  type = string
  default = "postgres"
}

variable "opensearch-user" {
  description = "OpenSearch user"
  type = string
  default = "admin"
}

variable "opensearch-password" {
  description = "OpenSearch password"
  type = string
  default = "admin"
}

variable "opensearch-endpoint" {
  description = "OpenSearch Endpoint"
  type = string
  default = "http://opensearch-service:9200"
}

variable "oauth-key" {
  description = "Oauth Key"
  type = string
  default = "meadowlark_verify-only_key_1"
}

variable "oauth-secret" {
  description = "Oauth Secret"
  type = string
  default = "meadowlark_verify-only_secret_1"
}

variable "auth-plugin" {
  description = "Authorization Plugin"
  type = string
  default = "@edfi/meadowlark-postgresql-backend"

  validation {
    condition     = contains(["@edfi/meadowlark-postgresql-backend", "@edfi/meadowlark-mongodb-backend"], var.auth-plugin)
    error_message = "Must be postgresql or mongodb"
  }
}

variable "document-store-plugin" {
  description = "Document Store Plugin"
  type = string
  default = "@edfi/meadowlark-postgresql-backend"

  validation {
    condition     = contains(["@edfi/meadowlark-postgresql-backend", "@edfi/meadowlark-mongodb-backend"], var.document-store-plugin)
    error_message = "Must be postgresql or mongodb"
  }
}

variable "listener-plugin" {
  description = "Listener Plugin"
  type = string
  default = "@edfi/meadowlark-opensearch-backend"

  validation {
    condition     = contains(["@edfi/meadowlark-opensearch-backend", "@edfi/meadowlark-elasticsearch-backend"], var.listener-plugin)
    error_message = "Must be opensearch or elasticsearch"
  }
}

variable "query-handler-plugin" {
  description = "Query Handler Plugin"
  type = string
  default = "@edfi/meadowlark-opensearch-backend"

  validation {
    condition     = contains(["@edfi/meadowlark-opensearch-backend", "@edfi/meadowlark-elasticsearch-backend"], var.query-handler-plugin)
    error_message = "Must be opensearch or elasticsearch"
  }
}

variable "signing-key" {
  description = "OAuth Signing Key"
  type = string
}

variable "dbname" {
  description = "Database Name"
  type = string
  default = "postgres"
}
