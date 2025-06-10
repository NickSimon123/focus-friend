# FocusFriend

A modern web application for managing your schedule, focus sessions, and mood tracking.

## Features

- Schedule management with Outlook Calendar integration
- Focus timer with customizable sessions
- Mood tracking
- Weekly and daily views
- Modern, responsive design

## Deployment

This project is deployed on Vercel. To deploy your own version:

1. Fork this repository
2. Create a Vercel account at https://vercel.com
3. Install Vercel CLI: `npm i -g vercel`
4. Run `vercel` in the project directory
5. Follow the prompts to deploy

## Environment Variables

Create a `.env` file with the following variables:

```
VITE_AZURE_CLIENT_ID=your_azure_client_id
VITE_AZURE_TENANT_ID=your_azure_tenant_id
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## License

MIT 