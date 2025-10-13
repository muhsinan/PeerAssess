module.exports = {
  apps: [
    {
      name: 'peer-assessment-tool',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        // Database Configuration
        DB_USER: 'peerassess_user',
        DB_HOST: '192.168.3.8',
        DB_NAME: 'peerassess_local',
        DB_PASSWORD: '1516',
        DB_PORT: '5432',
        // Application Configuration
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        // OpenAI Configuration (replace with your actual key)
        NEXT_PUBLIC_OPENAI_API_KEY: 'your_openai_api_key_here',
        // EmailJS Configuration (replace with your actual keys)
        NEXT_PUBLIC_EMAILJS_SERVICE_ID: 'your_emailjs_service_id_here',
        NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: 'your_emailjs_template_id_here',
        NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: 'your_emailjs_public_key_here',
        // SendGrid Configuration (fallback - replace with your actual key)
        SENDGRID_API_KEY: 'your_sendgrid_api_key_here',
        // JWT Secret (replace with a secure secret)
        JWT_SECRET: 'your_jwt_secret_here',
        // NextAuth Configuration (if using NextAuth)
        NEXTAUTH_SECRET: 'your_nextauth_secret_here',
        NEXTAUTH_URL: 'http://localhost:3000'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Database Configuration
        DB_USER: 'peerassess_user',
        DB_HOST: '192.168.3.8',
        DB_NAME: 'peerassess_local',
        DB_PASSWORD: '1516',
        DB_PORT: '5432',
        // Application Configuration (update with your production URL)
        NEXT_PUBLIC_APP_URL: 'https://your-production-domain.com',
        // OpenAI Configuration (replace with your actual key)
        NEXT_PUBLIC_OPENAI_API_KEY: 'your_openai_api_key_here',
        // EmailJS Configuration (replace with your actual keys)
        NEXT_PUBLIC_EMAILJS_SERVICE_ID: 'your_emailjs_service_id_here',
        NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: 'your_emailjs_template_id_here',
        NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: 'your_emailjs_public_key_here',
        // SendGrid Configuration (fallback - replace with your actual key)
        SENDGRID_API_KEY: 'your_sendgrid_api_key_here',
        // JWT Secret (replace with a secure secret)
        JWT_SECRET: 'your_jwt_secret_here',
        // NextAuth Configuration (if using NextAuth)
        NEXTAUTH_SECRET: 'your_nextauth_secret_here',
        NEXTAUTH_URL: 'https://your-production-domain.com'
      }
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/peer-assessment-tool.git',
      path: '/var/www/production',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}; 