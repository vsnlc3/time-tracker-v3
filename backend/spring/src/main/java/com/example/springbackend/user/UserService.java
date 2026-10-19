package com.example.springbackend.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.springbackend.security.GoogleUserClaims;

@Service
/** Google アカウントとアプリケーション利用者の作成・プロフィール同期を担います。 */
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    /**
     * subject をキーに利用者を検索し、既存ならプロフィールを更新、新規なら登録します。
     * @param claims Google 認証から得た識別子とプロフィール
     * @return 保存または更新された利用者
     */
    public User findOrCreateFromGoogle(GoogleUserClaims claims) {
        return userRepository.findByGoogleSubject(claims.subject())
                .map(user -> {
                    user.updateProfile(claims.email(), claims.displayName());
                    return user;
                })
                .orElseGet(() -> userRepository.save(
                        new User(claims.subject(), claims.email(), claims.displayName())));
    }
}
