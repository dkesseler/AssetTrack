package com.contoso.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Base64;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class JwtIssuer {

    @Value("${jwt.issuer:assettrack-auth-svc}")
    private String issuer;

    @Value("${jwt.ttl.seconds:3600}")
    private long ttlSeconds;

    private KeyPair keyPair;

    @PostConstruct
    public void init() throws Exception {
        // For a teaching codebase the key is generated on startup. A real service would
        // load a persistent key from a secrets store.
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        keyPair = kpg.generateKeyPair();
    }

    public String issue(String username, String role) {
        Date now = new Date();
        return Jwts.builder()
                .setIssuer(issuer)
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + ttlSeconds * 1000L))
                .signWith((RSAPrivateKey) keyPair.getPrivate(), SignatureAlgorithm.RS256)
                .compact();
    }

    public Map<String, Object> jwks() {
        RSAPublicKey pub = (RSAPublicKey) keyPair.getPublic();
        Map<String, Object> key = new LinkedHashMap<>();
        key.put("kty", "RSA");
        key.put("use", "sig");
        key.put("alg", "RS256");
        key.put("kid", "assettrack-auth-1");
        key.put("n", Base64.getUrlEncoder().withoutPadding().encodeToString(pub.getModulus().toByteArray()));
        key.put("e", Base64.getUrlEncoder().withoutPadding().encodeToString(pub.getPublicExponent().toByteArray()));
        return Map.of("keys", new Object[]{ key });
    }
}
