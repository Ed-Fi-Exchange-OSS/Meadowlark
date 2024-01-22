resource "kubernetes_deployment" "postgres" {
  metadata {
    name      = "postgres"
    namespace = kubernetes_namespace.meadowlark.metadata.0.name
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "postgres"
      }
    }
    template {
      metadata {
        labels = {
          app = "postgres"
        }
      }
      spec {
        container {
          image = "postgres:14.3-alpine@sha256:84c6ea4333ae18f25ea0fb18bb142156f2a2e545e0a779d93bbf08079e56bdaf"
          name  = "postgres-ml"
          port {
            container_port = 80
          }

          env {
            name  = "POSTGRES_USER"
            value = var.postgres-user
          }

          env {
            name  = "POSTGRES_PASSWORD"
            value = var.postgres-password
          }

          env {
            name  = "POSTGRES_HOST"
            value = var.postgres-host
          }

          env {
            name  = "MEADOWLARK_DATABASE_NAME"
            value = var.postgres-dbname
          }

          env {
            name  = "POSTGRES_PORT"
            value = var.postgres-port
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "postgres" {
  metadata {
    name      = "postgres"
    namespace = kubernetes_namespace.meadowlark.metadata.0.name
  }
  spec {
    selector = {
      app = kubernetes_deployment.postgres.spec.0.template.0.metadata.0.labels.app
    }
    port {
      port = var.postgres-port
    }
  }
}
