cd ../Meadowlark-js/backends/meadowlark-mongodb-backend/docker/

chmod -R +x ./scripts
docker run -d --name mongo-temp -v mongo-auth:/auth mongo:4.0.28
docker exec mongo-temp mkdir /scripts
docker cp ./scripts/mongo-key-file-setup.sh mongo-temp:/scripts/mongo-key-file-setup.sh
docker exec mongo-temp ./scripts/mongo-key-file-setup.sh
docker compose up -d

echo "Adding URL to hosts"
echo '127.0.0.1 mongo1 mongo2 mongo3' | sudo tee -a /etc/hosts

# Wait for environment
sleep 30;

echo "Setting replica set"
docker exec mongo1 ./scripts/mongo-rs-setup.sh

# Wait for environment
sleep 30;

docker exec -e ADMIN_USERNAME=mongo -e ADMIN_PASSWORD=abcdefgh1! mongo1 ./scripts/mongo-user-setup.sh
