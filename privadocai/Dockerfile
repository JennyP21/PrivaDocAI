FROM gradle:8.7.0-jdk21 AS build

WORKDIR /home/gradle/src

COPY --chown=gradle:gradle . .

RUN gradle build -x test

FROM eclipse-temurin:21-jre-jammy

EXPOSE 8080

COPY --from=build /home/gradle/src/build/libs/*.jar /app/spring-boot-application.jar

ENTRYPOINT ["java", "-jar", "/app/spring-boot-application.jar"]