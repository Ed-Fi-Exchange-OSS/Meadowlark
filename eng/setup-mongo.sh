#! /bin/bash
end=$((SECONDS+ 5 * 60))

until [[ `docker inspect -f {{.State.Running}} mongo1` == true || $SECONDS -gt $end ]]; do
    sleep 2;
done;

if [ `docker inspect -f {{.State.Running}} mongo1` == true ]
then
    echo "--- Container is healthy ---"
else
    docker ps
    docker logs mongo1 --tail 50
    echo "--- Operation timed out. Review container status ---"
    exit 1
fi

sleep 30;
