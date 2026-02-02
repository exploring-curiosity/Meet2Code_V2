package com.m2c.app.web;

import com.m2c.app.config.AppProperties;
import com.m2c.app.domain.user.UserAccount;
import com.m2c.app.domain.user.UserProvider;
import com.m2c.app.repository.UserAccountRepository;
import com.m2c.app.service.CurrentUserService;
import com.m2c.app.service.OAuthService;
import com.m2c.app.web.dto.GitHubRepoResponse;
import com.m2c.app.web.dto.GoogleLoginRequest;
import com.m2c.app.web.session.SessionUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/oauth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final OAuthService oAuthService;
    private final CurrentUserService currentUserService;
    private final AppProperties appProperties;
    private final UserAccountRepository userAccountRepository;

    @GetMapping("/isloggedin")
    public ResponseEntity<Map<String, Object>> isLoggedIn(HttpServletRequest request) {
        return currentUserService.getAuthenticatedUser(request)
                .map(user -> ResponseEntity.ok(responseForUser(user, true)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("loggedin", false)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        currentUserService.clearSession(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/google")
    public ResponseEntity<Map<String, Object>> google(@Valid @RequestBody GoogleLoginRequest requestBody,
                                                      HttpServletRequest httpRequest) {
        UserAccount account = oAuthService.authenticateGoogleIdToken(requestBody.getIdToken());
        SessionUser sessionUser = currentUserService.establishSession(httpRequest, account);
        Map<String, Object> payload = responseForUser(account, true);
        payload.put("session", sessionUser);
        return ResponseEntity.ok(payload);
    }

    @PostMapping("/mock")
    public ResponseEntity<Map<String, Object>> mockLogin(@RequestParam("username") String username,
                                                         @RequestParam(value = "displayName", required = false) String displayName,
                                                         HttpServletRequest httpRequest) {
        String normalized = normalizeUsername(username);
        UserAccount account = userAccountRepository
                .findByProviderAndExternalId(UserProvider.MOCK, normalized)
                .orElseGet(() -> createMockUser(normalized, displayName));
        SessionUser sessionUser = currentUserService.establishSession(httpRequest, account);
        Map<String, Object> payload = responseForUser(account, true);
        payload.put("session", sessionUser);
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/github")
    public ResponseEntity<Void> githubAuthorize(@RequestParam(value = "redirect_uri", required = false) String redirectUri) {
        String clientId = appProperties.getOauth().getGithub().getClientId();
        String callback = redirectUri != null ? redirectUri : "http://localhost:3000/oauth/github/callback";
        URI location = URI.create("https://github.com/login/oauth/authorize?client_id=" + clientId + "&scope=public_repo&redirect_uri=" + callback);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(location)
                .build();
    }

    @GetMapping("/github/callback")
    public ResponseEntity<Map<String, Object>> githubCallback(@RequestParam("code") String code,
                                                              @RequestParam(value = "redirect_uri", required = false) String redirectUri,
                                                              HttpServletRequest request) {
        String callback = redirectUri != null ? redirectUri : "http://localhost:3000/oauth/github/callback";
        UserAccount account = oAuthService.exchangeGithubCode(code, callback);
        SessionUser sessionUser = currentUserService.establishSession(request, account);
        Map<String, Object> payload = responseForUser(account, true);
        payload.put("session", sessionUser);
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/github/repos")
    public ResponseEntity<List<GitHubRepoResponse>> githubRepos(HttpServletRequest request) {
        return currentUserService.getAuthenticatedUser(request)
                .map(user -> ResponseEntity.ok(oAuthService.fetchGitHubRepos(user)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    private Map<String, Object> responseForUser(UserAccount user, boolean loggedIn) {
        Map<String, Object> userPayload = new HashMap<>();
        userPayload.put("id", user.getId());
        userPayload.put("login", user.getUsername());
        userPayload.put("imageUrl", user.getAvatarUrl());
        userPayload.put("displayName", user.getDisplayName());

        Map<String, Object> response = new HashMap<>();
        response.put("loggedin", loggedIn);
        response.put("user", userPayload);
        return response;
    }

    private UserAccount createMockUser(String normalizedUsername, String displayName) {
        UserAccount user = new UserAccount();
        user.setProvider(UserProvider.MOCK);
        user.setExternalId(normalizedUsername);
        user.setUsername(ensureUniqueUsername(normalizedUsername));
        user.setDisplayName(displayName != null ? displayName : normalizedUsername);
        return userAccountRepository.save(user);
    }

    private String normalizeUsername(String raw) {
        String trimmed = raw == null ? "" : raw.trim().toLowerCase();
        String normalized = trimmed.replaceAll("[^a-z0-9_]", "");
        return normalized.isBlank() ? "mockuser" : normalized;
    }

    private String ensureUniqueUsername(String base) {
        String candidate = base;
        int counter = 1;
        while (userAccountRepository.findByUsernameIgnoreCase(candidate).isPresent()) {
            candidate = base + counter++;
        }
        return candidate;
    }
}
