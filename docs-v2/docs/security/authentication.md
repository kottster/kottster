# Authentication

While your Kottster app is self-hosted and keeps all database credentials, connections, and business logic within your own app, user authentication and access control are handled by our platform.

## How authentication works

### Centralized authentication service

User management functions are processed through our platform:

- **User sign-in**: Handled by [web.kottster.app](https://web.kottster.app)
- **Session management**: JWT tokens issued by our platform
- **User profile management**: Centralized user data storage
- **Access control**: Basic role management
- **Invitation system**: Invite users to join your app

### Token-based flow

When users authenticate, they receive JWT tokens that your self-hosted app validates locally. Your app verifies these tokens without needing to communicate with our servers for each request, ensuring fast performance and reducing external dependencies during normal operation.

**How token verification works**: Your Kottster app can verify tokens issued by out paltform because the secret key used for token signing is stored in both our platform database and your app configuration. This shared secret enables your app to validate tokens independently while maintaining security.

## Trade-offs of this approach

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

The `postAuthMiddleware` allows you to add custom security checks after the standard JWT validation but before requests reach your application logic. It expects an Express-style middleware function that receives the request, response, and next callback.

Example of custom middleware that validates user status with an external API:

```javascript
import { createApp } from '@kottster/server';
import { dataSourceRegistry } from './data-sources/registry';
import schema from '../../kottster-app.json';
import axios from 'axios';

export const app = createApp({
  schema,
  secretKey: process.env.SECRET_KEY,
  postAuthMiddleware: async (req, res, next) => {
    try {
      const { user } = req; // User already attached by JWT middleware
      
      // Make request to your external API to validate user status
      const response = await axios.get(`https://api.example.com/users/${user.id}/status`);
      
      if (!response.data.success) {
        return res.status(403).json({ 
          error: 'User not authorized by external service' 
        });
      }
      
      next();
    } catch (error) {
      console.error('External validation failed:', error.message);
      return res.status(500).json({ 
        error: 'Failed to validate user with external service' 
      });
    }
  }
});

app.registerDataSources(dataSourceRegistry);
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