I used Node.js and Express for this server as that is the language that I am most experienced in. Due to this, I included a Dockerfile to install the necessary dependencies.
To start the server I used docker-compose, which can be started via the following command `docker compose up --build`. If this doesn't work, it can also be started using `docker build -t receipt-processor .` and `docker run -p 8080:8080 receipt-processor`
Once started, the server will be available on Port 8080.
