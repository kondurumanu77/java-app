FROM eclipse-temurin:11-jre

EXPOSE 8080

ENV APP_HOME=/usr/src/app

WORKDIR $APP_HOME

COPY target/database_service_project-*.jar app.jar

ENTRYPOINT ["java","-jar","app.jar"]