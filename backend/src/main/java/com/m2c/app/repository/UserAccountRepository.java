package com.m2c.app.repository;

import com.m2c.app.domain.user.UserAccount;
import com.m2c.app.domain.user.UserProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {
    Optional<UserAccount> findByProviderAndExternalId(UserProvider provider, String externalId);

    Optional<UserAccount> findByUsernameIgnoreCase(String username);
}
