Software Dependecies: docker and docker-compose

Copy example.env to .env and set approppriate environment variables

1. To Setup and start server (first time run)
    a. Set `command: setup` for cab_booking_app in docker-compose.yml
    b. Run `docker-compose up -d --build`
2. To stop temporarily: `docker-compose stop`
3. To restart:
    a. Remove or comment out `command` field for cab_booking_app in docker-compose.yml
    b. Run `docker-compose up -d`
3. To test
    a. Run `docker-compose -f docker-compose-test.yml up`
4. To stop and remove: `docker-compose down -v`
