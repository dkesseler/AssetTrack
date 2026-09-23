package com.contoso.workforce;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class HttpClientsConfig {

    @Bean
    public RestClient notificationsClient(
            @org.springframework.beans.factory.annotation.Value("${notifications.svc.url}") String baseUrl) {
        return RestClient.builder().baseUrl(baseUrl).build();
    }

    @Bean
    public RestClient auditClient(
            @org.springframework.beans.factory.annotation.Value("${audit.svc.url}") String baseUrl) {
        return RestClient.builder().baseUrl(baseUrl).build();
    }
}
