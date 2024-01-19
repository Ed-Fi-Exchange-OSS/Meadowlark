resource "kubernetes_namespace" "meadowlark" {
  metadata {
    name = "meadowlark"
  }
}
