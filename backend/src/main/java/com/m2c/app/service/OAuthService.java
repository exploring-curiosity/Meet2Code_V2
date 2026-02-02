package com.m2c.app.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.m2c.app.config.AppProperties;
import com.m2c.app.domain.user.UserAccount;
import com.m2c.app.domain.user.UserProvider;
import com.m2c.app.repository.UserAccountRepository;
import com.m2c.app.web.dto.GitHubRepoResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.security.GeneralSecurityException;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class OAuthService {

    private final AppProperties appProperties;
    private final UserAccountRepository userAccountRepository;
    private final WebClient githubOAuthClient;
    private final WebClient githubWebClient;

    public OAuthService(AppProperties appProperties,
                       UserAccountRepository userAccountRepository,
                       @Qualifier("githubOAuthClient") WebClient githubOAuthClient,
                       @Qualifier("githubWebClient") WebClient githubWebClient) {
        this.appProperties = appProperties;
        this.userAccountRepository = userAccountRepository;
        this.githubOAuthClient = githubOAuthClient;
        this.githubWebClient = githubWebClient;
    }

    private final GoogleIdTokenVerifier googleVerifier = new GoogleIdTokenVerifier.Builder(
            new NetHttpTransport(),
            JacksonFactory.getDefaultInstance())
            .build();

    public UserAccount authenticateGoogleIdToken(String idTokenString) {
        try {
            GoogleIdToken idToken = googleVerifier.verify(idTokenString);
            if (idToken == null) {
                throw new IllegalArgumentException("Invalid Google ID token");
            }

            Payload payload = idToken.getPayload();
            String clientId = appProperties.getOauth().getGoogle().getClientId();
            if (StringUtils.hasText(clientId) && !clientId.equals(payload.getAuthorizedParty())) {
                throw new IllegalArgumentException("Token not issued for configured client");
            }

            String externalId = payload.getSubject();
            String email = payload.getEmail();
            String picture = (String) payload.get("picture");
            String name = (String) payload.get("name");

            UserAccount account = userAccountRepository
                    .findByProviderAndExternalId(UserProvider.GOOGLE, externalId)
                    .orElseGet(() -> createUser(UserProvider.GOOGLE, externalId, email, name, picture));

            if (picture != null && !picture.equals(account.getAvatarUrl())) {
                account.setAvatarUrl(picture);
            }
            if (name != null && !name.equals(account.getDisplayName())) {
                account.setDisplayName(name);
            }

            return userAccountRepository.save(account);
        } catch (GeneralSecurityException | java.io.IOException e) {
            throw new IllegalArgumentException("Failed to verify Google token", e);
        }
    }

    public UserAccount exchangeGithubCode(String code, String redirectUri) {
        Map<String, Object> tokenResponse = null;
        try {
            tokenResponse = githubOAuthClient.post()
                    .uri("/login/oauth/access_token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                            "client_id", appProperties.getOauth().getGithub().getClientId(),
                            "client_secret", appProperties.getOauth().getGithub().getClientSecret(),
                            "code", code,
                            "redirect_uri", redirectUri
                    ))
                    .retrieve()
                    .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
        } catch (Exception e) {
            throw new IllegalStateException("GitHub token exchange failed: " + e.getMessage(), e);
        }

        if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
            String error = tokenResponse != null ? tokenResponse.toString() : "null response";
            throw new IllegalStateException("GitHub token exchange failed. Response: " + error);
        }

        String accessToken = (String) tokenResponse.get("access_token");

        Map<String, Object> userResponse = githubWebClient.get()
                .uri("/user")
                .headers(headers -> headers.setBearerAuth(accessToken))
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (userResponse == null) {
            throw new IllegalStateException("GitHub user fetch failed");
        }

        String login = (String) userResponse.get("login");
        Integer id = (Integer) userResponse.get("id");
        String avatarUrl = (String) userResponse.get("avatar_url");
        String name = (String) userResponse.get("name");

        UserAccount account = userAccountRepository
                .findByProviderAndExternalId(UserProvider.GITHUB, String.valueOf(id))
                .orElseGet(() -> createUser(UserProvider.GITHUB, String.valueOf(id), login, name, avatarUrl));

        account.setGithubAccessToken(accessToken);
        if (avatarUrl != null) {
            account.setAvatarUrl(avatarUrl);
        }
        if (name != null) {
            account.setDisplayName(name);
        }

        return userAccountRepository.save(account);
    }

    public List<GitHubRepoResponse> fetchGitHubRepos(UserAccount user) {
        if (!StringUtils.hasText(user.getGithubAccessToken())) {
            throw new IllegalStateException("GitHub access token not available");
        }

        Mono<List<Map<String, Object>>> reposMono = githubWebClient.get()
                .uri("/user/repos")
                .headers(headers -> headers.setBearerAuth(user.getGithubAccessToken()))
                .retrieve()
                .bodyToFlux(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList();

        List<Map<String, Object>> repos = reposMono.block();
        if (repos == null) {
            return List.of();
        }

        return repos.stream()
                .map(repo -> new GitHubRepoResponse(
                        (String) repo.get("name"),
                        (String) repo.get("html_url"),
                        (String) repo.get("url")
                ))
                .toList();
    }

    private UserAccount createUser(UserProvider provider,
                                   String externalId,
                                   String username,
                                   String displayName,
                                   String avatarUrl) {
        UserAccount user = new UserAccount();
        user.setProvider(provider);
        user.setExternalId(externalId);
        user.setUsername(generateUsername(username));
        user.setDisplayName(displayName);
        user.setAvatarUrl(avatarUrl);
        return user;
    }

    private String generateUsername(String base) {
        if (!StringUtils.hasText(base)) {
            base = "user";
        }
        String candidate = base.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_]", "");
        if (!StringUtils.hasText(candidate)) {
            candidate = "user";
        }
        String unique = candidate;
        int counter = 1;
        while (userAccountRepository.findByUsernameIgnoreCase(unique).isPresent()) {
            unique = candidate + counter++;
        }
        return unique;
    }
}
