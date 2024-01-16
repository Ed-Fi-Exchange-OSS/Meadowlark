resource "kubernetes_secret" "encrypted-values" {
  metadata {
    name = "basic-auth"
  }

  data = {
    postgres-password = "dG9wc2VjdXJl"
  }

  type = "kubernetes.io/basic-auth"
}
