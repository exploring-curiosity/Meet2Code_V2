package com.m2c.app.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.NestedConfigurationProperty;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final OAuth oauth = new OAuth();

    private final Cors cors = new Cors();

    private String sessionSecret;

    private String sessionCookieName;

    public OAuth getOauth() {
        return oauth;
    }

    public Cors getCors() {
        return cors;
    }

    public String getSessionSecret() {
        return sessionSecret;
    }

    public void setSessionSecret(String sessionSecret) {
        this.sessionSecret = sessionSecret;
    }

    public String getSessionCookieName() {
        return sessionCookieName;
    }

    public void setSessionCookieName(String sessionCookieName) {
        this.sessionCookieName = sessionCookieName;
    }

    public static class Cors {
        private String[] allowedOrigins;

        public String[] getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(String[] allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }

    public static class OAuth {
        @NestedConfigurationProperty
        private final Github github = new Github();
        @NestedConfigurationProperty
        private final Google google = new Google();

        public Github getGithub() {
            return github;
        }

        public Google getGoogle() {
            return google;
        }

        public static class Github {
            private String clientId;
            private String clientSecret;

            public String getClientId() {
                return clientId;
            }

            public void setClientId(String clientId) {
                this.clientId = clientId;
            }

            public String getClientSecret() {
                return clientSecret;
            }

            public void setClientSecret(String clientSecret) {
                this.clientSecret = clientSecret;
            }
        }

        public static class Google {
            private String clientId;

            public String getClientId() {
                return clientId;
            }

            public void setClientId(String clientId) {
                this.clientId = clientId;
            }
        }
    }
}
