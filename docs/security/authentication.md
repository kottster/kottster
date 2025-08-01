---
description: "User authentication and access control in Kottster apps. Learn how authentication works, the benefits of centralized authentication, and how to implement custom security middleware."
---

# Authentication

While your Kottster app is self-hosted and keeps all database credentials, connections, and business logic within your own app, user authentication and access control are handled by our platform.

## How authentication works

### Centralized authentication service

User management functions are processed through our platform:

- **User sign-in and sign-up**: Handled by [web.kottster.app](https://web.kottster.app)
- **Session management**: JWT tokens issued by our platform
- **User profile management**: Centralized user data storage
- **Access control**: Assign roles and permissions to users
- **Invitation system**: Invite users to join your app
- **Billing management**: Manage billing and subscription plans

### Token-based flow

When users authenticate, they receive JWT tokens stored in localStorage. For each request, your Kottster app validates the token and fetches the user's current permissions from our external service.

Permission data is cached for several minutes to reduce external API calls and improve performance.

## Strengths and limitations

### Benefits

**Simplified development**: You don't need to implement and maintain user authentication logic, as it's handled by our platform.

**Always up-to-date security**: Since authentication isn't self-hosted, we maintain and update security measures continuously. This includes reCAPTCHA protection, DDoS mitigation, and other security defenses that are enabled by default without any configuration needed on your part.

**Automatic security patches**: Authentication security updates and improvements are automatically available without requiring app updates or maintenance windows.

**Consistent experience**: Users have a unified login experience across all your Kottster apps.

**Reduced complexity**: Focus on your business logic instead of authentication infrastructure.

### Considerations

**External dependency**: User authentication relies on our platform services being available.

**Limited customization**: Standard authentication flows may not accommodate highly specialized requirements.

**Data location**: User account data is stored on our platform rather than your infrastructure.

## Enhanced security options

If your application requires additional security validation or custom authorization logic, you can implement the `postAuthMiddleware` option in your app configuration.

### Custom validation middleware

The `postAuthMiddleware` allows you to add custom security checks after the standard JWT validation but before requests reach your application logic. You should provide a function that performs additional validation and throws an error if the validation fails.

**The middleware function receives two parameters**:
- `user` - The authenticated user object containing `id` and `email` properties
- `req` - The <a rel='nofollow' target='_blank' href='https://expressjs.com/en/api.html#req'>Express request object</a> with all standard Express request properties and methods

Example of custom middleware that validates user status with an external API:

```javascript [app/_server/app.js]
import { createApp } from '@kottster/server';
import schema from '../../kottster-app.json';
import axios from 'axios';

export const app = createApp({
  schema,
  secretKey: process.env.SECRET_KEY,
  postAuthMiddleware: async (user, req) => {
    // Make request to your external API to validate user status
    const response = await axios.get(`https://api.example.com/users/${user.id}/status`);
    
    if (!response.data.success) {
      throw new Error('User not authorized by external service');
    }

    return true;
  }
});
```

### Use cases for additional security middleware

**External authorization systems**: Validate users against enterprise identity providers or custom authorization services.

**Dynamic permissions**: Implement role-based access control that changes based on external factors.

**Audit logging**: Add custom logging for security compliance requirements.

**Rate limiting**: Implement user-specific rate limiting or usage tracking.

**Multi-factor validation**: Add additional security checks beyond the standard authentication.

**IP whitelisting**: Restrict access based on user IP addresses or geolocation.

## Custom authentication providers

For organizations that require integration with existing identity management systems, Enterprise customers can configure their Kottster apps to work with alternative authentication providers including self-hosted solutions, Clerk, Auth0, and other popular identity providers. 

This option is available exclusively with [Enterprise plan](https://kottster.app/pricing) and includes dedicated support for integration setup.