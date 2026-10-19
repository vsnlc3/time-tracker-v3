package com.example.springbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
/** Spring Boot アプリケーションの起動点です。コンポーネント走査と自動設定もここから始まります。 */
public class SpringBackendApplication {

    /** アプリケーションコンテキストを作成し、Web サーバーを起動します。 */
    public static void main(String[] args) {
        SpringApplication.run(SpringBackendApplication.class, args);
    }
}
