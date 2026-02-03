FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app
COPY pom.xml ./
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jdk-jammy
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 nodejs npm gcc g++ golang-go \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/target/*.jar /app/app.jar

EXPOSE 9000

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
