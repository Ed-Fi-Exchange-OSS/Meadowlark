resource "kubernetes_deployment" "meadowlark-api" {
  metadata {
    name      = "meadowlark-api"
    namespace = kubernetes_namespace.meadowlark.metadata.0.name
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "meadowlark-api"
      }
    }
    template {
      metadata {
        labels = {
          app = "meadowlark-api"
        }
      }
      spec {
        container {
          image = "edfialliance/meadowlark-ed-fi-api"
          name  = "meadowlark-api-ml"

          port {
            container_port = 80
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "meadowlark-api" {
  metadata {
    name      = "meadowlark-api"
    namespace = kubernetes_namespace.meadowlark.metadata.0.name
  }
  spec {
    selector = {
      app = kubernetes_deployment.meadowlark-api.spec.0.template.0.metadata.0.labels.app
    }
    type = "LoadBalancer"
    port {
      port = 3000
    }
  }
}
