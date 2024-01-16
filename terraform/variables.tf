variable "pg-user" {
  description = "PostgreSQL user"
  type = string
  default = "postgres"
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
