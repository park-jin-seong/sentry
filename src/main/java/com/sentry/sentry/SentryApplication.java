package com.sentry.sentry;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;


@SpringBootApplication(exclude = SecurityAutoConfiguration.class)
public class SentryApplication {

	public static void main(String[] args) {
		SpringApplication.run(SentryApplication.class, args);
	}

}
