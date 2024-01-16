resource "kubernetes_deployment" "postgres" {
  metadata {
    name = "postgres"
    namespace = kubernetes_namespace.meadowlark.metadata.0.name
  }
  spec {
    replicas = 1
    template {
      metadata {
                labels = {
                    app = "postgres"
                }
            }
            spec {
                container {
                    image = "postgres:14.3-alpine@sha256:84c6ea4333ae18f25ea0fb18bb142156f2a2e545e0a779d93bbf08079e56bdaf"
                    name = "postgres-ml"
                    port {
                        container_port = 80
                    }
                }
            }
    }
  }
}

resource "kubernetes_service" "postgres" {
    metadata {
        name = "postgres"
        namespace = kubernetes_namespace.meadowlark.metadata.0.name
    }
    spec {
        selector = {
            app = kubernetes_deployment.postgres.spec.0.template.0.metadata.0.labels.app
        }
        port {
            port = var.pg-port
        }
    }
}
