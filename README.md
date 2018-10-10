# console
Mongoose Web GUI

## build
>./gradlew clean dist

## Deployment with Docker
As the server on which webapp rises, nginx is used.

To build image
>./gradlew buildImage

To start the server with default port:
>./gradlew runApp

To start the server with custom port: 
>./gradlew -Pport=(port number) runApp
