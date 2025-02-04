FROM node:22-alpine

# Install dependencies
RUN npm install -g @kottster/cli

# Create app directory
WORKDIR /app

# Create entrypoint script
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'if [ -z "$(ls -A /app)" ]; then' >> /entrypoint.sh && \
    echo '    echo "Empty directory detected. Running '\''kottster new'\''..."' >> /entrypoint.sh && \
    echo '    kottster new' >> /entrypoint.sh && \
    echo 'else' >> /entrypoint.sh && \
    echo '    if [ "$KOTTSTER_MODE" = "production" ]; then' >> /entrypoint.sh && \
    echo '        echo "Running Kottster in production mode..."' >> /entrypoint.sh && \
    echo '        kottster prod' >> /entrypoint.sh && \
    echo '    else' >> /entrypoint.sh && \
    echo '        echo "Running Kottster in development mode..."' >> /entrypoint.sh && \
    echo '        kottster dev' >> /entrypoint.sh && \
    echo '    fi' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Set environment variable for production mode (default to development)
ENV KOTTSTER_MODE=development

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]