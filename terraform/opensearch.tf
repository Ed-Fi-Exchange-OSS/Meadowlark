resource "kubernetes_deployment" "opensearch" {
  metadata {
    name      = "opensearch"
    namespace = kubernetes_namespace.meadowlark.metadata.0.name
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "opensearch"
      }
    }
    template {
      metadata {
        labels = {
          app = "opensearch"
        }
      }
      spec {
        container {
          image = "opensearchproject/opensearch:2.7.0@sha256:55f1f67e7d3645aa838b63a589bce5645154ba275814e52d4638d371ca0f8cb5"
          name  = "opensearch-node1"
          port {
            container_port = 9200
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
        }
      }
    }
  }
}

resource "kubernetes_service" "opensearch" {
  metadata {
    name      = "opensearch"
    namespace = kubernetes_namespace.meadowlark.metadata.0.name
  }
  spec {
    selector = {
      app = kubernetes_deployment.opensearch.spec.0.template.0.metadata.0.labels.app
    }
    port {
      port = 9200
    }
  }
}
