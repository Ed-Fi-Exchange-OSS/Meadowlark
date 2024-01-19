# Terraform Deployment for Meadowlark

This is a list of files to do an IaC (Infrastructure as Code) deployment of
Meadowlark into a Kubernetes Cluster using Terraform.

> [!WARNING]
> This is an exploratory solution, and is not ready for a production deployment.
> It can be used as a foundation to do so.

## Local Deployment

For local development, you need to use
[minikube](https://minikube.sigs.k8s.io/docs/start/).

* After installing, run `minikube start` to setup minikube in your local
  environment.
* Set the terminal in the */terraform* folder.
* Create a `terraform.tfvars` based on the `terraform.tfvars.example` file.
* Run `terraform init` to initialize the terraform environment.
* Run `terraform plan` to create an execution plan, the result should show a message similar to:
**Plan: 8 to add, 0 to change, 0 to destroy.**
* Run `terraform apply -auto-approve` to run the execution plan without prompt for confirmation.

* When done, finish by running `terraform destroy` and confirming the changes.
