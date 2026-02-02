package com.m2c.app.service;

import com.m2c.app.domain.user.UserAccount;
import com.m2c.app.repository.UserAccountRepository;
import com.m2c.app.web.session.SessionUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

import static com.m2c.app.web.session.SessionUserResolver.SESSION_KEY;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserAccountRepository userAccountRepository;

    public Optional<UserAccount> getAuthenticatedUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return Optional.empty();
        }
        Object attribute = session.getAttribute(SESSION_KEY);
        if (attribute instanceof SessionUser sessionUser) {
            return userAccountRepository.findById(sessionUser.id());
        }
        return Optional.empty();
    }

    public SessionUser establishSession(HttpServletRequest request, UserAccount user) {
        SessionUser sessionUser = new SessionUser(user.getId(), user.getUsername(), user.getDisplayName(), user.getAvatarUrl());
        request.getSession(true).setAttribute(SESSION_KEY, sessionUser);
        return sessionUser;
    }

    public void clearSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    public Optional<UserAccount> findById(UUID id) {
        return userAccountRepository.findById(id);
    }
}
